import { useState, useCallback, useRef, useEffect } from 'react';

const NUM_HARMONICS = 32;
const MIN_DB = -60;
const MAX_DB = 0;

function ampToDb(amp) {
  if (amp <= 0.001) return MIN_DB;
  return 20 * Math.log10(amp);
}

function dbToAmp(db) {
  if (db <= MIN_DB) return 0;
  return Math.pow(10, db / 20);
}

function ampToSliderPos(amp) {
  const db = ampToDb(amp);
  return (db - MIN_DB) / (MAX_DB - MIN_DB);
}

function sliderPosToAmp(pos) {
  const db = MIN_DB + pos * (MAX_DB - MIN_DB);
  return dbToAmp(db);
}

const PRESETS = {
  'Saw': (i) => 1.0 / (i + 1),
  'Square': (i) => (i % 2 === 0) ? 1.0 / (i + 1) : 0,
  'Triangle': (i) => (i % 2 === 0) ? 1.0 / Math.pow(i + 1, 2) : 0,
  'Sine': (i) => i === 0 ? 1.0 : 0,
  'Organ': (i) => [1, 0.5, 0, 0.25, 0, 0.125, 0, 0.0625][i] || 0,
  'Bell': (i) => Math.exp(-i * 0.3) * (1 + 0.5 * Math.sin(i * 1.5)),
  'Bright': (i) => 1.0 / Math.sqrt(i + 1),
};

export default function HarmonicEditor({ harmonics, onChange }) {
  const [dragging, setDragging] = useState(null);
  const containerRef = useRef(null);

  const handleSliderChange = useCallback((index, value) => {
    const newHarmonics = [...harmonics];
    newHarmonics[index] = sliderPosToAmp(value);
    onChange(newHarmonics);
  }, [harmonics, onChange]);

  const handleMouseDown = useCallback((index, e) => {
    e.preventDefault();
    setDragging(index);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (dragging === null) return;
    const slider = containerRef.current?.querySelectorAll('.harmonic-slider')[dragging];
    if (!slider) return;
    const rect = slider.getBoundingClientRect();
    const y = 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    handleSliderChange(dragging, y);
  }, [dragging, handleSliderChange]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const applyPreset = (name) => {
    const fn = PRESETS[name];
    const newHarmonics = Array.from({ length: NUM_HARMONICS }, (_, i) => fn(i));
    onChange(newHarmonics);
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">
          Harmonic Editor
        </h3>
        <div className="flex gap-1 flex-wrap">
          {Object.keys(PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              className="px-2 py-0.5 text-xs bg-gray-800 hover:bg-cyan-900 text-gray-300 
                         hover:text-cyan-300 rounded transition-colors border border-gray-700"
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-end gap-px h-48 relative" ref={containerRef}>
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[9px] text-gray-500 -ml-7 py-1">
          <span>0dB</span>
          <span>-20</span>
          <span>-40</span>
          <span>-60</span>
        </div>
        
        {harmonics.slice(0, NUM_HARMONICS).map((amp, i) => {
          const height = ampToSliderPos(amp) * 100;
          const hue = (i / NUM_HARMONICS) * 200 + 180;
          return (
            <div
              key={i}
              className="harmonic-slider flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer group"
              onMouseDown={(e) => handleMouseDown(i, e)}
            >
              <div
                className="w-full rounded-t-sm transition-all duration-75 min-h-[1px]"
                style={{
                  height: `${height}%`,
                  backgroundColor: `hsl(${hue}, 70%, ${50 + height * 0.2}%)`,
                  opacity: amp > 0.001 ? 0.9 : 0.2,
                }}
              />
              <div className="absolute -bottom-4 text-[7px] text-gray-600 group-hover:text-gray-400">
                {i + 1}
              </div>
              <div className="absolute -top-5 text-[8px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {ampToDb(amp).toFixed(0)}dB
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-5 text-[10px] text-gray-500 text-center">
        Harmonic Number (1-32) — Logarithmic Scale (dB)
      </div>
    </div>
  );
}
