import { useState, useCallback } from 'react';
import { midiToNoteName, midiToFrequency } from '../utils/audioEngine';

const NUM_HARMONICS = 32;

const DEFAULT_KEYFRAMES_PRESETS = {
  'Piano-like': [
    { note: 21, label: 'A0', harmonics: Array.from({ length: NUM_HARMONICS }, (_, i) => 1.0 / (i + 1)) },
    { note: 60, label: 'C4', harmonics: Array.from({ length: NUM_HARMONICS }, (_, i) => Math.pow(0.85, i)) },
    { note: 108, label: 'C8', harmonics: Array.from({ length: NUM_HARMONICS }, (_, i) => i === 0 ? 1 : i < 4 ? 0.3 / i : 0) },
  ],
  'Bass to Bright': [
    { note: 21, label: 'A0', harmonics: Array.from({ length: NUM_HARMONICS }, (_, i) => i < 3 ? 1.0 / (i + 1) : 0) },
    { note: 60, label: 'C4', harmonics: Array.from({ length: NUM_HARMONICS }, (_, i) => 1.0 / Math.sqrt(i + 1)) },
    { note: 108, label: 'C8', harmonics: Array.from({ length: NUM_HARMONICS }, (_, i) => 1.0 / (i + 1)) },
  ],
};

export default function KeyframeStrip({ keyframes, onChange, currentHarmonics }) {
  const [selectedPreset, setSelectedPreset] = useState(null);

  const addKeyframe = useCallback((midiNote) => {
    const existing = keyframes.find(kf => kf.note === midiNote);
    if (existing) return;
    
    const newKf = {
      note: midiNote,
      label: midiToNoteName(midiNote),
      frequency: midiToFrequency(midiNote),
      harmonics: currentHarmonics ? [...currentHarmonics] : Array.from({ length: NUM_HARMONICS }, (_, i) => 1.0 / (i + 1)),
    };
    
    const newKeyframes = [...keyframes, newKf].sort((a, b) => a.note - b.note);
    onChange(newKeyframes);
  }, [keyframes, onChange, currentHarmonics]);

  const removeKeyframe = useCallback((note) => {
    onChange(keyframes.filter(kf => kf.note !== note));
  }, [keyframes, onChange]);

  const applyPreset = useCallback((name) => {
    const preset = DEFAULT_KEYFRAMES_PRESETS[name];
    if (!preset) return;
    const newKeyframes = preset.map(kf => ({
      ...kf,
      frequency: midiToFrequency(kf.note),
    }));
    onChange(newKeyframes);
    setSelectedPreset(name);
  }, [onChange]);

  const noteOptions = [21, 33, 45, 48, 52, 55, 57, 60, 64, 67, 69, 72, 76, 79, 81, 84, 88, 93, 96, 100, 105, 108];

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
          Timbre Keyframes
        </h3>
        <div className="flex gap-1">
          {Object.keys(DEFAULT_KEYFRAMES_PRESETS).map(name => (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                selectedPreset === name
                  ? 'bg-emerald-900 border-emerald-600 text-emerald-300'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-emerald-900/50'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Keyframe strip */}
      <div className="relative h-16 bg-gray-950 rounded-lg border border-gray-800 overflow-hidden">
        {/* Piano range indicator */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 88 }, (_, i) => {
            const midi = i + 21;
            const isBlack = [1, 3, 6, 8, 10].includes(midi % 12);
            return (
              <div
                key={i}
                className={`flex-1 ${isBlack ? 'bg-gray-900' : 'bg-gray-950'} border-r border-gray-900/30`}
              />
            );
          })}
        </div>
        
        {/* Interpolation zones */}
        {keyframes.length >= 2 && keyframes.map((kf, i) => {
          if (i >= keyframes.length - 1) return null;
          const left = ((kf.note - 21) / 87) * 100;
          const right = ((keyframes[i + 1].note - 21) / 87) * 100;
          return (
            <div
              key={`zone-${i}`}
              className="absolute top-0 bottom-0 bg-emerald-500/10 border-y border-emerald-500/20"
              style={{ left: `${left}%`, width: `${right - left}%` }}
            />
          );
        })}
        
        {/* Keyframe markers */}
        {keyframes.map((kf) => {
          const left = ((kf.note - 21) / 87) * 100;
          return (
            <div
              key={kf.note}
              className="absolute top-0 bottom-0 flex flex-col items-center justify-center group"
              style={{ left: `${left}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-0.5 h-full bg-emerald-400" />
              <div className="absolute -top-0.5 bg-emerald-500 text-gray-950 text-[8px] font-bold 
                            px-1.5 py-0.5 rounded-b shadow-lg whitespace-nowrap z-10">
                {kf.label}
              </div>
              <button
                onClick={() => removeKeyframe(kf.note)}
                className="absolute -bottom-0.5 bg-red-900/80 text-red-300 text-[8px] w-4 h-4 
                          rounded-t flex items-center justify-center opacity-0 group-hover:opacity-100 
                          transition-opacity z-10"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Add keyframe controls */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-gray-500">Add at:</span>
        <div className="flex gap-1 flex-wrap">
          {noteOptions.map(note => {
            const exists = keyframes.some(kf => kf.note === note);
            return (
              <button
                key={note}
                onClick={() => addKeyframe(note)}
                disabled={exists}
                className={`px-1.5 py-0.5 text-[10px] rounded border transition-colors ${
                  exists
                    ? 'bg-emerald-900/30 border-emerald-800 text-emerald-600 cursor-not-allowed'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
              >
                {midiToNoteName(note)}
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="mt-2 text-[9px] text-gray-500">
        Harmonics interpolate linearly between keyframes based on played note frequency
      </div>
    </div>
  );
}
