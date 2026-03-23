import { useRef, useEffect, useCallback } from 'react';

const CANVAS_W = 200;
const CANVAS_H = 200;
const PAD = 25;
const DRAW = CANVAS_W - PAD * 2;

function drawCompressor(ctx, threshold, knee, ratio) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  
  // Grid
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const v = PAD + (i / 4) * DRAW;
    ctx.beginPath(); ctx.moveTo(v, PAD); ctx.lineTo(v, PAD + DRAW); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD, v); ctx.lineTo(PAD + DRAW, v); ctx.stroke();
  }
  
  // 1:1 line
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(PAD, PAD + DRAW);
  ctx.lineTo(PAD + DRAW, PAD);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Compression curve
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  const steps = 100;
  for (let i = 0; i <= steps; i++) {
    const inputDb = (i / steps) * -0 + (1 - i / steps) * -60;
    const inputLin = i / steps;
    
    let outputLin;
    const halfKnee = knee / 2;
    
    if (inputLin <= threshold - halfKnee) {
      outputLin = inputLin;
    } else if (inputLin <= threshold + halfKnee) {
      const x = inputLin - threshold + halfKnee;
      outputLin = inputLin + ((1 / ratio - 1) * x * x) / (2 * knee || 0.001);
    } else {
      const over = inputLin - threshold;
      outputLin = threshold + over / ratio;
    }
    
    const cx = PAD + inputLin * DRAW;
    const cy = PAD + DRAW - outputLin * DRAW;
    
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  }
  ctx.stroke();
  
  // Threshold marker
  const tx = PAD + threshold * DRAW;
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(tx, PAD);
  ctx.lineTo(tx, PAD + DRAW);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // Labels
  ctx.fillStyle = '#6b7280';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Input', PAD + DRAW / 2, CANVAS_H - 3);
  ctx.save();
  ctx.translate(8, PAD + DRAW / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Output', 0, 0);
  ctx.restore();
}

export default function Compressor({ threshold, knee, ratio, onChange }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCompressor(canvas.getContext('2d'), threshold, knee, ratio);
  }, [threshold, knee, ratio]);

  const handleChange = useCallback((key, value) => {
    onChange({ threshold, knee, ratio, [key]: value });
  }, [threshold, knee, ratio, onChange]);

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider mb-3">
        Soft-Clip Compressor
      </h3>
      
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-start">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="rounded-lg bg-gray-950 border border-gray-800 flex-shrink-0 w-full sm:w-auto h-auto"
          style={{ maxWidth: '160px', maxHeight: '160px' }}
        />
        
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[10px] text-gray-400 uppercase">Threshold</label>
              <span className="text-[10px] text-orange-400 font-mono">{(threshold * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.01"
              value={threshold}
              onChange={(e) => handleChange('threshold', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                         [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-orange-400 
                         [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[10px] text-gray-400 uppercase">Knee</label>
              <span className="text-[10px] text-orange-400 font-mono">{(knee * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={knee}
              onChange={(e) => handleChange('knee', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                         [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-orange-400 
                         [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <label className="text-[10px] text-gray-400 uppercase">Ratio</label>
              <span className="text-[10px] text-orange-400 font-mono">{ratio.toFixed(1)}:1</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="0.1"
              value={ratio}
              onChange={(e) => handleChange('ratio', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                         [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-orange-400 
                         [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-2 text-[9px] text-gray-500">
        Soft-clip mastering with smoothed gain reduction — prevents digital clipping
      </div>
    </div>
  );
}
