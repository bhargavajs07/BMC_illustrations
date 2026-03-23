import { useState, useCallback, useEffect, useRef } from 'react';
import HarmonicEditor from './components/HarmonicEditor';
import BezierEnvelope from './components/BezierEnvelope';
import DecayMultiplier from './components/DecayMultiplier';
import KeyframeStrip from './components/KeyframeStrip';
import Compressor from './components/Compressor';
import Keyboard from './components/Keyboard';
import Spectrogram from './components/Spectrogram';
import Waveform from './components/Waveform';
import { audioEngine, midiToFrequency } from './utils/audioEngine';

const NUM_HARMONICS = 32;

const DEFAULT_HARMONICS = Array.from({ length: NUM_HARMONICS }, (_, i) => 1.0 / (i + 1));

const DEFAULT_ENVELOPE = [
  { x: 0, y: 0, cpOut: { x: 0.01, y: 0.8 } },
  { x: 0.05, y: 1.0, cpIn: { x: 0.03, y: 1.0 }, cpOut: { x: 0.15, y: 0.9 } },
  { x: 0.3, y: 0.7, cpIn: { x: 0.2, y: 0.7 }, cpOut: { x: 0.5, y: 0.7 } },
  { x: 2.0, y: 0, cpIn: { x: 1.5, y: 0.1 } },
];

const DEFAULT_DECAY_MULT = [
  { x: 0, y: 1.0, cpOut: { x: 0.33, y: 1.0 } },
  { x: 1, y: 3.0, cpIn: { x: 0.67, y: 3.0 } },
];

export default function App() {
  const [initialized, setInitialized] = useState(false);
  const [harmonics, setHarmonics] = useState(DEFAULT_HARMONICS);
  const [envelope, setEnvelope] = useState(DEFAULT_ENVELOPE);
  const [sustainIndex] = useState(2);
  const [decayMult, setDecayMult] = useState(DEFAULT_DECAY_MULT);
  const [compressor, setCompressor] = useState({ threshold: 0.8, knee: 0.1, ratio: 4.0 });
  const [keyframes, setKeyframes] = useState([]);
  const [masterVolume, setMasterVolume] = useState(0.5);
  const [peakLevel, setPeakLevel] = useState(0);
  const [activeNotes, setActiveNotes] = useState(new Set());
  const [analyserNode, setAnalyserNode] = useState(null);
  const [activeTab, setActiveTab] = useState('harmonics');
  const activeNotesRef = useRef(new Set());

  const initAudio = useCallback(async () => {
    if (initialized) {
      await audioEngine.resume();
      return;
    }
    try {
      await audioEngine.init();
      audioEngine.setHarmonics(harmonics);
      audioEngine.setEnvelope(envelope, sustainIndex);
      audioEngine.setDecayMultiplier(decayMult);
      audioEngine.setCompressor(compressor.threshold, compressor.knee, compressor.ratio);
      audioEngine.onLevels = (peak) => setPeakLevel(peak);
      setAnalyserNode(audioEngine.getAnalyserNode());
      setInitialized(true);
    } catch (err) {
      console.error('Audio init failed:', err);
    }
  }, [initialized, harmonics, envelope, sustainIndex, decayMult, compressor]);

  useEffect(() => { if (initialized) audioEngine.setHarmonics(harmonics); }, [harmonics, initialized]);
  useEffect(() => { if (initialized) audioEngine.setEnvelope(envelope, sustainIndex); }, [envelope, sustainIndex, initialized]);
  useEffect(() => { if (initialized) audioEngine.setDecayMultiplier(decayMult); }, [decayMult, initialized]);
  useEffect(() => { if (initialized) audioEngine.setCompressor(compressor.threshold, compressor.knee, compressor.ratio); }, [compressor, initialized]);
  useEffect(() => { if (initialized) audioEngine.setMasterVolume(masterVolume); }, [masterVolume, initialized]);

  useEffect(() => {
    if (!initialized) return;
    const kfData = keyframes.map((kf) => ({
      frequency: midiToFrequency(kf.note),
      harmonics: kf.harmonics,
    }));
    audioEngine.setKeyframes(kfData);
  }, [keyframes, initialized]);

  const handleNoteOn = useCallback(async (midi, velocity = 100) => {
    await initAudio();
    audioEngine.noteOn(midi, velocity);
    activeNotesRef.current.add(midi);
    setActiveNotes(new Set(activeNotesRef.current));
  }, [initAudio]);

  const handleNoteOff = useCallback((midi) => {
    audioEngine.noteOff(midi);
    activeNotesRef.current.delete(midi);
    setActiveNotes(new Set(activeNotesRef.current));
  }, []);

  const tabs = [
    { id: 'harmonics', label: 'Harmonics', accent: 'cyan' },
    { id: 'envelope', label: 'Envelope', accent: 'cyan' },
    { id: 'decay', label: 'Decay', accent: 'purple' },
    { id: 'keyframes', label: 'Keyframes', accent: 'emerald' },
    { id: 'compressor', label: 'Compress', accent: 'orange' },
  ];

  const accentClasses = {
    cyan: { active: 'border-cyan-500 text-cyan-400 bg-cyan-500/10', dot: 'bg-cyan-400' },
    purple: { active: 'border-purple-500 text-purple-400 bg-purple-500/10', dot: 'bg-purple-400' },
    emerald: { active: 'border-emerald-500 text-emerald-400 bg-emerald-500/10', dot: 'bg-emerald-400' },
    orange: { active: 'border-orange-500 text-orange-400 bg-orange-500/10', dot: 'bg-orange-400' },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-2 sm:py-3">
          {/* Top row: title + start button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500
                            flex items-center justify-center text-white font-bold text-sm sm:text-base
                            shadow-lg shadow-cyan-500/20 flex-shrink-0">
                ~
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-bold text-white leading-tight tracking-tight truncate">
                  Additive Synthesizer
                </h1>
                <p className="text-[9px] sm:text-[10px] text-gray-500 tracking-wide hidden sm:block">
                  32 Harmonics • AudioWorklet DSP • Phase-Accurate • Web MIDI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {/* Peak meter */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[9px] text-gray-500 uppercase tracking-wider">Peak</span>
                <div className="w-20 sm:w-28 h-2 sm:h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                  <div
                    className={`h-full rounded-full transition-all duration-75 ${
                      peakLevel > 0.9 ? 'bg-red-500' : peakLevel > 0.6 ? 'bg-amber-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${Math.min(100, peakLevel * 100)}%` }}
                  />
                </div>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[9px] text-gray-500 uppercase tracking-wider">Vol</span>
                <input
                  type="range" min="0" max="1" step="0.01" value={masterVolume}
                  onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                  className="w-14 sm:w-20 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                    [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-cyan-400
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                />
              </div>

              {!initialized && (
                <button
                  onClick={initAudio}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500
                           hover:to-blue-500 text-white text-[11px] sm:text-xs rounded-lg transition-all
                           font-semibold shadow-lg shadow-cyan-600/20 whitespace-nowrap"
                >
                  Start Audio
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-2 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
        {/* Tab bar — scrollable on mobile */}
        <div className="flex gap-1 bg-gray-900/80 rounded-xl p-1 border border-gray-800 backdrop-blur-sm overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const cls = accentClasses[tab.accent];
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-0 px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold
                  rounded-lg border transition-all flex items-center justify-center gap-1 sm:gap-2 whitespace-nowrap
                  ${isActive ? cls.active : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/60'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? cls.dot : 'bg-gray-600'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active panel */}
        <div className="min-h-[200px] sm:min-h-[260px]">
          {activeTab === 'harmonics' && (
            <HarmonicEditor harmonics={harmonics} onChange={setHarmonics} />
          )}
          {activeTab === 'envelope' && (
            <BezierEnvelope
              points={envelope}
              onChange={setEnvelope}
              sustainIndex={sustainIndex}
              title="ADSR Bezier Envelope"
              maxTime={3}
            />
          )}
          {activeTab === 'decay' && (
            <DecayMultiplier points={decayMult} onChange={setDecayMult} />
          )}
          {activeTab === 'keyframes' && (
            <KeyframeStrip keyframes={keyframes} onChange={setKeyframes} currentHarmonics={harmonics} />
          )}
          {activeTab === 'compressor' && (
            <Compressor
              threshold={compressor.threshold}
              knee={compressor.knee}
              ratio={compressor.ratio}
              onChange={setCompressor}
            />
          )}
        </div>

        {/* Visualizers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="lg:col-span-2">
            <Spectrogram analyserNode={analyserNode} />
          </div>
          <div className="bg-gray-900 rounded-xl p-3 sm:p-4 border border-gray-800 flex flex-col">
            <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-2 sm:mb-3">
              Waveform
            </h3>
            <Waveform analyserNode={analyserNode} />
            <div className="mt-2 sm:mt-3 grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-gray-950 rounded-lg p-2 border border-gray-800">
                <span className="text-gray-500 block">Active Voices</span>
                <span className="text-cyan-400 font-mono text-lg">{activeNotes.size}</span>
              </div>
              <div className="bg-gray-950 rounded-lg p-2 border border-gray-800">
                <span className="text-gray-500 block">Oscillators</span>
                <span className="text-purple-400 font-mono text-lg">{activeNotes.size * 32}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard */}
        <Keyboard onNoteOn={handleNoteOn} onNoteOff={handleNoteOff} activeNotes={activeNotes} />
      </main>

      <footer className="border-t border-gray-800 mt-4 sm:mt-6">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-2 sm:py-3 text-center sm:text-left
                      sm:flex sm:justify-between text-[9px] sm:text-[10px] text-gray-600">
          <span>Additive Synthesizer — Manual Phase Accumulator DSP</span>
          <span className="hidden sm:inline">32 harmonics × 16 voices • Bezier envelopes • Soft-clip compressor</span>
        </div>
      </footer>
    </div>
  );
}
