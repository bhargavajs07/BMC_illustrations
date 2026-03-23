const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiToFrequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function midiToNoteName(midi) {
  const octave = Math.floor(midi / 12) - 1;
  const note = NOTE_NAMES[midi % 12];
  return `${note}${octave}`;
}

export function frequencyToMidi(freq) {
  return 69 + 12 * Math.log2(freq / 440);
}

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.workletNode = null;
    this.analyserNode = null;
    this.gainNode = null;
    this.ready = false;
    this.activeNotes = new Map();
    this.onLevels = null;
  }

  async init() {
    if (this.ctx) return;
    
    this.ctx = new AudioContext({ sampleRate: 44100 });
    
    await this.ctx.audioWorklet.addModule('/synth-worklet.js');
    
    this.workletNode = new AudioWorkletNode(this.ctx, 'additive-synth-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
    });
    
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 4096;
    this.analyserNode.smoothingTimeConstant = 0.8;
    
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0.5;
    
    this.workletNode.connect(this.analyserNode);
    this.analyserNode.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);
    
    this.workletNode.port.onmessage = (e) => {
      if (e.data.type === 'levels' && this.onLevels) {
        this.onLevels(e.data.peak);
      }
    };
    
    this.ready = true;
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  noteOn(midiNote, velocity = 1.0) {
    if (!this.ready) return;
    const frequency = midiToFrequency(midiNote);
    this.activeNotes.set(midiNote, true);
    this.workletNode.port.postMessage({
      type: 'noteOn',
      noteId: midiNote,
      frequency,
      velocity: velocity / 127,
    });
  }

  noteOff(midiNote) {
    if (!this.ready) return;
    this.activeNotes.delete(midiNote);
    this.workletNode.port.postMessage({
      type: 'noteOff',
      noteId: midiNote,
    });
  }

  setHarmonics(amplitudes) {
    if (!this.ready) return;
    this.workletNode.port.postMessage({
      type: 'setHarmonics',
      amplitudes,
    });
  }

  setEnvelope(points, sustainIndex) {
    if (!this.ready) return;
    this.workletNode.port.postMessage({
      type: 'setEnvelope',
      points,
      sustainIndex,
    });
  }

  setDecayMultiplier(points) {
    if (!this.ready) return;
    this.workletNode.port.postMessage({
      type: 'setDecayMultiplier',
      points,
    });
  }

  setCompressor(threshold, knee, ratio) {
    if (!this.ready) return;
    this.workletNode.port.postMessage({
      type: 'setCompressor',
      threshold,
      knee,
      ratio,
    });
  }

  setKeyframes(keyframes) {
    if (!this.ready) return;
    this.workletNode.port.postMessage({
      type: 'setKeyframes',
      keyframes,
    });
  }

  setMasterVolume(value) {
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(value, this.ctx.currentTime, 0.01);
    }
  }

  getAnalyserNode() {
    return this.analyserNode;
  }

  getFrequencyData() {
    if (!this.analyserNode) return null;
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteFrequencyData(data);
    return data;
  }

  getTimeDomainData() {
    if (!this.analyserNode) return null;
    const data = new Uint8Array(this.analyserNode.fftSize);
    this.analyserNode.getByteTimeDomainData(data);
    return data;
  }
}

export const audioEngine = new AudioEngine();
