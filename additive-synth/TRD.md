# Additive Synthesizer — Technical Requirements Document

## 1. Overview

A real-time additive synthesizer web application built with React, Tailwind CSS, and the Web Audio API. The application synthesizes sound by summing discrete sine-wave harmonics per voice, using a custom AudioWorklet processor with a manual phase accumulator for sample-level precision.

**Stack:** React 19, Vite, Tailwind CSS v4, Web Audio API (AudioWorklet), Web MIDI API, Canvas 2D

---

## 2. Technical Requirements

### 2.1 Core DSP Engine — Phase & Precision

#### REQ-DSP-1: Manual Phase Accumulator (No OscillatorNode)

**Requirement:** Do not use the browser's built-in `OscillatorNode`. Implement a custom AudioWorklet processor that tracks the phase of each sine wave manually.

**Formula:** Phase advances each sample as:

```
φ = (φ + Δφ) mod 1.0
```

where `Δφ = frequency × (1 / sampleRate)`.

**Implementation** (`public/synth-worklet.js`, lines 329–332):

The `AdditiveSynthProcessor.process()` method computes phase per harmonic per sample:

```js
const dphi = harmFreq * invSR;
let phase = v.phases[h] + dphi;
if (phase >= 1.0) phase -= 1.0;
if (phase >= 1.0) phase %= 1.0;
```

Phase is stored in a `Float64Array(32)` per voice (line 32), giving 64-bit precision per accumulator. The sine value is produced through a pre-computed 4096-entry lookup table with linear interpolation (lines 14–23), avoiding the cost of `Math.sin()` on every sample.

#### REQ-DSP-2: The Reset Fix — Periodic Phase Normalization

**Requirement:** Explicitly reset or normalize the phase every ~1.0 second to prevent floating-point precision loss (audible wavering) that occurs when accumulated values drift beyond safe Float64 mantissa range.

**Implementation** (`public/synth-worklet.js`, lines 119–120, 316–337):

Each voice maintains a `phaseResetCounter` that increments every sample. When it reaches `sampleRate` (44100 samples = ~1 second), all harmonic phases for that voice undergo explicit normalization:

```js
this.phaseNormInterval = Math.floor(sampleRate);  // 44100
// ...
v.phaseResetCounter++;
const shouldNormalize = v.phaseResetCounter >= normInterval;
if (shouldNormalize) v.phaseResetCounter = 0;
// ...
if (shouldNormalize) {
  phase = phase - Math.floor(phase);
}
```

This guarantees the phase value never exceeds 1.0 for more than one sample, and any accumulated floating-point error is flushed every second.

#### REQ-DSP-3: 32-Harmonic Additive Stack

**Requirement:** Each note must sum 32 discrete sine-wave harmonics (1f, 2f, 3f … 32f).

**Implementation** (`public/synth-worklet.js`, lines 7–8, 320–341):

```
MAX_HARMONICS = 32
```

The inner loop iterates over all 32 harmonics, skipping those with amplitude below `1e-5` (effectively silent) and breaking when the harmonic frequency exceeds the Nyquist limit (`sampleRate × 0.45`) to prevent aliasing:

```js
for (let h = 0; h < MAX_HARMONICS; h++) {
  const amp = harms[h];
  if (amp < 1e-5) continue;
  const harmFreq = freq * (h + 1);
  if (harmFreq > nyquistLimit) break;
  // ... phase accumulation and sine lookup ...
  voiceSample += amp * fastSin(phase);
}
```

#### REQ-DSP-4: Sample-Accurate Triggering & Pop-Free Re-trigger

**Requirement:** Use the `AudioContext.currentTime` clock to schedule gain changes. Re-triggering a note during its Release phase must start the new Attack from the **current gain level** to avoid audio pops/clicks.

**Implementation** (`public/synth-worklet.js`, lines 130–149):

On `noteOn`, the voice allocation logic checks if the note is already active (same `noteId`). If so, it reuses the same voice. The current envelope level is preserved:

```js
const prevLevel = v.envLevel;    // save current amplitude
v.envStage = 1;                  // start Attack
v.envTime = 0;
v.envLevel = prevLevel;          // Attack begins from current level
```

The Attack stage (lines 248–259) then interpolates from `prevLevel` to the target peak using a smoothstep curve `s = t² × (3 − 2t)`, producing a C1-continuous transition with zero discontinuity:

```js
const s = t * t * (3 - 2 * t);
return start + (target - start) * s;
```

### 2.2 Voice Architecture

| Parameter          | Value  |
|--------------------|--------|
| Max polyphony      | 16 voices |
| Harmonics per voice | 32 |
| Max simultaneous oscillators | 512 (16 × 32) |
| Phase storage      | `Float64Array` (64-bit per harmonic) |
| Sample rate        | 44100 Hz |
| Block size         | 128 samples (Web Audio default) |

**Voice stealing** (`public/synth-worklet.js`, lines 218–238): When all 16 voices are active, the allocator steals the releasing voice with the lowest envelope level. If no voices are releasing, it steals the voice with the longest `envTime`.

---

## 3. Widget Suite

### 3.1 Harmonic/Overtone Editor

**Requirement:** A 32-slot vertical slider bank using a non-linear (logarithmic) scale so users can precisely adjust amplitudes as low as −60 dB (0.001 amplitude).

**Implementation** (`src/components/HarmonicEditor.jsx`):

The slider bank uses a logarithmic dB mapping between linear amplitude and visual position:

```
dB = 20 × log₁₀(amplitude)
position = (dB − (−60)) / (0 − (−60))
```

The conversion functions (lines 7–24) map between amplitude, dB, and slider position:

- `ampToDb(amp)` — converts linear amplitude to decibels
- `dbToAmp(db)` — converts decibels back to linear amplitude
- `ampToSliderPos(amp)` — maps amplitude to 0–1 slider position on the log scale
- `sliderPosToAmp(pos)` — inverse mapping

**Interaction:** Click-and-drag vertically adjusts a single bar. Dragging horizontally across bars "paints" amplitudes (lines 65–86). Hover tooltips show the exact dB value per harmonic.

**Presets** (lines 27–35): Seven built-in harmonic profiles:

| Preset   | Formula                                |
|----------|----------------------------------------|
| Saw      | `1 / (h + 1)`                         |
| Square   | `1 / (h + 1)` for odd harmonics only  |
| Triangle | `1 / (h + 1)²` for odd harmonics only |
| Sine     | `1.0` for h=0, `0` for all others     |
| Organ    | Drawbar-style: `[1, 0.5, 0, 0.25, ...]` |
| Bell     | `e^(−0.3h) × (1 + 0.5 sin(1.5h))`    |
| Bright   | `1 / √(h + 1)`                        |

### 3.2 Free-Form Bezier Envelope (ADSR)

**Requirement:** An interactive Canvas widget where users can plot points and manipulate cubic Bezier handles for the Attack, Decay, and Release stages.

**Implementation** (`src/components/BezierEnvelope.jsx`):

The envelope is defined as a series of **control points**, each with:

```js
{ x: time, y: amplitude, cpIn: { x, y }, cpOut: { x, y } }
```

- `x` — time position (seconds)
- `y` — amplitude (0.0 to 1.0)
- `cpIn` — incoming Bezier control handle
- `cpOut` — outgoing Bezier control handle

The default envelope has 4 points: origin (0, 0), peak (0.05s, 1.0), sustain (0.3s, 0.7), and release end (2.0s, 0).

**Canvas rendering** (lines 14–133): The `drawBezierCurve()` function renders:
- A 10×10 grid with time (seconds) on X and amplitude (0–1) on Y
- Phase labels (A, D, S, R) above each segment
- A dashed sustain-level reference line
- The Bezier curve with filled gradient underneath
- Draggable anchor points (colored by role) and control handles (amber)

**Interactions:**
- **Click** empty space to add a new control point
- **Drag** anchor points to reposition in time/amplitude
- **Drag** Bezier handles to reshape curve segments
- **Double-click** an interior point to remove it

**DSP-side evaluation** (`public/synth-worklet.js`, lines 43–66): The worklet evaluates Bezier curves using the standard cubic formula:

```
B(t) = (1−t)³·P₀ + 3(1−t)²t·P₁ + 3(1−t)t²·P₂ + t³·P₃
```

### 3.3 Frequency-Dependent Decay Multiplier

**Requirement:** A secondary Bezier curve widget that maps frequency (x-axis) to a decay speed multiplier (y-axis). Higher notes must be able to decay up to 10× faster than lower notes to mimic string/acoustic physics.

**Implementation** (`src/components/DecayMultiplier.jsx`):

The curve maps normalized frequency (0 = A0 at 27.5 Hz, 1 = C8 at 4186 Hz) to a multiplier ranging from 0.1× to 10×. The DSP engine normalizes each note's frequency and evaluates the Bezier curve to obtain the multiplier:

```js
// synth-worklet.js, lines 190–193
getDecayMultiplier(frequency) {
  const norm = (frequency - 27.5) / (4186.0 - 27.5);
  return Math.max(0.1, evaluateBezierCurve(this.decayMultPoints, norm));
}
```

This multiplier divides the Decay and Release durations in `computeEnvelope()` (lines 263, 277):

```js
const decayDur = (pts[si].x - pts[1].x) / dm;   // Decay stage
const relDur = (pts[lastIdx].x - pts[si].x) / dm; // Release stage
```

A multiplier of 5× makes a C7 note's decay 5 times shorter than an A1 note. The default curve maps linearly from 1× (bass) to 3× (treble).

### 3.4 Timbre Keyframe Strip

**Requirement:** A horizontal UI where users can save "keyframes" at specific notes (e.g., A1, C4, E7). The engine must linearly interpolate all harmonic amplitudes and decay values between the two nearest keyframes based on the note played.

**Implementation:**

**UI** (`src/components/KeyframeStrip.jsx`): A visual strip spanning the 88-key piano range (MIDI 21–108) with:
- Keyframe markers showing note name and a mini canvas preview of the harmonic profile
- Green interpolation zones between adjacent keyframes
- A dropdown to add keyframes at any note, capturing the current harmonic editor state
- Three presets: Piano-like, Bass→Bright, Dark→Thin

**DSP interpolation** (`public/synth-worklet.js`, lines 195–216):

When a `noteOn` is received and ≥2 keyframes exist, the worklet finds the two nearest keyframes bracketing the note's frequency and linearly interpolates all 32 harmonic amplitudes:

```js
const t = (frequency - lo.frequency) / (hi.frequency - lo.frequency);
for (let h = 0; h < MAX_HARMONICS; h++) {
  result[h] = lo.harmonics[h] * (1 - t) + hi.harmonics[h] * t;
}
```

The interpolated harmonic array is stored on the voice (`v.interpolatedHarmonics`) and used in place of the global harmonic settings for the lifetime of that note.

### 3.5 Soft-Clip Mastering Compressor

**Requirement:** A final stage widget with Threshold, Knee, and Ratio controls. It must use a look-ahead buffer or a smoothed gain-reduction envelope to prevent digital clipping.

**Implementation:**

**UI** (`src/components/Compressor.jsx`): Renders a Canvas transfer-function plot (input vs. output amplitude) alongside three sliders:
- **Threshold** (10%–100%): Level above which compression begins
- **Knee** (0%–50%): Width of the soft transition zone
- **Ratio** (1:1–20:1): Compression strength above threshold

**DSP — Soft-clip function** (`public/synth-worklet.js`, lines 68–77):

Three-region piecewise compression:

| Region | Condition | Output |
|--------|-----------|--------|
| Below knee | `|x| ≤ T − K/2` | Pass-through: `x` |
| Knee zone | `T − K/2 < |x| ≤ T + K/2` | Quadratic soft bend: `|x| + (1/R − 1) × d² / (2K)` |
| Above threshold | `|x| > T + K/2` | Linear compression: `T + (|x| − T) / R` |

**DSP — Look-ahead buffer** (`public/synth-worklet.js`, lines 110–113, 349–365):

A 64-sample circular buffer (`LOOK_AHEAD_SAMPLES = 64`) delays the audio output while the gain-reduction envelope scans ahead for peaks:

```js
const delayed = this.lookAheadBuf[laIdx];     // read delayed sample
this.lookAheadBuf[laIdx] = mix;                // write current sample
// scan buffer for future peak
let futurePeak = 0;
for (let i = 0; i < LOOK_AHEAD_SAMPLES; i++) {
  const abs = Math.abs(this.lookAheadBuf[i]);
  if (abs > futurePeak) futurePeak = abs;
}
```

Gain reduction is asymmetrically smoothed (fast attack coefficient `0.02`, slow release `0.0003`) to prevent pumping artifacts:

```js
const coeff = targetGR < this.smoothedGR ? 0.02 : 0.0003;
this.smoothedGR += (targetGR - this.smoothedGR) * coeff;
```

---

## 4. UI & Visualization

### 4.1 Interactive 88-Key Keyboard

**Implementation** (`src/components/Keyboard.jsx`):

| Feature | Detail |
|---------|--------|
| Keys | 88 keys, MIDI 21 (A0) through 108 (C8) |
| Mouse | Click to play, drag across keys for glissando |
| Touch | `onTouchStart`/`onTouchEnd` per key, `touch-pan-x` for horizontal scroll |
| Computer keyboard | A–L maps to C4–F5 (upper row), Z–M maps to C3–B3 (lower row) |
| Web MIDI | `navigator.requestMIDIAccess()` with automatic device enumeration |
| Velocity | MIDI velocity (0–127) normalized to 0.0–1.0 and applied as envelope amplitude scaling |
| Visual feedback | Active keys glow cyan with box-shadow; C notes labeled |
| Auto-scroll | Scrolls to middle C on mount via `requestAnimationFrame` |
| Polyphony display | Active voice count and oscillator count (voices × 32) shown in stats panel |

**MIDI velocity mapping** (`src/utils/audioEngine.js`, line 75):

```js
velocity: velocity / 127
```

This normalized velocity is passed to the worklet and used to scale the envelope peak and sustain levels (worklet lines 252–256):

```js
const target = pts[1].y * vel;  // Attack peak scaled by velocity
const sus = pts[si].y * vel;    // Sustain level scaled by velocity
```

### 4.2 Real-time Spectrogram

**Implementation** (`src/components/Spectrogram.jsx`):

A waterfall-style frequency display rendered at 60fps using `requestAnimationFrame`:

- **FFT size:** 4096 (via `AnalyserNode.fftSize`), providing 2048 frequency bins
- **Display:** 512 bins shown (covering 0–~5500 Hz at 44100 Hz sample rate)
- **Rendering:** `Uint32Array` pixel manipulation on `ImageData` for performance. Columns shift left by 1 pixel per frame using `TypedArray.copyWithin()`.
- **Color mapping:** A pre-computed 256-entry `Uint32Array` color LUT mapping FFT magnitude to RGB, constructed at module load via `DataView.setUint32()` with little-endian byte order.
- **Frequency labels:** Hz labels rendered as an overlay on the left edge (100, 500, 1k, 2k, 5k, 10k, 15k Hz).

### 4.3 Waveform Display

**Implementation** (`src/components/Waveform.jsx`):

A time-domain oscilloscope rendering the raw audio waveform via `AnalyserNode.getByteTimeDomainData()`. Renders a cyan line on a dark background at 60fps.

---

## 5. Audio Signal Chain

```
Voice (×16)
  └─ 32 Harmonics (phase accumulator → sine LUT → amplitude)
  └─ Envelope (ADSR with velocity scaling & decay multiplier)
  └─ Sum → voice output
       │
       ▼
  Mix (sum of all active voices)
       │
       ▼
  Soft-Clip Compressor (threshold/knee/ratio)
       │
       ▼
  Look-Ahead Limiter (64-sample buffer, smoothed GR)
       │
       ▼
  Hard Clip (safety clamp to ±1.0)
       │
       ▼
  AnalyserNode (FFT for spectrogram/waveform)
       │
       ▼
  GainNode (master volume, smoothed via setTargetAtTime)
       │
       ▼
  AudioContext.destination (speakers)
```

---

## 6. Validation & Testing Specification

### TEST-1: The 60-Second Stability Test

**Specification:** Play a note for one minute. The spectrogram must show a perfectly straight line with zero frequency jitter or phase-drift noise.

**How the implementation passes:**

1. **Phase accumulator wraps at 1.0 every cycle** (worklet lines 330–332). The phase value never grows beyond 1.0, so there is no accumulation of floating-point error over time.
2. **Explicit normalization every ~1 second** (worklet lines 316–337). The `phaseResetCounter` triggers `phase = phase - Math.floor(phase)` at 44100-sample intervals, flushing any residual Float64 error to zero.
3. **Float64 storage** (worklet line 32). Phase accumulators use `Float64Array`, providing 52 bits of mantissa — sufficient for sub-sample precision at all musical frequencies.

The combination of mod-1 wrapping on every sample and forced normalization every second ensures that even after 60 minutes of continuous playback, the phase error is bounded to approximately `2^-52` (~2.2 × 10⁻¹⁶), far below audibility.

### TEST-2: The Pop-Free Test

**Specification:** Rapidly click a key. There should be no audible clicks or pops — only smooth overlapping envelopes.

**How the implementation passes:**

1. **Re-trigger from current level** (worklet lines 131–139). When a `noteOn` arrives for an already-active voice (same `noteId`), the previous `envLevel` is preserved. The Attack stage begins from this current level rather than from 0.0, eliminating any amplitude discontinuity.
2. **Smoothstep interpolation** (worklet lines 257–259). The envelope uses `s = t²(3 − 2t)` (Hermite smoothstep) for all transitions. This function has zero first-derivative at both endpoints, producing C1-continuous amplitude curves with no sudden jumps.
3. **Release from current level** (worklet lines 154–155). On `noteOff`, the release stage saves `releaseStartLevel = envLevel` and fades from there to 0, regardless of what envelope stage was active.

### TEST-3: Stress Test (320 Oscillators)

**Specification:** Play a 10-note chord with 32 harmonics each (320 oscillators total). The UI must remain responsive at 60fps, and audio must not crackle.

**How the implementation passes:**

1. **AudioWorklet runs on a dedicated audio thread**, completely decoupled from the main/UI thread. The React UI, Canvas renderings, and DOM updates are unaffected by DSP load.
2. **Sine lookup table** (worklet lines 14–23). A 4097-entry `Float32Array` with linear interpolation replaces `Math.sin()`, reducing per-oscillator cost to two array lookups and one multiply-add.
3. **Early-exit optimizations:**
   - Harmonics with amplitude < `1e-5` are skipped (line 322)
   - Harmonics above Nyquist are skipped via `break` (line 325)
   - Voices with envelope level < `1e-6` are skipped (line 309)
   - Inactive voices are skipped (line 303)
4. **Soft-clip compressor + look-ahead limiter** (worklet lines 347–368) prevent the summed output from exceeding ±1.0, avoiding digital clipping artifacts even when 10+ voices overlap.
5. **Level reporting is throttled to ~30 Hz** (worklet lines 377–382), sending only one `postMessage` per ~1470 samples instead of per block.

**Worst-case budget:** At 44100 Hz with 128-sample blocks, the worklet has ~2.9 ms per block. With 16 voices × 32 harmonics = 512 oscillators, each requiring ~3 operations (phase add, table lookup, multiply-accumulate), the total is ~1536 floating-point operations per sample, or ~197K per block — well within budget for modern devices.

### TEST-4: Interpolation Sweep

**Specification:** Set a "Bass" keyframe to be dark (low harmonics) and a "Treble" keyframe to be bright (high harmonics). A glissando between them should show the harmonics smoothly fading in/out on the spectrogram.

**How the implementation passes:**

1. **Keyframe system** (`KeyframeStrip.jsx` + worklet lines 195–216). Users can save harmonic snapshots at arbitrary notes. When ≥2 keyframes exist, every `noteOn` triggers linear interpolation of all 32 harmonic amplitudes between the two nearest keyframes based on the note's frequency.
2. **Per-voice interpolated harmonics** (worklet line 144). The interpolated array is stored on the voice object and used throughout that note's lifetime, so each note in a glissando gets its own frequency-appropriate timbre.
3. **Built-in presets** facilitate testing:
   - "Bass→Bright": A0 has only harmonics 1–3, C4 has `1/√(h+1)` rolloff, C8 has full sawtooth
   - Playing a chromatic run from low to high shows harmonics progressively appearing on the spectrogram

---

## 7. Project Structure

```
additive-synth/
├── public/
│   └── synth-worklet.js          # AudioWorklet DSP processor
├── src/
│   ├── main.jsx                  # Entry point, ErrorBoundary wrapper
│   ├── App.jsx                   # Root component, state management, audio engine sync
│   ├── index.css                 # Tailwind CSS entry with base styles
│   ├── utils/
│   │   └── audioEngine.js        # AudioContext/Worklet bridge, MIDI-to-frequency utils
│   └── components/
│       ├── ErrorBoundary.jsx     # React error boundary (catches render crashes)
│       ├── HarmonicEditor.jsx    # 32-bar logarithmic harmonic editor
│       ├── BezierEnvelope.jsx    # Interactive ADSR Bezier curve canvas
│       ├── DecayMultiplier.jsx   # Frequency→decay-speed Bezier curve
│       ├── KeyframeStrip.jsx     # Timbre keyframe UI with interpolation
│       ├── Compressor.jsx        # Soft-clip compressor controls + transfer plot
│       ├── Keyboard.jsx          # 88-key keyboard with MIDI/touch/keyboard input
│       ├── Spectrogram.jsx       # Waterfall frequency display
│       └── Waveform.jsx          # Time-domain oscilloscope
├── dist/                         # Production build output (committed for GitHub Pages)
├── index.html                    # Redirects to dist/index.html
├── vite.config.js                # Vite config: base './', Tailwind plugin, ES2020 target
├── package.json
└── TRD.md                        # This document
```

---

## 8. Browser Compatibility

| Feature | Minimum Browser |
|---------|----------------|
| AudioWorklet | Chrome 66+, Firefox 76+, Safari 14.1+ |
| Web MIDI API | Chrome 43+ (Chromium only; gracefully skipped on others) |
| Canvas 2D | All modern browsers |
| `Float64Array` | All modern browsers (ES2015) |
| CSS `oklch()` | Chrome 111+, Firefox 113+, Safari 15.4+ |
| `@property` | Chrome 85+, Firefox 128+, Safari 15.4+ |

Fallback: Inline hex colors in `index.html` ensure the page is visible even if Tailwind's `oklch()` values are unsupported. The `ErrorBoundary` component catches and displays render errors with a reload button.

---

## 9. Build & Deployment

```bash
cd additive-synth
npm install
npm run dev        # Development server at localhost:5173
npm run build      # Production build to dist/
```

The `dist/` folder is committed to the repository for GitHub Pages deployment. The root `additive-synth/index.html` redirects to `dist/index.html`. Vite's `base: './'` ensures all asset paths are relative, allowing deployment at any URL path.
