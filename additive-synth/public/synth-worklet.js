// Additive Synthesizer AudioWorklet Processor
// Manual phase accumulator with precision fix (phase wraps at 1.0)
// 32 harmonics per voice, sample-accurate envelope triggering

const TWO_PI = 2 * Math.PI;
const MAX_HARMONICS = 32;
const MAX_VOICES = 16;

class Voice {
  constructor() {
    this.active = false;
    this.noteId = -1;
    this.frequency = 440;
    this.velocity = 1.0;
    this.phases = new Float64Array(MAX_HARMONICS);
    this.envelopePhase = 'off'; // off, attack, decay, sustain, release
    this.envelopeTime = 0;
    this.envelopeLevel = 0;
    this.releaseStartLevel = 0;
    this.targetGain = 0;
  }

  reset() {
    this.phases.fill(0);
    this.envelopePhase = 'off';
    this.envelopeTime = 0;
    this.envelopeLevel = 0;
    this.releaseStartLevel = 0;
    this.active = false;
  }
}

function cubicBezierAt(t, p0, p1, p2, p3) {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

function evaluateBezierEnvelope(points, time) {
  if (!points || points.length < 2) return time < 0.01 ? 1.0 : 0.5;
  
  let segIdx = 0;
  for (let i = 0; i < points.length - 1; i++) {
    if (time >= points[i].x && time <= points[i + 1].x) {
      segIdx = i;
      break;
    }
    if (i === points.length - 2) segIdx = i;
  }
  
  if (time <= points[0].x) return points[0].y;
  if (time >= points[points.length - 1].x) return points[points.length - 1].y;
  
  const p0 = points[segIdx];
  const p3 = points[segIdx + 1];
  const dx = p3.x - p0.x;
  if (dx < 0.0001) return p3.y;
  
  const t = (time - p0.x) / dx;
  
  const cp1 = p0.cpOut || { x: p0.x + dx * 0.33, y: p0.y };
  const cp2 = p3.cpIn || { x: p3.x - dx * 0.33, y: p3.y };
  
  const localCp1Y = cp1.y;
  const localCp2Y = cp2.y;
  
  return cubicBezierAt(t, p0.y, localCp1Y, localCp2Y, p3.y);
}

function softClip(sample, threshold, knee, ratio) {
  const absS = Math.abs(sample);
  if (absS <= threshold - knee / 2) return sample;
  
  const sign = sample >= 0 ? 1 : -1;
  
  if (absS <= threshold + knee / 2) {
    const x = absS - threshold + knee / 2;
    const compressed = absS + ((1 / ratio - 1) * x * x) / (2 * knee);
    return sign * compressed;
  }
  
  const over = absS - threshold;
  const compressed = threshold + over / ratio;
  return sign * compressed;
}

class AdditiveSynthProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    this.voices = [];
    for (let i = 0; i < MAX_VOICES; i++) {
      this.voices.push(new Voice());
    }
    
    this.harmonicAmplitudes = new Float32Array(MAX_HARMONICS);
    for (let i = 0; i < MAX_HARMONICS; i++) {
      this.harmonicAmplitudes[i] = 1.0 / (i + 1);
    }
    
    this.envelopePoints = [
      { x: 0, y: 0, cpOut: { x: 0.01, y: 0.8 } },
      { x: 0.05, y: 1.0, cpIn: { x: 0.03, y: 1.0 }, cpOut: { x: 0.15, y: 0.9 } },
      { x: 0.3, y: 0.7, cpIn: { x: 0.2, y: 0.7 }, cpOut: { x: 0.5, y: 0.7 } },
      { x: 2.0, y: 0, cpIn: { x: 1.5, y: 0.1 } }
    ];
    
    this.sustainLevel = 0.7;
    this.sustainIndex = 2;
    
    this.decayMultiplierPoints = [
      { x: 0, y: 1.0, cpOut: { x: 0.33, y: 1.0 } },
      { x: 1, y: 1.0, cpIn: { x: 0.67, y: 1.0 } }
    ];
    
    this.compThreshold = 0.8;
    this.compKnee = 0.1;
    this.compRatio = 4.0;
    
    this.keyframes = [];
    
    this.smoothedGainReduction = 1.0;
    this.lookAheadBuffer = new Float32Array(128);
    this.lookAheadIndex = 0;
    
    this.sampleRate = sampleRate;
    this.invSampleRate = 1.0 / sampleRate;
    
    this.port.onmessage = (e) => this.handleMessage(e.data);
  }
  
  handleMessage(data) {
    switch (data.type) {
      case 'noteOn': {
        const voice = this.allocateVoice(data.noteId);
        voice.active = true;
        voice.noteId = data.noteId;
        voice.frequency = data.frequency;
        voice.velocity = data.velocity || 1.0;
        
        const startLevel = voice.envelopeLevel;
        voice.envelopePhase = 'attack';
        voice.envelopeTime = 0;
        voice.envelopeLevel = startLevel;
        
        if (this.keyframes.length >= 2) {
          voice.interpolatedHarmonics = this.interpolateKeyframes(data.frequency);
          voice.interpolatedDecayMul = this.interpolateDecayMultiplier(data.frequency);
        } else {
          voice.interpolatedHarmonics = null;
          voice.interpolatedDecayMul = null;
        }
        break;
      }
      case 'noteOff': {
        for (const voice of this.voices) {
          if (voice.active && voice.noteId === data.noteId && voice.envelopePhase !== 'release') {
            voice.envelopePhase = 'release';
            voice.releaseStartLevel = voice.envelopeLevel;
            voice.envelopeTime = 0;
            break;
          }
        }
        break;
      }
      case 'setHarmonics': {
        for (let i = 0; i < MAX_HARMONICS; i++) {
          this.harmonicAmplitudes[i] = data.amplitudes[i] || 0;
        }
        break;
      }
      case 'setEnvelope': {
        this.envelopePoints = data.points;
        this.sustainIndex = data.sustainIndex ?? 2;
        break;
      }
      case 'setDecayMultiplier': {
        this.decayMultiplierPoints = data.points;
        break;
      }
      case 'setCompressor': {
        this.compThreshold = data.threshold ?? 0.8;
        this.compKnee = data.knee ?? 0.1;
        this.compRatio = data.ratio ?? 4.0;
        break;
      }
      case 'setKeyframes': {
        this.keyframes = data.keyframes || [];
        break;
      }
    }
  }
  
  interpolateKeyframes(frequency) {
    const kf = this.keyframes;
    if (kf.length === 0) return null;
    if (kf.length === 1) return kf[0].harmonics.slice();
    
    kf.sort((a, b) => a.frequency - b.frequency);
    
    if (frequency <= kf[0].frequency) return kf[0].harmonics.slice();
    if (frequency >= kf[kf.length - 1].frequency) return kf[kf.length - 1].harmonics.slice();
    
    let lower = kf[0], upper = kf[1];
    for (let i = 0; i < kf.length - 1; i++) {
      if (frequency >= kf[i].frequency && frequency <= kf[i + 1].frequency) {
        lower = kf[i];
        upper = kf[i + 1];
        break;
      }
    }
    
    const t = (frequency - lower.frequency) / (upper.frequency - lower.frequency);
    const result = new Float32Array(MAX_HARMONICS);
    for (let i = 0; i < MAX_HARMONICS; i++) {
      result[i] = lower.harmonics[i] * (1 - t) + upper.harmonics[i] * t;
    }
    return result;
  }
  
  interpolateDecayMultiplier(frequency) {
    const minFreq = 27.5;
    const maxFreq = 4186;
    const normalized = Math.max(0, Math.min(1, (frequency - minFreq) / (maxFreq - minFreq)));
    return evaluateBezierEnvelope(this.decayMultiplierPoints, normalized);
  }
  
  allocateVoice(noteId) {
    for (const v of this.voices) {
      if (v.noteId === noteId && v.active) return v;
    }
    for (const v of this.voices) {
      if (!v.active) return v;
    }
    let oldest = this.voices[0];
    let lowestLevel = Infinity;
    for (const v of this.voices) {
      if (v.envelopePhase === 'release' && v.envelopeLevel < lowestLevel) {
        lowestLevel = v.envelopeLevel;
        oldest = v;
      }
    }
    oldest.phases.fill(0);
    return oldest;
  }
  
  getEnvelopeValue(voice) {
    const pts = this.envelopePoints;
    if (!pts || pts.length < 2) return 0;
    
    const decayMul = voice.interpolatedDecayMul || 
      this.interpolateDecayMultiplier(voice.frequency);
    
    if (voice.envelopePhase === 'attack') {
      const attackEnd = pts[1].x;
      if (attackEnd <= 0) {
        voice.envelopePhase = 'decay';
        voice.envelopeTime = 0;
        return pts[1].y * voice.velocity;
      }
      const t = voice.envelopeTime / attackEnd;
      if (t >= 1.0) {
        voice.envelopePhase = 'decay';
        voice.envelopeTime = 0;
        return pts[1].y * voice.velocity;
      }
      const startLevel = voice.envelopeLevel;
      const target = pts[1].y * voice.velocity;
      return startLevel + (target - startLevel) * t;
    }
    
    if (voice.envelopePhase === 'decay') {
      const si = this.sustainIndex;
      const decayStart = pts[1].x;
      const decayEnd = pts[si].x;
      const decayDuration = (decayEnd - decayStart) / decayMul;
      if (decayDuration <= 0) {
        voice.envelopePhase = 'sustain';
        return pts[si].y * voice.velocity;
      }
      const t = voice.envelopeTime / decayDuration;
      if (t >= 1.0) {
        voice.envelopePhase = 'sustain';
        return pts[si].y * voice.velocity;
      }
      const peakVal = pts[1].y * voice.velocity;
      const sustainVal = pts[si].y * voice.velocity;
      return peakVal + (sustainVal - peakVal) * t;
    }
    
    if (voice.envelopePhase === 'sustain') {
      return pts[this.sustainIndex].y * voice.velocity;
    }
    
    if (voice.envelopePhase === 'release') {
      const releaseDuration = (pts[pts.length - 1].x - pts[this.sustainIndex].x) / decayMul;
      if (releaseDuration <= 0) {
        voice.active = false;
        voice.envelopePhase = 'off';
        return 0;
      }
      const t = voice.envelopeTime / releaseDuration;
      if (t >= 1.0) {
        voice.active = false;
        voice.envelopePhase = 'off';
        return 0;
      }
      return voice.releaseStartLevel * (1 - t);
    }
    
    return 0;
  }
  
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channel = output[0];
    if (!channel) return true;
    
    const len = channel.length;
    const invSR = this.invSampleRate;
    
    for (let s = 0; s < len; s++) {
      let mix = 0;
      
      for (let v = 0; v < this.voices.length; v++) {
        const voice = this.voices[v];
        if (!voice.active) continue;
        
        const env = this.getEnvelopeValue(voice);
        voice.envelopeLevel = env;
        voice.envelopeTime += invSR;
        
        if (!voice.active) continue;
        
        const harmonics = voice.interpolatedHarmonics || this.harmonicAmplitudes;
        const freq = voice.frequency;
        
        let voiceSample = 0;
        for (let h = 0; h < MAX_HARMONICS; h++) {
          const amp = harmonics[h];
          if (amp < 0.0001) continue;
          
          const harmFreq = freq * (h + 1);
          if (harmFreq > this.sampleRate * 0.45) break;
          
          const dphi = harmFreq * invSR;
          voice.phases[h] = (voice.phases[h] + dphi) % 1.0;
          
          voiceSample += amp * Math.sin(voice.phases[h] * TWO_PI);
        }
        
        mix += voiceSample * env;
      }
      
      mix = softClip(mix, this.compThreshold, this.compKnee, this.compRatio);
      
      const absMix = Math.abs(mix);
      const targetGR = absMix > 1.0 ? 1.0 / absMix : 1.0;
      this.smoothedGainReduction += (targetGR - this.smoothedGainReduction) * 0.001;
      mix *= Math.min(1.0, this.smoothedGainReduction);
      
      channel[s] = Math.max(-1, Math.min(1, mix));
    }
    
    if (output[1]) {
      output[1].set(channel);
    }
    
    this.port.postMessage({ type: 'levels', peak: Math.max(...channel.map(Math.abs)) });
    
    return true;
  }
}

registerProcessor('additive-synth-processor', AdditiveSynthProcessor);
