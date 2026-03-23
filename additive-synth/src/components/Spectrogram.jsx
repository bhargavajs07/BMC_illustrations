import { useRef, useEffect, useCallback } from 'react';

const WIDTH = 600;
const HEIGHT = 256;

export default function Spectrogram({ analyserNode }) {
  const canvasRef = useRef(null);
  const waterfallRef = useRef(null);
  const animFrameRef = useRef(null);

  const initWaterfall = useCallback(() => {
    if (!waterfallRef.current) {
      waterfallRef.current = document.createElement('canvas');
      waterfallRef.current.width = WIDTH;
      waterfallRef.current.height = HEIGHT;
    }
  }, []);

  useEffect(() => {
    initWaterfall();
    
    if (!analyserNode) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const wfCanvas = waterfallRef.current;
    const wfCtx = wfCanvas.getContext('2d');
    
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      
      analyserNode.getByteFrequencyData(dataArray);
      
      // Shift waterfall left by 1 pixel
      const imageData = wfCtx.getImageData(1, 0, WIDTH - 1, HEIGHT);
      wfCtx.putImageData(imageData, 0, 0);
      
      // Draw new column on the right
      const binsToShow = Math.min(bufferLength, 512);
      for (let i = 0; i < HEIGHT; i++) {
        const binIndex = Math.floor((i / HEIGHT) * binsToShow);
        const value = dataArray[binIndex];
        const normalized = value / 255;
        
        const r = Math.floor(normalized * normalized * 255);
        const g = Math.floor(normalized * 180);
        const b = Math.floor(Math.sqrt(normalized) * 255);
        
        wfCtx.fillStyle = `rgb(${r},${g},${b})`;
        wfCtx.fillRect(WIDTH - 1, HEIGHT - 1 - i, 1, 1);
      }
      
      // Draw waterfall to main canvas
      ctx.drawImage(wfCanvas, 0, 0);
      
      // Overlay frequency scale
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, 40, HEIGHT);
      
      ctx.fillStyle = '#9ca3af';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      
      const sampleRate = analyserNode.context.sampleRate;
      const freqPerBin = sampleRate / analyserNode.fftSize;
      const maxFreqShown = binsToShow * freqPerBin;
      
      const freqMarks = [100, 500, 1000, 2000, 5000, 10000, 15000];
      for (const freq of freqMarks) {
        if (freq > maxFreqShown) continue;
        const y = HEIGHT - 1 - (freq / maxFreqShown) * HEIGHT;
        ctx.fillText(freq >= 1000 ? `${freq / 1000}k` : `${freq}`, 36, y + 3);
        
        ctx.strokeStyle = 'rgba(156, 163, 175, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(WIDTH, y);
        ctx.stroke();
      }
      
      // Time indicator
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(WIDTH - 50, HEIGHT - 16, 50, 16);
      ctx.fillStyle = '#9ca3af';
      ctx.font = '9px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('Time →', WIDTH - 5, HEIGHT - 5);
    };
    
    draw();
    
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [analyserNode, initWaterfall]);

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">
        Spectrogram
      </h3>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="w-full h-auto rounded-lg bg-gray-950 border border-gray-800"
      />
      <div className="mt-2 text-[9px] text-gray-500">
        Real-time waterfall frequency display — Frequency (vertical) vs Time (horizontal)
      </div>
    </div>
  );
}
