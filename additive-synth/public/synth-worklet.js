// Additive Synthesizer AudioWorklet Processor
// Manual phase accumulator with precision fix (phase wraps mod 1.0)
// 32 harmonics per voice, sample-accurate envelope triggering
// Soft-clip compressor with look-ahead smoothed gain reduction

const TWO_PI = 2 * Math.PI;
const MAX_HARMONICS = 32;
const MAX_VOICES = 16;
const SINE_TABLE_SIZE = 4096;

// Pre-compute sine table for performance
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
    this.stealFade = 0;
  }

  reset() {
    this.phases.fill(0);
    this.envStage = 0;
    this.envTime = 0;
    this.envLevel = 0;
    this.releaseStartLevel = 0;
    this.active = false;
    this.interpolatedHarmonics = null;
    this.interpolatedDecayMul = 1.0;
    this.stealFade = 0;
  }
}

function cubicBezierY(t, y0, y1, y2, y3) {
  const mt = 1 - t;
  return mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
}

function evaluateBezierEnvelope(points, time) {
  if (!points || points.length < 2) return 0.5;

  if (time <= points[0].x) return points[0].y;
  if (time >= points[points.length - 1].x) return points[points.length - 1].y;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p3 = points[i + 1];
    if (time >= p0.x && time <= p3.x) {
      const dx = p3.x - p0.x;
      if (dx < 1e-6) return p3.y;
      const t = (time - p0.x) / dx;
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
    const comp = absS + ((1.0 / ratio - 1.0) * x * x) / (2.0 * knee + 1e-8);
    return sign * comp;
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

    // Default envelope: Attack 0.05s, Decay to 0.3s, Sustain at 0.7, Release to 2.0s
    this.envPoints = [
      { x: 0, y: 0, cpOut: { x: 0.01, y: 0.8 } },
      { x: 0.05, y: 1.0, cpIn: { x: 0.03, y: 1.0 }, cpOut: { x: 0.15, y: 0.9 } },
      { x: 0.3, y: 0.7, cpIn: { x: 0.2, y: 0.7 }, cpOut: { x: 0.5, y: 0.7 } },
      { x: 2.0, y: 0, cpIn: { x: 1.5, y: 0.1 } },
    ];
    this.sustainIdx = 2;

    // Decay multiplier curve: frequency (normalized 0-1) => multiplier (0.1 - 10)
    this.decayMultPoints = [
      { x: 0, y: 1.0, cpOut: { x: 0.33, y: 1.0 } },
      { x: 1, y: 1.0, cpIn: { x: 0.67, y: 1.0 } },
    ];

    // Compressor
    this.compThreshold = 0.8;
    this.compKnee = 0.1;
    this.compRatio = 4.0;

    // Smoothed gain reduction for look-ahead style limiting
    this.smoothedGR = 1.0;

    // Keyframes for timbre interpolation
    this.keyframes = [];

    this.sr = sampleRate;
    this.invSR = 1.0 / sampleRate;

    // Level reporting throttle
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
        v.envStage = 1; // attack
        v.envTime = 0;
        // Start attack from current level (re-trigger without pop)
        v.envLevel = prevLevel;
        v.releaseStartLevel = 0;
        v.stealFade = 0;

        if (this.keyframes.length >= 2) {
          v.interpolatedHarmonics = this.interpolateKeyframeHarmonics(msg.frequency);
          v.interpolatedDecayMul = this.getDecayMultiplier(msg.frequency);
        } else {
          v.interpolatedHarmonics = null;
          v.interpolatedDecayMul = this.getDecayMultiplier(msg.frequency);
        }
        break;
      }
      case 'noteOff': {
        for (const v of this.voices) {
          if (v.active && v.noteId === msg.noteId && v.envStage !== 4 && v.envStage !== 0) {
            v.envStage = 4; // release
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
    const minF = 27.5, maxF = 4186.0;
    const norm = Math.max(0, Math.min(1, (frequency - minF) / (maxF - minF)));
    return Math.max(0.1, evaluateBezierEnvelope(this.decayMultPoints, norm));
  }

  interpolateKeyframeHarmonics(frequency) {
    const kfs = this.keyframes;
    if (!kfs.length) return null;
    if (kfs.length === 1) return new Float32Array(kfs[0].harmonics);

    // kfs should already be sorted by frequency
    if (frequency <= kfs[0].frequency) return new Float32Array(kfs[0].harmonics);
    if (frequency >= kfs[kfs.length - 1].frequency) return new Float32Array(kfs[kfs.length - 1].harmonics);

    let lo = kfs[0], hi = kfs[1];
    for (let i = 0; i < kfs.length - 1; i++) {
      if (frequency >= kfs[i].frequency && frequency <= kfs[i + 1].frequency) {
        lo = kfs[i];
        hi = kfs[i + 1];
        break;
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
    // Reuse same-note voice (re-trigger)
    for (const v of this.voices) {
      if (v.noteId === noteId && v.active) return v;
    }
    // Find a free voice
    for (const v of this.voices) {
      if (!v.active) return v;
    }
    // Steal the quietest releasing voice
    let best = this.voices[0];
    let bestLevel = Infinity;
    for (const v of this.voices) {
      if (v.envStage === 4 && v.envLevel < bestLevel) {
        bestLevel = v.envLevel;
        best = v;
      }
    }
    if (bestLevel === Infinity) {
      // steal longest running
      let oldestTime = 0;
      for (const v of this.voices) {
        if (v.envTime > oldestTime) {
          oldestTime = v.envTime;
          best = v;
        }
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
      case 1: { // Attack
        const attackDur = pts[1].x;
        if (attackDur <= 0) {
          voice.envStage = 2;
          voice.envTime = 0;
          return pts[1].y * vel;
        }
        const t = Math.min(1, voice.envTime / attackDur);
        const startLvl = voice.envLevel;
        const targetLvl = pts[1].y * vel;
        // Smooth bezier-shaped attack
        const shaped = t * t * (3 - 2 * t); // smoothstep
        const level = startLvl + (targetLvl - startLvl) * shaped;
        if (t >= 1) {
          voice.envStage = 2;
          voice.envTime = 0;
          return targetLvl;
        }
        return level;
      }
      case 2: { // Decay
        const si = Math.min(this.sustainIdx, pts.length - 1);
        const decayDur = (pts[si].x - pts[1].x) / dm;
        if (decayDur <= 0) {
          voice.envStage = 3;
          return pts[si].y * vel;
        }
        const t = Math.min(1, voice.envTime / decayDur);
        const peakLvl = pts[1].y * vel;
        const susLvl = pts[si].y * vel;
        const shaped = t * t * (3 - 2 * t);
        if (t >= 1) {
          voice.envStage = 3;
          return susLvl;
        }
        return peakLvl + (susLvl - peakLvl) * shaped;
      }
      case 3: { // Sustain
        const si = Math.min(this.sustainIdx, pts.length - 1);
        return pts[si].y * vel;
      }
      case 4: { // Release
        const si = Math.min(this.sustainIdx, pts.length - 1);
        const releaseDur = (pts[pts.length - 1].x - pts[si].x) / dm;
        if (releaseDur <= 0) {
          voice.active = false;
          voice.envStage = 0;
          return 0;
        }
        const t = Math.min(1, voice.envTime / releaseDur);
        if (t >= 1) {
          voice.active = false;
          voice.envStage = 0;
          return 0;
        }
        // Smooth release curve
        const shaped = 1 - t * t * (3 - 2 * t);
        return voice.releaseStartLevel * shaped;
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

    for (let s = 0; s < len; s++) {
      let mix = 0;

      for (let vi = 0; vi < this.voices.length; vi++) {
        const v = this.voices[vi];
        if (!v.active) continue;

        const env = this.computeEnvelope(v);
        v.envLevel = env;
        v.envTime += invSR;

        if (!v.active || env < 1e-6) continue;

        const harmonics = v.interpolatedHarmonics || this.harmonicAmps;
        const freq = v.frequency;
        let voiceSample = 0;

        for (let h = 0; h < MAX_HARMONICS; h++) {
          const amp = harmonics[h];
          if (amp < 1e-5) continue;

          const harmFreq = freq * (h + 1);
          if (harmFreq > nyquistLimit) break;

          const dphi = harmFreq * invSR;
          // Phase accumulator with precision wrap at 1.0
          let phase = v.phases[h] + dphi;
          // Explicit wrap — prevents floating-point drift
          if (phase >= 1.0) phase -= 1.0;
          if (phase >= 1.0) phase %= 1.0; // safety for very high freq
          v.phases[h] = phase;

          voiceSample += amp * fastSin(phase);
        }

        mix += voiceSample * env;
      }

      // Soft-clip compression
      mix = softClip(mix, this.compThreshold, this.compKnee, this.compRatio);

      // Smoothed limiter (look-ahead style gain reduction)
      const absMix = Math.abs(mix);
      const targetGR = absMix > 1.0 ? 1.0 / absMix : 1.0;
      // Asymmetric smoothing: fast attack (0.01), slow release (0.0002)
      const coeff = targetGR < this.smoothedGR ? 0.01 : 0.0002;
      this.smoothedGR += (targetGR - this.smoothedGR) * coeff;
      mix *= Math.min(1.0, this.smoothedGR);

      // Hard clip safety
      mix = Math.max(-1.0, Math.min(1.0, mix));

      outL[s] = mix;
      if (outR) outR[s] = mix;

      // Track peak
      if (absMix > this.peakSinceReport) this.peakSinceReport = absMix;
    }

    // Report levels at ~30Hz
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
