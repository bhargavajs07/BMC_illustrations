import { useState, useCallback, useRef, useEffect } from 'react';
import { midiToNoteName, midiToFrequency } from '../utils/audioEngine';

const NUM_HARMONICS = 32;

const PRESETS = {
  'Piano-like': [
    { note: 21, harmonics: Array.from({ length: NUM_HARMONICS }, (_, i) => 1.0 / (i + 1)) },
    { note: 60, harmonics: Array.from({ length: NUM_HARMONICS }, (_, i) => Math.pow(0.85, i)) },
    { note: 108, harmonics: Array.from({ length: NUM_HARMONICS }, (_, i) => i === 0 ? 1 : i < 4 ? 0.3 / i : 0) },
  ],
  'Bass→Bright': [
    { note: 21, harmonics: Array.from({ length: NUM_HARMONICS }, (_, i) => i < 3 ? 1.0 / (i + 1) : 0) },
    { note: 60, harmonics: Array.from({ length: NUM_HARMONICS }, (_, i) => 1.0 / Math.sqrt(i + 1)) },
    { note: 108, harmonics: Array.from({ length: NUM_HARMONICS }, (_, i) => 1.0 / (i + 1)) },
  ],
  'Dark→Thin': [
    { note: 21, harmonics: Array.from({ length: NUM_HARMONICS }, (_, i) => Math.exp(-i * 0.15)) },
    { note: 72, harmonics: Array.from({ length: NUM_HARMONICS }, (_, i) => i < 2 ? 0.8 : Math.exp(-i * 0.5)) },
    { note: 108, harmonics: Array.from({ length: NUM_HARMONICS }, (_, i) => i === 0 ? 1 : 0) },
  ],
};

function MiniHarmonicPreview({ harmonics }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const barW = w / NUM_HARMONICS;
    for (let i = 0; i < NUM_HARMONICS; i++) {
      const amp = harmonics[i] || 0;
      const barH = amp * h;
      const hue = (i / NUM_HARMONICS) * 200 + 180;
      ctx.fillStyle = `hsl(${hue}, 60%, 55%)`;
      ctx.fillRect(i * barW, h - barH, barW - 0.5, barH);
    }
  }, [harmonics]);

  return <canvas ref={canvasRef} width={64} height={24} className="rounded bg-gray-950 border border-gray-800" />;
}

export default function KeyframeStrip({ keyframes, onChange, currentHarmonics }) {
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [selectedNote, setSelectedNote] = useState(60);

  const addKeyframe = useCallback(() => {
    if (keyframes.find(kf => kf.note === selectedNote)) return;
    const newKf = {
      note: selectedNote,
      label: midiToNoteName(selectedNote),
      frequency: midiToFrequency(selectedNote),
      harmonics: currentHarmonics ? [...currentHarmonics] : Array.from({ length: NUM_HARMONICS }, (_, i) => 1 / (i + 1)),
    };
    onChange([...keyframes, newKf].sort((a, b) => a.note - b.note));
  }, [keyframes, onChange, currentHarmonics, selectedNote]);

  const removeKeyframe = useCallback((note) => {
    onChange(keyframes.filter(kf => kf.note !== note));
  }, [keyframes, onChange]);

  const applyPreset = useCallback((name) => {
    const p = PRESETS[name];
    if (!p) return;
    onChange(p.map(kf => ({
      ...kf,
      label: midiToNoteName(kf.note),
      frequency: midiToFrequency(kf.note),
    })));
    setSelectedPreset(name);
  }, [onChange]);

  const noteOptions = [];
  for (let octave = 0; octave <= 8; octave++) {
    for (const n of [0, 3, 5, 7, 9]) {
      const midi = (octave + 1) * 12 + n;
      if (midi >= 21 && midi <= 108) noteOptions.push(midi);
    }
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
          Timbre Keyframes
        </h3>
        <div className="flex gap-1">
          {Object.keys(PRESETS).map(name => (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                selectedPreset === name
                  ? 'bg-emerald-900/60 border-emerald-600 text-emerald-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-emerald-900/30 hover:text-emerald-300'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Keyframe strip visualization */}
      <div className="relative h-20 bg-gray-950 rounded-lg border border-gray-800 overflow-hidden mb-3">
        {/* Piano-range background */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 88 }, (_, i) => {
            const midi = i + 21;
            const black = [1, 3, 6, 8, 10].includes(midi % 12);
            return <div key={i} className={`flex-1 ${black ? 'bg-gray-900' : 'bg-gray-950'} border-r border-gray-900/20`} />;
          })}
        </div>

        {/* Interpolation zones */}
        {keyframes.length >= 2 && keyframes.map((kf, i) => {
          if (i >= keyframes.length - 1) return null;
          const left = ((kf.note - 21) / 87) * 100;
          const width = ((keyframes[i + 1].note - kf.note) / 87) * 100;
          return (
            <div key={`zone-${i}`}
              className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-500/10 to-emerald-400/10"
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          );
        })}

        {/* Keyframe markers */}
        {keyframes.map((kf) => {
          const left = ((kf.note - 21) / 87) * 100;
          return (
            <div key={kf.note} className="absolute top-0 bottom-0 group"
              style={{ left: `${left}%`, transform: 'translateX(-50%)' }}>
              <div className="w-px h-full bg-emerald-400/80" />
              <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[8px] 
                            font-bold px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-10">
                {kf.label}
              </div>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10">
                <MiniHarmonicPreview harmonics={kf.harmonics} />
              </div>
              <button onClick={() => removeKeyframe(kf.note)}
                className="absolute -top-1 -right-2 bg-red-900/90 text-red-300 text-[8px] w-3.5 h-3.5 
                          rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 
                          transition-opacity z-20 hover:bg-red-700">
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* Add keyframe controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Add keyframe at:</span>
          <select
            value={selectedNote}
            onChange={(e) => setSelectedNote(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300
                     focus:border-emerald-500 focus:outline-none"
          >
            {noteOptions.map(note => (
              <option key={note} value={note} disabled={keyframes.some(kf => kf.note === note)}>
                {midiToNoteName(note)} ({midiToFrequency(note).toFixed(0)} Hz)
              </option>
            ))}
          </select>
          <button
            onClick={addKeyframe}
            disabled={keyframes.some(kf => kf.note === selectedNote)}
            className="px-3 py-1 text-xs bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-800
                     disabled:text-gray-600 text-white rounded transition-colors font-medium"
          >
            + Add
          </button>
        </div>
        
        <span className="text-[9px] text-gray-600 ml-auto">
          {keyframes.length} keyframe{keyframes.length !== 1 ? 's' : ''} — harmonics interpolate linearly between them
        </span>
      </div>
    </div>
  );
}
