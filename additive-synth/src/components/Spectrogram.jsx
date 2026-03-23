import { useRef, useEffect } from 'react';

const WIDTH = 600;
const HEIGHT = 200;

const COLOR_LUT = new Uint32Array(256);
(function buildLUT() {
  const view = new DataView(COLOR_LUT.buffer);
  for (let i = 0; i < 256; i++) {
    const n = i / 255;
    const r = Math.floor(Math.min(1, n * n * 2) * 255);
    const g = Math.floor(Math.min(1, n * 1.3) * 200);
    const b = Math.floor(Math.min(1, Math.sqrt(n)) * 255);
    const a = 255;
    view.setUint32(i * 4, (a << 24) | (b << 16) | (g << 8) | r, true);
  }
})();

export default function Spectrogram({ analyserNode }) {
  const canvasRef = useRef(null);
  const wfDataRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!analyserNode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const bufLen = analyserNode.frequencyBinCount;
    const freqData = new Uint8Array(bufLen);
    const binsToShow = Math.min(bufLen, 512);

    if (!wfDataRef.current || wfDataRef.current.width !== WIDTH) {
      wfDataRef.current = ctx.createImageData(WIDTH, HEIGHT);
      const d = new Uint32Array(wfDataRef.current.data.buffer);
      d.fill(0xFF000000);
    }

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(freqData);

      const imgData = wfDataRef.current;
      const pixels = new Uint32Array(imgData.data.buffer);

      // Shift columns left by 1
      for (let y = 0; y < HEIGHT; y++) {
        const row = y * WIDTH;
        pixels.copyWithin(row, row + 1, row + WIDTH);
      }

      // New column on right
      const rightCol = WIDTH - 1;
      for (let y = 0; y < HEIGHT; y++) {
        const binIdx = Math.floor(((HEIGHT - 1 - y) / HEIGHT) * binsToShow);
        const val = freqData[binIdx];
        pixels[y * WIDTH + rightCol] = COLOR_LUT[val];
      }

      ctx.putImageData(imgData, 0, 0);

      // Frequency scale overlay
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, 38, HEIGHT);
      ctx.fillStyle = '#6b7280';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';

      const sr = analyserNode.context.sampleRate;
      const freqPerBin = sr / analyserNode.fftSize;
      const maxFreq = binsToShow * freqPerBin;

      for (const f of [100, 500, 1000, 2000, 5000, 10000, 15000]) {
        if (f > maxFreq) continue;
        const y = HEIGHT - 1 - (f / maxFreq) * HEIGHT;
        ctx.fillText(f >= 1000 ? `${f / 1000}k` : `${f}`, 34, y + 3);
        ctx.strokeStyle = 'rgba(107,114,128,0.12)';
        ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(38, y); ctx.lineTo(WIDTH, y); ctx.stroke();
      }
    };

    draw();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [analyserNode]);

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">
        Real-time Spectrogram
      </h3>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="w-full h-auto rounded-lg bg-black border border-gray-800"
      />
      <div className="flex justify-between mt-2 text-[9px] text-gray-500">
        <span>Frequency (Hz) ↑</span>
        <span>Time →</span>
      </div>
    </div>
  );
}
