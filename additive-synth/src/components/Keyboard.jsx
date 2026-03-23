import { useState, useCallback, useEffect, useRef } from 'react';
import { midiToNoteName } from '../utils/audioEngine';

const TOTAL_KEYS = 88;
const FIRST_MIDI = 21;
const BLACK_NOTES = new Set([1, 3, 6, 8, 10]);

function isBlackKey(midi) {
  return BLACK_NOTES.has(midi % 12);
}

export default function Keyboard({ onNoteOn, onNoteOff, activeNotes = new Set() }) {
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const [mouseDown, setMouseDown] = useState(false);
  const pressedRef = useRef(new Set());
  const scrollRef = useRef(null);

  const triggerOn = useCallback((midi, velocity = 100) => {
    if (pressedRef.current.has(midi)) return;
    pressedRef.current.add(midi);
    setPressedKeys(new Set(pressedRef.current));
    onNoteOn(midi, velocity);
  }, [onNoteOn]);

  const triggerOff = useCallback((midi) => {
    if (!pressedRef.current.has(midi)) return;
    pressedRef.current.delete(midi);
    setPressedKeys(new Set(pressedRef.current));
    onNoteOff(midi);
  }, [onNoteOff]);

  const releaseAll = useCallback(() => {
    const notes = Array.from(pressedRef.current);
    for (const midi of notes) {
      pressedRef.current.delete(midi);
      onNoteOff(midi);
    }
    setPressedKeys(new Set());
  }, [onNoteOff]);

  // Web MIDI
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) return;

    let access = null;
    const handler = (e) => {
      if (!e.data || e.data.length < 3) return;
      const [status, note, vel] = e.data;
      const cmd = status & 0xf0;
      if (cmd === 0x90 && vel > 0) triggerOn(note, vel);
      else if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) triggerOff(note);
    };

    navigator.requestMIDIAccess()
      .then((a) => {
        access = a;
        for (const inp of a.inputs.values()) inp.onmidimessage = handler;
        a.onstatechange = () => {
          for (const inp of a.inputs.values()) inp.onmidimessage = handler;
        };
      })
      .catch(() => {});

    return () => {
      if (access) {
        try {
          for (const inp of access.inputs.values()) inp.onmidimessage = null;
        } catch (e) { /* ignore */ }
      }
    };
  }, [triggerOn, triggerOff]);

  // Computer keyboard
  useEffect(() => {
    const keyMap = {
      'a': 60, 'w': 61, 's': 62, 'e': 63, 'd': 64, 'f': 65,
      't': 66, 'g': 67, 'y': 68, 'h': 69, 'u': 70, 'j': 71,
      'k': 72, 'o': 73, 'l': 74, 'p': 75, ';': 76, "'": 77,
      'z': 48, 'x': 50, 'c': 52, 'v': 53, 'b': 55, 'n': 57, 'm': 59,
    };

    const down = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey) return;
      const midi = keyMap[e.key.toLowerCase()];
      if (midi !== undefined) { e.preventDefault(); triggerOn(midi, 100); }
    };
    const up = (e) => {
      const midi = keyMap[e.key.toLowerCase()];
      if (midi !== undefined) { e.preventDefault(); triggerOff(midi); }
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [triggerOn, triggerOff]);

  // Scroll to middle C on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      requestAnimationFrame(() => {
        const middleCPos = ((60 - FIRST_MIDI) / TOTAL_KEYS) * el.scrollWidth;
        el.scrollLeft = middleCPos - el.clientWidth / 2;
      });
    }
  }, []);

  const handleEnter = useCallback((midi) => { if (mouseDown) triggerOn(midi, 100); }, [mouseDown, triggerOn]);
  const handleLeave = useCallback((midi) => { if (mouseDown) triggerOff(midi); }, [mouseDown, triggerOff]);

  // Build key layout
  const whiteKeys = [];
  const blackKeys = [];
  let wIdx = 0;
  for (let i = 0; i < TOTAL_KEYS; i++) {
    const midi = FIRST_MIDI + i;
    if (!isBlackKey(midi)) {
      whiteKeys.push({ midi, index: wIdx });
      wIdx++;
    } else {
      blackKeys.push({ midi, whiteIdx: wIdx - 1 });
    }
  }
  const totalWhite = whiteKeys.length;
  const keyW = 28;

  return (
    <div className="bg-gray-900 rounded-xl p-2 sm:p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-2 px-1 sm:px-0">
        <h3 className="text-xs sm:text-sm font-semibold text-cyan-400 uppercase tracking-wider">
          88-Key Keyboard
        </h3>
        <span className="text-[9px] sm:text-[10px] text-gray-500 hidden sm:inline">
          Keys: A-L / Z-M • MIDI auto-detected
        </span>
      </div>

      <div
        ref={scrollRef}
        className="relative overflow-x-auto select-none rounded-lg touch-pan-x"
        onMouseDown={() => setMouseDown(true)}
        onMouseUp={() => setMouseDown(false)}
        onMouseLeave={() => { setMouseDown(false); releaseAll(); }}
      >
        <div className="relative" style={{ width: `${totalWhite * keyW}px`, height: '120px' }}>
          {whiteKeys.map(({ midi, index }) => {
            const active = pressedKeys.has(midi) || activeNotes.has(midi);
            const isC = midi % 12 === 0;
            return (
              <div
                key={midi}
                className={`absolute top-0 border rounded-b-md cursor-pointer transition-colors duration-[30ms]
                  flex flex-col items-center justify-end pb-1
                  ${active
                    ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-600'}`}
                style={{ left: `${index * keyW}px`, width: `${keyW - 1}px`, height: '120px' }}
                onMouseDown={() => triggerOn(midi, 100)}
                onMouseUp={() => triggerOff(midi)}
                onMouseEnter={() => handleEnter(midi)}
                onMouseLeave={() => handleLeave(midi)}
                onTouchStart={(e) => { e.preventDefault(); triggerOn(midi, 100); }}
                onTouchEnd={(e) => { e.preventDefault(); triggerOff(midi); }}
              >
                {isC && (
                  <span className={`text-[7px] sm:text-[8px] font-mono ${active ? 'text-gray-900' : 'text-gray-400'}`}>
                    {midiToNoteName(midi)}
                  </span>
                )}
              </div>
            );
          })}

          {blackKeys.map(({ midi, whiteIdx }) => {
            const active = pressedKeys.has(midi) || activeNotes.has(midi);
            return (
              <div
                key={midi}
                className={`absolute top-0 rounded-b-md cursor-pointer z-10 transition-colors duration-[30ms]
                  ${active
                    ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                    : 'bg-gray-900 hover:bg-gray-700 border border-gray-700'}`}
                style={{ left: `${(whiteIdx + 1) * keyW - 9}px`, width: '18px', height: '76px' }}
                onMouseDown={(e) => { e.stopPropagation(); triggerOn(midi, 100); }}
                onMouseUp={(e) => { e.stopPropagation(); triggerOff(midi); }}
                onMouseEnter={() => handleEnter(midi)}
                onMouseLeave={() => handleLeave(midi)}
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); triggerOn(midi, 100); }}
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); triggerOff(midi); }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
