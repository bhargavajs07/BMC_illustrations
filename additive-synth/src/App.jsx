import { useState, useCallback, useEffect, useRef } from 'react';
import HarmonicEditor from './components/HarmonicEditor';
import BezierEnvelope from './components/BezierEnvelope';
import DecayMultiplier from './components/DecayMultiplier';
import KeyframeStrip from './components/KeyframeStrip';
import Compressor from './components/Compressor';
import Keyboard from './components/Keyboard';
import Spectrogram from './components/Spectrogram';
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
  const [sustainIndex, setSustainIndex] = useState(2);
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
    await audioEngine.init();
    audioEngine.setHarmonics(harmonics);
    audioEngine.setEnvelope(envelope, sustainIndex);
    audioEngine.setDecayMultiplier(decayMult);
    audioEngine.setCompressor(compressor.threshold, compressor.knee, compressor.ratio);
    audioEngine.onLevels = (peak) => setPeakLevel(peak);
    setAnalyserNode(audioEngine.getAnalyserNode());
    setInitialized(true);
  }, [initialized, harmonics, envelope, sustainIndex, decayMult, compressor]);

  useEffect(() => {
    if (initialized) audioEngine.setHarmonics(harmonics);
  }, [harmonics, initialized]);

  useEffect(() => {
    if (initialized) audioEngine.setEnvelope(envelope, sustainIndex);
  }, [envelope, sustainIndex, initialized]);

  useEffect(() => {
    if (initialized) audioEngine.setDecayMultiplier(decayMult);
  }, [decayMult, initialized]);

  useEffect(() => {
    if (initialized) audioEngine.setCompressor(compressor.threshold, compressor.knee, compressor.ratio);
  }, [compressor, initialized]);

  useEffect(() => {
    if (initialized) {
      const kfData = keyframes.map(kf => ({
        frequency: midiToFrequency(kf.note),
        harmonics: kf.harmonics,
      }));
      audioEngine.setKeyframes(kfData);
    }
  }, [keyframes, initialized]);

  useEffect(() => {
    if (initialized) audioEngine.setMasterVolume(masterVolume);
  }, [masterVolume, initialized]);

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

  const handleCompressorChange = useCallback((values) => {
    setCompressor(values);
  }, []);

  const tabs = [
    { id: 'harmonics', label: 'Harmonics', color: 'cyan' },
    { id: 'envelope', label: 'Envelope', color: 'cyan' },
    { id: 'decay', label: 'Decay Mult', color: 'purple' },
    { id: 'keyframes', label: 'Keyframes', color: 'emerald' },
    { id: 'compressor', label: 'Compressor', color: 'orange' },
  ];

  const colorMap = {
    cyan: 'border-cyan-500 text-cyan-400 bg-cyan-950/30',
    purple: 'border-purple-500 text-purple-400 bg-purple-950/30',
    emerald: 'border-emerald-500 text-emerald-400 bg-emerald-950/30',
    orange: 'border-orange-500 text-orange-400 bg-orange-950/30',
  };
  const inactiveStyle = 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/50';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 
                          flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Additive Synthesizer</h1>
              <p className="text-[10px] text-gray-500">32-Harmonic Engine • AudioWorklet DSP • Web MIDI</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Peak meter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 uppercase">Peak</span>
              <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    peakLevel > 0.9 ? 'bg-red-500' : peakLevel > 0.6 ? 'bg-yellow-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${Math.min(100, peakLevel * 100)}%` }}
                />
              </div>
            </div>
            
            {/* Master volume */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 uppercase">Vol</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={masterVolume}
                onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                className="w-20 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                           [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-400 
                           [&::-webkit-slider-thumb]:rounded-full"
              />
              <span className="text-[10px] text-gray-400 font-mono w-8">
                {(masterVolume * 100).toFixed(0)}%
              </span>
            </div>
            
            {!initialized && (
              <button
                onClick={initAudio}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs 
                         rounded-lg transition-colors font-medium"
              >
                Start Audio
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* Tab navigation */}
        <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                activeTab === tab.id ? colorMap[tab.color] : inactiveStyle
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active panel */}
        <div className="min-h-[280px]">
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
            <KeyframeStrip
              keyframes={keyframes}
              onChange={setKeyframes}
              currentHarmonics={harmonics}
            />
          )}
          {activeTab === 'compressor' && (
            <Compressor
              threshold={compressor.threshold}
              knee={compressor.knee}
              ratio={compressor.ratio}
              onChange={handleCompressorChange}
            />
          )}
        </div>

        {/* Spectrogram */}
        <Spectrogram analyserNode={analyserNode} />

        {/* Keyboard */}
        <Keyboard
          onNoteOn={handleNoteOn}
          onNoteOff={handleNoteOff}
          activeNotes={activeNotes}
        />
      </main>
      
      <footer className="border-t border-gray-800 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-3 text-center text-[10px] text-gray-600">
          Additive Synthesizer — AudioWorklet DSP with manual phase accumulator • 
          32 harmonics per voice • Bezier ADSR envelopes • Soft-clip compression
        </div>
      </footer>
    </div>
  );
}
