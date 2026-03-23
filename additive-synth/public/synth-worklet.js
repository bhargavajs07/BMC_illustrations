// Additive Synthesizer AudioWorklet Processor
// Manual phase accumulator: φ = (φ + Δφ) mod 1.0
// Periodic phase normalization every ~1 second to prevent Float64 precision degradation
// 32 harmonics per voice, sample-accurate re-triggering from current gain level
// Soft-clip compressor with look-ahead buffer + smoothed gain-reduction envelope

const TWO_PI = 2 * Math.PI;
const MAX_HARMONICS = 32;
const MAX_VOICES = 16;
const SINE_TABLE_SIZE = 4096;
const LOOK_AHEAD_SAMPLES = 64;

// Pre-compute sine lookup table with linear interpolation support
const SINE_TABLE = new Float32Array(SINE_TABLE_SIZE + 1);
for (let i = 0; i <= SINE_TABLE_SIZE; i++) {
  SINE_TABLE[i] = Math.sin((i / SINE_TABLE_SIZE) * TWO_PI);
}

function fastSin(phase) {
  const idx = phase * SINE_TABLE_SIZE;
  const i = idx | 0;
  const frac = idx - i;
  return SINE_TABLE[i] + frac * (SINE_TABLE[i + 1] - SINE_TABLE[i]);
}

class Voice {
  constructor() {
    this.active = false;
    this.noteId = -1;
    this.frequency = 440;
    this.velocity = 1.0;
    this.phases = new Float64Array(MAX_HARMONICS);
    this.envStage = 0; // 0=off, 1=attack, 2=decay, 3=sustain, 4=release
    this.envTime = 0;
    this.envLevel = 0;
    this.releaseStartLevel = 0;
    this.interpolatedHarmonics = null;
    this.interpolatedDecayMul = 1.0;
    this.phaseResetCounter = 0;
  }
}

function cubicBezierY(t, y0, y1, y2, y3) {
  const mt = 1 - t;
  return mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
}

function evaluateBezierCurve(points, x) {
  if (!points || points.length < 2) return 0.5;
  if (x <= points[0].x) return points[0].y;
  if (x >= points[points.length - 1].x) return points[points.length - 1].y;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p3 = points[i + 1];
    if (x >= p0.x && x <= p3.x) {
      const dx = p3.x - p0.x;
      if (dx < 1e-6) return p3.y;
      const t = (x - p0.x) / dx;
      const cp1y = p0.cpOut ? p0.cpOut.y : p0.y;
      const cp2y = p3.cpIn ? p3.cpIn.y : p3.y;
      return cubicBezierY(t, p0.y, cp1y, cp2y, p3.y);
    }
  }
  return points[points.length - 1].y;
}

function softClip(sample, threshold, knee, ratio) {
  const absS = Math.abs(sample);
  if (absS <= threshold - knee * 0.5) return sample;
  const sign = sample >= 0 ? 1 : -1;
  if (absS <= threshold + knee * 0.5) {
    const x = absS - threshold + knee * 0.5;
    return sign * (absS + ((1.0 / ratio - 1.0) * x * x) / (2.0 * knee + 1e-8));
  }
  return sign * (threshold + (absS - threshold) / ratio);
}

class AdditiveSynthProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.voices = [];
    for (let i = 0; i < MAX_VOICES; i++) {
      this.voices.push(new Voice());
    }

    this.harmonicAmps = new Float32Array(MAX_HARMONICS);
    for (let i = 0; i < MAX_HARMONICS; i++) {
      this.harmonicAmps[i] = 1.0 / (i + 1);
    }

    this.envPoints = [
      { x: 0, y: 0, cpOut: { x: 0.01, y: 0.8 } },
      { x: 0.05, y: 1.0, cpIn: { x: 0.03, y: 1.0 }, cpOut: { x: 0.15, y: 0.9 } },
      { x: 0.3, y: 0.7, cpIn: { x: 0.2, y: 0.7 }, cpOut: { x: 0.5, y: 0.7 } },
      { x: 2.0, y: 0, cpIn: { x: 1.5, y: 0.1 } },
    ];
    this.sustainIdx = 2;

    this.decayMultPoints = [
      { x: 0, y: 1.0, cpOut: { x: 0.33, y: 1.0 } },
      { x: 1, y: 1.0, cpIn: { x: 0.67, y: 1.0 } },
    ];

    this.compThreshold = 0.8;
    this.compKnee = 0.1;
    this.compRatio = 4.0;

    // Look-ahead buffer for compressor: delays audio to allow gain reduction to anticipate peaks
    this.lookAheadBuf = new Float32Array(LOOK_AHEAD_SAMPLES);
    this.lookAheadIdx = 0;
    this.smoothedGR = 1.0;

    this.keyframes = [];

    this.sr = sampleRate;
    this.invSR = 1.0 / sampleRate;
    // Phase normalization interval: every ~1 second worth of samples
    this.phaseNormInterval = Math.floor(sampleRate);

    this.samplesSinceReport = 0;
    this.peakSinceReport = 0;

    this.port.onmessage = (e) => this.onMessage(e.data);
  }

  onMessage(msg) {
    switch (msg.type) {
      case 'noteOn': {
        const v = this.allocateVoice(msg.noteId);
        const prevLevel = v.envLevel;
        v.active = true;
        v.noteId = msg.noteId;
        v.frequency = msg.frequency;
        v.velocity = msg.velocity != null ? msg.velocity : 1.0;
        v.envStage = 1;
        v.envTime = 0;
        v.envLevel = prevLevel;
        v.releaseStartLevel = 0;
        v.phaseResetCounter = 0;

        if (this.keyframes.length >= 2) {
          v.interpolatedHarmonics = this.interpolateKeyframeHarmonics(msg.frequency);
        } else {
          v.interpolatedHarmonics = null;
        }
        v.interpolatedDecayMul = this.getDecayMultiplier(msg.frequency);
        break;
      }
      case 'noteOff': {
        for (const v of this.voices) {
          if (v.active && v.noteId === msg.noteId && v.envStage !== 4 && v.envStage !== 0) {
            v.envStage = 4;
            v.releaseStartLevel = v.envLevel;
            v.envTime = 0;
            break;
          }
        }
        break;
      }
      case 'setHarmonics': {
        for (let i = 0; i < MAX_HARMONICS; i++) {
          this.harmonicAmps[i] = msg.amplitudes[i] ?? 0;
        }
        break;
      }
      case 'setEnvelope': {
        this.envPoints = msg.points;
        this.sustainIdx = msg.sustainIndex ?? 2;
        break;
      }
      case 'setDecayMultiplier': {
        this.decayMultPoints = msg.points;
        break;
      }
      case 'setCompressor': {
        this.compThreshold = msg.threshold ?? 0.8;
        this.compKnee = msg.knee ?? 0.1;
        this.compRatio = msg.ratio ?? 4.0;
        break;
      }
      case 'setKeyframes': {
        this.keyframes = msg.keyframes || [];
        break;
      }
    }
  }

  getDecayMultiplier(frequency) {
    const norm = Math.max(0, Math.min(1, (frequency - 27.5) / (4186.0 - 27.5)));
    return Math.max(0.1, evaluateBezierCurve(this.decayMultPoints, norm));
  }

  interpolateKeyframeHarmonics(frequency) {
    const kfs = this.keyframes;
    if (!kfs.length) return null;
    if (kfs.length === 1) return new Float32Array(kfs[0].harmonics);

    if (frequency <= kfs[0].frequency) return new Float32Array(kfs[0].harmonics);
    if (frequency >= kfs[kfs.length - 1].frequency) return new Float32Array(kfs[kfs.length - 1].harmonics);

    let lo = kfs[0], hi = kfs[1];
    for (let i = 0; i < kfs.length - 1; i++) {
      if (frequency >= kfs[i].frequency && frequency <= kfs[i + 1].frequency) {
        lo = kfs[i]; hi = kfs[i + 1]; break;
      }
    }

    const t = (frequency - lo.frequency) / (hi.frequency - lo.frequency + 1e-8);
    const result = new Float32Array(MAX_HARMONICS);
    for (let h = 0; h < MAX_HARMONICS; h++) {
      result[h] = lo.harmonics[h] * (1 - t) + hi.harmonics[h] * t;
    }
    return result;
  }

  allocateVoice(noteId) {
    for (const v of this.voices) {
      if (v.noteId === noteId && v.active) return v;
    }
    for (const v of this.voices) {
      if (!v.active) return v;
    }
    let best = this.voices[0], bestLevel = Infinity;
    for (const v of this.voices) {
      if (v.envStage === 4 && v.envLevel < bestLevel) {
        bestLevel = v.envLevel; best = v;
      }
    }
    if (bestLevel === Infinity) {
      let oldest = 0;
      for (const v of this.voices) {
        if (v.envTime > oldest) { oldest = v.envTime; best = v; }
      }
    }
    best.phases.fill(0);
    return best;
  }

  computeEnvelope(voice) {
    const pts = this.envPoints;
    if (!pts || pts.length < 2) return 0;
    const dm = voice.interpolatedDecayMul || 1.0;
    const vel = voice.velocity;

    switch (voice.envStage) {
      case 1: {
        const attackDur = pts[1].x;
        if (attackDur <= 0) {
          voice.envStage = 2; voice.envTime = 0;
          return pts[1].y * vel;
        }
        const t = Math.min(1, voice.envTime / attackDur);
        const start = voice.envLevel;
        const target = pts[1].y * vel;
        const s = t * t * (3 - 2 * t);
        if (t >= 1) { voice.envStage = 2; voice.envTime = 0; return target; }
        return start + (target - start) * s;
      }
      case 2: {
        const si = Math.min(this.sustainIdx, pts.length - 1);
        const decayDur = (pts[si].x - pts[1].x) / dm;
        if (decayDur <= 0) { voice.envStage = 3; return pts[si].y * vel; }
        const t = Math.min(1, voice.envTime / decayDur);
        const peak = pts[1].y * vel;
        const sus = pts[si].y * vel;
        const s = t * t * (3 - 2 * t);
        if (t >= 1) { voice.envStage = 3; return sus; }
        return peak + (sus - peak) * s;
      }
      case 3: {
        return pts[Math.min(this.sustainIdx, pts.length - 1)].y * vel;
      }
      case 4: {
        const si = Math.min(this.sustainIdx, pts.length - 1);
        const relDur = (pts[pts.length - 1].x - pts[si].x) / dm;
        if (relDur <= 0) { voice.active = false; voice.envStage = 0; return 0; }
        const t = Math.min(1, voice.envTime / relDur);
        if (t >= 1) { voice.active = false; voice.envStage = 0; return 0; }
        return voice.releaseStartLevel * (1 - t * t * (3 - 2 * t));
      }
    }
    return 0;
  }

  process(inputs, outputs) {
    const output = outputs[0];
    const outL = output[0];
    const outR = output[1];
    if (!outL) return true;

    const len = outL.length;
    const invSR = this.invSR;
    const nyquistLimit = this.sr * 0.45;
    const normInterval = this.phaseNormInterval;

    for (let s = 0; s < len; s++) {
      let mix = 0;

      for (let vi = 0; vi < this.voices.length; vi++) {
        const v = this.voices[vi];
        if (!v.active) continue;

        const env = this.computeEnvelope(v);
        v.envLevel = env;
        v.envTime += invSR;

        if (!v.active || env < 1e-6) continue;

        const harms = v.interpolatedHarmonics || this.harmonicAmps;
        const freq = v.frequency;
        let voiceSample = 0;

        // Increment phase reset counter
        v.phaseResetCounter++;
        const shouldNormalize = v.phaseResetCounter >= normInterval;
        if (shouldNormalize) v.phaseResetCounter = 0;

        for (let h = 0; h < MAX_HARMONICS; h++) {
          const amp = harms[h];
          if (amp < 1e-5) continue;

          const harmFreq = freq * (h + 1);
          if (harmFreq > nyquistLimit) break;

          const dphi = harmFreq * invSR;

          // Manual phase accumulator: φ = (φ + Δφ) mod 1.0
          let phase = v.phases[h] + dphi;
          if (phase >= 1.0) phase -= 1.0;
          if (phase >= 1.0) phase %= 1.0;

          // Explicit normalization every ~1 second to guarantee no Float64 drift
          if (shouldNormalize) {
            phase = phase - Math.floor(phase);
          }

          v.phases[h] = phase;
          voiceSample += amp * fastSin(phase);
        }

        mix += voiceSample * env;
      }

      // Soft-clip compression stage
      mix = softClip(mix, this.compThreshold, this.compKnee, this.compRatio);

      // Look-ahead compressor: write current sample to delay buffer,
      // use it to compute future peak for anticipatory gain reduction
      const laIdx = this.lookAheadIdx;
      const delayed = this.lookAheadBuf[laIdx];
      this.lookAheadBuf[laIdx] = mix;
      this.lookAheadIdx = (laIdx + 1) % LOOK_AHEAD_SAMPLES;

      // Scan ahead for peak in buffer to anticipate loud transients
      let futurePeak = 0;
      for (let i = 0; i < LOOK_AHEAD_SAMPLES; i++) {
        const abs = Math.abs(this.lookAheadBuf[i]);
        if (abs > futurePeak) futurePeak = abs;
      }

      const targetGR = futurePeak > 1.0 ? 1.0 / futurePeak : 1.0;
      const coeff = targetGR < this.smoothedGR ? 0.02 : 0.0003;
      this.smoothedGR += (targetGR - this.smoothedGR) * coeff;

      const finalSample = delayed * Math.min(1.0, this.smoothedGR);
      const clamped = Math.max(-1.0, Math.min(1.0, finalSample));

      outL[s] = clamped;
      if (outR) outR[s] = clamped;

      const absOut = Math.abs(clamped);
      if (absOut > this.peakSinceReport) this.peakSinceReport = absOut;
    }

    this.samplesSinceReport += len;
    if (this.samplesSinceReport >= 1470) {
      this.port.postMessage({ type: 'levels', peak: this.peakSinceReport });
      this.peakSinceReport = 0;
      this.samplesSinceReport = 0;
    }

    return true;
  }
}

registerProcessor('additive-synth-processor', AdditiveSynthProcessor);
