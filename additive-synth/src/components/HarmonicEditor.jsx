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
  return Math.max(0, Math.min(1, (db - MIN_DB) / (MAX_DB - MIN_DB)));
}

function sliderPosToAmp(pos) {
  const db = MIN_DB + Math.max(0, Math.min(1, pos)) * (MAX_DB - MIN_DB);
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
  const [hoveredBar, setHoveredBar] = useState(null);
  const containerRef = useRef(null);

  const getBarValue = useCallback((index, clientY) => {
    const bars = containerRef.current?.querySelectorAll('[data-bar]');
    if (!bars || !bars[index]) return null;
    const rect = bars[index].getBoundingClientRect();
    return 1 - Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
  }, []);

  const handleSliderChange = useCallback((index, pos) => {
    const newHarmonics = [...harmonics];
    newHarmonics[index] = sliderPosToAmp(pos);
    onChange(newHarmonics);
  }, [harmonics, onChange]);

  const handleMouseDown = useCallback((index, e) => {
    e.preventDefault();
    setDragging(index);
    const pos = getBarValue(index, e.clientY);
    if (pos !== null) handleSliderChange(index, pos);
  }, [getBarValue, handleSliderChange]);

  useEffect(() => {
    if (dragging === null) return;

    const onMove = (e) => {
      const container = containerRef.current;
      if (!container) return;
      
      const bars = container.querySelectorAll('[data-bar]');
      const rect = bars[0]?.parentElement?.getBoundingClientRect();
      if (!rect) return;

      // Allow dragging across multiple bars
      const barWidth = rect.width / NUM_HARMONICS;
      const relX = e.clientX - rect.left;
      const barIdx = Math.max(0, Math.min(NUM_HARMONICS - 1, Math.floor(relX / barWidth)));
      
      const barRect = bars[barIdx]?.getBoundingClientRect();
      if (!barRect) return;
      const pos = 1 - Math.max(0, Math.min(1, (e.clientY - barRect.top) / barRect.height));
      
      const newHarmonics = [...harmonics];
      newHarmonics[barIdx] = sliderPosToAmp(pos);
      onChange(newHarmonics);
      setDragging(barIdx);
    };

    const onUp = () => setDragging(null);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, harmonics, onChange]);

  const applyPreset = (name) => {
    const fn = PRESETS[name];
    onChange(Array.from({ length: NUM_HARMONICS }, (_, i) => fn(i)));
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">
          Harmonic Editor <span className="text-gray-600 font-normal text-[10px] ml-1">32 overtones • dB scale</span>
        </h3>
        <div className="flex gap-1 flex-wrap">
          {Object.keys(PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              className="px-2 py-0.5 text-[10px] bg-gray-800 hover:bg-cyan-900/60 text-gray-400
                         hover:text-cyan-300 rounded transition-colors border border-gray-700 
                         hover:border-cyan-700"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {/* dB scale labels */}
        <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[8px]
                      text-gray-600 -ml-8 py-0.5 pointer-events-none">
          <span>0dB</span>
          <span>-15</span>
          <span>-30</span>
          <span>-45</span>
          <span>-60</span>
        </div>

        {/* Grid lines */}
        <div className="absolute left-0 right-0 top-0 pointer-events-none" style={{ height: '192px' }}>
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
            <div
              key={frac}
              className="absolute left-0 right-0 border-t border-gray-800/60"
              style={{ top: `${frac * 100}%` }}
            />
          ))}
        </div>

        {/* Bars */}
        <div className="flex items-end gap-[1px]" style={{ height: '192px' }} ref={containerRef}>
          {harmonics.slice(0, NUM_HARMONICS).map((amp, i) => {
            const height = ampToSliderPos(amp) * 100;
            const hue = (i / NUM_HARMONICS) * 200 + 180;
            const isHovered = hoveredBar === i;
            const db = ampToDb(amp);
            return (
              <div
                key={i}
                data-bar
                className="flex-1 flex flex-col items-center justify-end h-full relative cursor-ns-resize"
                onMouseDown={(e) => handleMouseDown(i, e)}
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                <div
                  className="w-full rounded-t-sm transition-[height] duration-[30ms] min-h-[1px]"
                  style={{
                    height: `${height}%`,
                    backgroundColor: `hsl(${hue}, 70%, ${45 + height * 0.25}%)`,
                    opacity: amp > 0.001 ? (isHovered ? 1 : 0.85) : 0.15,
                    boxShadow: isHovered ? `0 0 8px hsl(${hue}, 70%, 50%)` : 'none',
                  }}
                />
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-7 bg-gray-800 text-[9px] text-gray-200 px-1.5 py-0.5 
                                rounded shadow-lg whitespace-nowrap z-20 border border-gray-700">
                    H{i + 1}: {db > MIN_DB ? `${db.toFixed(1)}dB` : '-∞'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Harmonic numbers */}
        <div className="flex gap-[1px] mt-1">
          {Array.from({ length: NUM_HARMONICS }, (_, i) => (
            <div key={i} className="flex-1 text-center text-[6px] text-gray-600">
              {(i + 1) % 4 === 1 ? i + 1 : ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
