import { useState, useCallback, useEffect, useRef } from 'react';
import { midiToNoteName } from '../utils/audioEngine';

const TOTAL_KEYS = 88;
const FIRST_MIDI = 21;

const WHITE_PATTERN = [0, 2, 4, 5, 7, 9, 11];
const BLACK_PATTERN = [1, 3, 6, 8, 10];

function isBlackKey(midi) {
  return BLACK_PATTERN.includes(midi % 12);
}

function getKeyLabel(midi) {
  const name = midiToNoteName(midi);
  if (midi % 12 === 0) return name;
  return '';
}

export default function Keyboard({ onNoteOn, onNoteOff, activeNotes = new Set() }) {
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const [mouseDown, setMouseDown] = useState(false);
  const pressedRef = useRef(new Set());
  const midiAccessRef = useRef(null);
  const scrollRef = useRef(null);

  const triggerNoteOn = useCallback((midi, velocity = 100) => {
    if (pressedRef.current.has(midi)) return;
    pressedRef.current.add(midi);
    setPressedKeys(new Set(pressedRef.current));
    onNoteOn(midi, velocity);
  }, [onNoteOn]);

  const triggerNoteOff = useCallback((midi) => {
    if (!pressedRef.current.has(midi)) return;
    pressedRef.current.delete(midi);
    setPressedKeys(new Set(pressedRef.current));
    onNoteOff(midi);
  }, [onNoteOff]);

  // MIDI support
  useEffect(() => {
    if (!navigator.requestMIDIAccess) return;
    
    navigator.requestMIDIAccess().then((access) => {
      midiAccessRef.current = access;
      
      const onMIDIMessage = (e) => {
        const [status, note, velocity] = e.data;
        const cmd = status & 0xf0;
        if (cmd === 0x90 && velocity > 0) {
          triggerNoteOn(note, velocity);
        } else if (cmd === 0x80 || (cmd === 0x90 && velocity === 0)) {
          triggerNoteOff(note);
        }
      };
      
      for (const input of access.inputs.values()) {
        input.onmidimessage = onMIDIMessage;
      }
      
      access.onstatechange = () => {
        for (const input of access.inputs.values()) {
          input.onmidimessage = onMIDIMessage;
        }
      };
    }).catch(() => {});
    
    return () => {
      if (midiAccessRef.current) {
        for (const input of midiAccessRef.current.inputs.values()) {
          input.onmidimessage = null;
        }
      }
    };
  }, [triggerNoteOn, triggerNoteOff]);

  // Computer keyboard support
  useEffect(() => {
    const keyMap = {
      'a': 60, 'w': 61, 's': 62, 'e': 63, 'd': 64, 'f': 65,
      't': 66, 'g': 67, 'y': 68, 'h': 69, 'u': 70, 'j': 71,
      'k': 72, 'o': 73, 'l': 74, 'p': 75, ';': 76, "'": 77,
      'z': 48, 'x': 50, 'c': 52, 'v': 53, 'b': 55, 'n': 57, 'm': 59,
    };
    
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      const midi = keyMap[e.key.toLowerCase()];
      if (midi !== undefined) {
        e.preventDefault();
        triggerNoteOn(midi, 100);
      }
    };
    
    const handleKeyUp = (e) => {
      const midi = keyMap[e.key.toLowerCase()];
      if (midi !== undefined) {
        e.preventDefault();
        triggerNoteOff(midi);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [triggerNoteOn, triggerNoteOff]);

  // Scroll keyboard to middle C on mount
  useEffect(() => {
    if (scrollRef.current) {
      const middleCPos = ((60 - FIRST_MIDI) / TOTAL_KEYS) * scrollRef.current.scrollWidth;
      scrollRef.current.scrollLeft = middleCPos - scrollRef.current.clientWidth / 2;
    }
  }, []);

  const handleMouseEnter = useCallback((midi) => {
    if (mouseDown) triggerNoteOn(midi, 100);
  }, [mouseDown, triggerNoteOn]);

  const handleMouseLeave = useCallback((midi) => {
    if (mouseDown) triggerNoteOff(midi);
  }, [mouseDown, triggerNoteOff]);

  const whiteKeys = [];
  const blackKeys = [];
  
  let whiteIndex = 0;
  for (let i = 0; i < TOTAL_KEYS; i++) {
    const midi = FIRST_MIDI + i;
    const black = isBlackKey(midi);
    
    if (!black) {
      whiteKeys.push({ midi, index: whiteIndex });
      whiteIndex++;
    } else {
      blackKeys.push({ midi, whiteIndex: whiteIndex - 1 });
    }
  }

  const totalWhiteKeys = whiteKeys.length;
  const whiteKeyWidth = 100 / totalWhiteKeys;

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">
          Keyboard
        </h3>
        <span className="text-[10px] text-gray-500">
          Keys: A-L (upper) Z-M (lower) • MIDI supported
        </span>
      </div>
      
      <div
        ref={scrollRef}
        className="relative overflow-x-auto select-none rounded-lg"
        onMouseDown={() => setMouseDown(true)}
        onMouseUp={() => { setMouseDown(false); }}
        onMouseLeave={() => { 
          setMouseDown(false);
          pressedRef.current.forEach(midi => triggerNoteOff(midi));
        }}
      >
        <div className="relative" style={{ width: `${totalWhiteKeys * 28}px`, height: '140px' }}>
          {/* White keys */}
          {whiteKeys.map(({ midi, index }) => {
            const isActive = pressedKeys.has(midi) || activeNotes.has(midi);
            const label = getKeyLabel(midi);
            return (
              <div
                key={midi}
                className={`absolute top-0 border border-gray-700 rounded-b-md cursor-pointer 
                           transition-colors duration-50 flex flex-col items-center justify-end pb-1
                           ${isActive 
                             ? 'bg-cyan-400 border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.5)]' 
                             : 'bg-gray-100 hover:bg-gray-200'}`}
                style={{
                  left: `${index * 28}px`,
                  width: '27px',
                  height: '140px',
                }}
                onMouseDown={() => triggerNoteOn(midi, 100)}
                onMouseUp={() => triggerNoteOff(midi)}
                onMouseEnter={() => handleMouseEnter(midi)}
                onMouseLeave={() => handleMouseLeave(midi)}
              >
                {label && (
                  <span className={`text-[8px] font-mono ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                    {label}
                  </span>
                )}
              </div>
            );
          })}
          
          {/* Black keys */}
          {blackKeys.map(({ midi, whiteIndex: wi }) => {
            const isActive = pressedKeys.has(midi) || activeNotes.has(midi);
            return (
              <div
                key={midi}
                className={`absolute top-0 rounded-b-md cursor-pointer z-10 transition-colors duration-50
                           ${isActive
                             ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                             : 'bg-gray-900 hover:bg-gray-800 border border-gray-700'}`}
                style={{
                  left: `${(wi + 1) * 28 - 9}px`,
                  width: '18px',
                  height: '90px',
                }}
                onMouseDown={(e) => { e.stopPropagation(); triggerNoteOn(midi, 100); }}
                onMouseUp={(e) => { e.stopPropagation(); triggerNoteOff(midi); }}
                onMouseEnter={() => handleMouseEnter(midi)}
                onMouseLeave={() => handleMouseLeave(midi)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
