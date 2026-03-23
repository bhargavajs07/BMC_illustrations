import { useRef, useEffect } from 'react';

const WIDTH = 600;
const HEIGHT = 100;

export default function Waveform({ analyserNode }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!analyserNode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const bufLen = analyserNode.fftSize;
    const timeDomain = new Uint8Array(bufLen);

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      analyserNode.getByteTimeDomainData(timeDomain);

      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Center line
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, HEIGHT / 2);
      ctx.lineTo(WIDTH, HEIGHT / 2);
      ctx.stroke();

      // Waveform
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const sliceWidth = WIDTH / bufLen;
      let x = 0;
      for (let i = 0; i < bufLen; i++) {
        const v = timeDomain[i] / 128.0;
        const y = (v * HEIGHT) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();
    };

    draw();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [analyserNode]);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      className="w-full h-auto rounded-lg bg-gray-950 border border-gray-800"
    />
  );
}
