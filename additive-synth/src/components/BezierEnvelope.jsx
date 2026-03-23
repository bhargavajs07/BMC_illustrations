import { useState, useRef, useCallback, useEffect } from 'react';

const CANVAS_W = 500;
const CANVAS_H = 200;
const PAD = 30;
const DRAW_W = CANVAS_W - PAD * 2;
const DRAW_H = CANVAS_H - PAD * 2;

function toCanvasX(x, maxTime) { return PAD + (x / maxTime) * DRAW_W; }
function toCanvasY(y) { return PAD + (1 - y) * DRAW_H; }
function fromCanvasX(cx, maxTime) { return ((cx - PAD) / DRAW_W) * maxTime; }
function fromCanvasY(cy) { return 1 - (cy - PAD) / DRAW_H; }

function drawBezierCurve(ctx, points, maxTime, sustainIndex, highlightIndex) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  
  // Grid
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 10; i++) {
    const x = PAD + (i / 10) * DRAW_W;
    ctx.beginPath(); ctx.moveTo(x, PAD); ctx.lineTo(x, PAD + DRAW_H); ctx.stroke();
    const y = PAD + (i / 10) * DRAW_H;
    ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(PAD + DRAW_W, y); ctx.stroke();
  }
  
  // Labels
  ctx.fillStyle = '#6b7280';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 5; i++) {
    const t = (i / 5) * maxTime;
    ctx.fillText(t.toFixed(1) + 's', PAD + (i / 5) * DRAW_W, CANVAS_H - 5);
  }
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    ctx.fillText((i / 4).toFixed(1), PAD - 5, PAD + (1 - i / 4) * DRAW_H + 3);
  }
  
  // Phase labels
  if (points.length >= 4) {
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f59e0b88';
    const phases = ['A', 'D', 'S', 'R'];
    for (let i = 0; i < Math.min(points.length - 1, 4); i++) {
      const midX = (toCanvasX(points[i].x, maxTime) + toCanvasX(points[i + 1].x, maxTime)) / 2;
      if (i < phases.length) ctx.fillText(phases[i], midX, PAD - 5);
    }
  }
  
  // Sustain line
  if (sustainIndex < points.length) {
    ctx.strokeStyle = '#f59e0b44';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    const sy = toCanvasY(points[sustainIndex].y);
    ctx.beginPath(); ctx.moveTo(PAD, sy); ctx.lineTo(PAD + DRAW_W, sy); ctx.stroke();
    ctx.setLineDash([]);
  }
  
  // Curve
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p3 = points[i + 1];
    const cp1 = p0.cpOut || { x: p0.x + (p3.x - p0.x) * 0.33, y: p0.y };
    const cp2 = p3.cpIn || { x: p3.x - (p3.x - p0.x) * 0.33, y: p3.y };
    
    if (i === 0) ctx.moveTo(toCanvasX(p0.x, maxTime), toCanvasY(p0.y));
    ctx.bezierCurveTo(
      toCanvasX(cp1.x, maxTime), toCanvasY(cp1.y),
      toCanvasX(cp2.x, maxTime), toCanvasY(cp2.y),
      toCanvasX(p3.x, maxTime), toCanvasY(p3.y)
    );
  }
  ctx.stroke();
  
  // Fill under curve
  ctx.lineTo(toCanvasX(points[points.length - 1].x, maxTime), toCanvasY(0));
  ctx.lineTo(toCanvasX(points[0].x, maxTime), toCanvasY(0));
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, PAD, 0, PAD + DRAW_H);
  grad.addColorStop(0, 'rgba(6, 182, 212, 0.15)');
  grad.addColorStop(1, 'rgba(6, 182, 212, 0.02)');
  ctx.fillStyle = grad;
  ctx.fill();
  
  // Control handles
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    
    if (p.cpOut && i < points.length - 1) {
      ctx.strokeStyle = '#f59e0b55';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(toCanvasX(p.x, maxTime), toCanvasY(p.y));
      ctx.lineTo(toCanvasX(p.cpOut.x, maxTime), toCanvasY(p.cpOut.y));
      ctx.stroke();
      
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(toCanvasX(p.cpOut.x, maxTime), toCanvasY(p.cpOut.y), 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    if (p.cpIn && i > 0) {
      ctx.strokeStyle = '#f59e0b55';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(toCanvasX(p.x, maxTime), toCanvasY(p.y));
      ctx.lineTo(toCanvasX(p.cpIn.x, maxTime), toCanvasY(p.cpIn.y));
      ctx.stroke();
      
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(toCanvasX(p.cpIn.x, maxTime), toCanvasY(p.cpIn.y), 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Main point
    ctx.fillStyle = highlightIndex === i ? '#ffffff' : (i === sustainIndex ? '#f59e0b' : '#06b6d4');
    ctx.beginPath();
    ctx.arc(toCanvasX(p.x, maxTime), toCanvasY(p.y), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export default function BezierEnvelope({ points, onChange, sustainIndex = 2, title = 'ADSR Envelope', maxTime = 3 }) {
  const canvasRef = useRef(null);
  const [dragInfo, setDragInfo] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const pointsRef = useRef(points);
  pointsRef.current = points;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawBezierCurve(ctx, points, maxTime, sustainIndex, hoverIndex);
  }, [points, maxTime, sustainIndex, hoverIndex]);

  const findHandle = useCallback((cx, cy) => {
    const threshold = 10;
    const mt = maxTime;
    
    for (let i = 0; i < pointsRef.current.length; i++) {
      const p = pointsRef.current[i];
      
      if (p.cpOut) {
        const dx = cx - toCanvasX(p.cpOut.x, mt);
        const dy = cy - toCanvasY(p.cpOut.y);
        if (Math.sqrt(dx * dx + dy * dy) < threshold) return { type: 'cpOut', index: i };
      }
      if (p.cpIn) {
        const dx = cx - toCanvasX(p.cpIn.x, mt);
        const dy = cy - toCanvasY(p.cpIn.y);
        if (Math.sqrt(dx * dx + dy * dy) < threshold) return { type: 'cpIn', index: i };
      }
    }
    
    for (let i = 0; i < pointsRef.current.length; i++) {
      const p = pointsRef.current[i];
      const dx = cx - toCanvasX(p.x, mt);
      const dy = cy - toCanvasY(p.y);
      if (Math.sqrt(dx * dx + dy * dy) < threshold) return { type: 'point', index: i };
    }
    
    return null;
  }, [maxTime]);

  const handleMouseDown = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    
    const handle = findHandle(cx, cy);
    if (handle) {
      setDragInfo(handle);
    } else {
      const x = Math.max(0, fromCanvasX(cx, maxTime));
      const y = Math.max(0, Math.min(1, fromCanvasY(cy)));
      
      const newPoints = [...pointsRef.current];
      let insertIdx = newPoints.length;
      for (let i = 0; i < newPoints.length; i++) {
        if (newPoints[i].x > x) { insertIdx = i; break; }
      }
      
      const dx = insertIdx < newPoints.length 
        ? (newPoints[insertIdx].x - (insertIdx > 0 ? newPoints[insertIdx - 1].x : 0)) * 0.33
        : 0.1;
      
      newPoints.splice(insertIdx, 0, {
        x, y,
        cpIn: { x: x - dx, y },
        cpOut: { x: x + dx, y },
      });
      onChange(newPoints);
      setDragInfo({ type: 'point', index: insertIdx });
    }
  }, [findHandle, maxTime, onChange]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    if (!dragInfo) {
      const handle = findHandle(cx, cy);
      setHoverIndex(handle?.type === 'point' ? handle.index : null);
      return;
    }

    const x = Math.max(0, fromCanvasX(cx, maxTime));
    const y = Math.max(0, Math.min(1, fromCanvasY(cy)));
    
    const newPoints = pointsRef.current.map((p, i) => ({ ...p }));
    const idx = dragInfo.index;

    if (dragInfo.type === 'point') {
      if (idx === 0) {
        newPoints[idx] = { ...newPoints[idx], y };
      } else if (idx === newPoints.length - 1) {
        newPoints[idx] = { ...newPoints[idx], x: Math.max(newPoints[idx - 1].x + 0.01, x), y };
      } else {
        const minX = newPoints[idx - 1].x + 0.01;
        const maxX = newPoints[idx + 1].x - 0.01;
        newPoints[idx] = { ...newPoints[idx], x: Math.max(minX, Math.min(maxX, x)), y };
      }
    } else if (dragInfo.type === 'cpOut') {
      newPoints[idx] = {
        ...newPoints[idx],
        cpOut: { x: Math.max(newPoints[idx].x, x), y },
      };
    } else if (dragInfo.type === 'cpIn') {
      newPoints[idx] = {
        ...newPoints[idx],
        cpIn: { x: Math.min(newPoints[idx].x, x), y },
      };
    }

    onChange(newPoints);
  }, [dragInfo, findHandle, maxTime, onChange]);

  const handleMouseUp = useCallback(() => {
    setDragInfo(null);
  }, []);

  const handleDoubleClick = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    
    const handle = findHandle(cx, cy);
    if (handle?.type === 'point' && handle.index > 0 && handle.index < pointsRef.current.length - 1) {
      const newPoints = [...pointsRef.current];
      newPoints.splice(handle.index, 1);
      onChange(newPoints);
    }
  }, [findHandle, onChange]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="w-full h-auto rounded-lg bg-gray-950 cursor-crosshair border border-gray-800"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      />
      <div className="flex justify-between mt-2 text-[9px] text-gray-500">
        <span>Click to add point • Double-click to remove • Drag handles to shape curve</span>
        <span>Sustain at point {sustainIndex + 1}</span>
      </div>
    </div>
  );
}
