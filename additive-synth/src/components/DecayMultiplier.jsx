import { useState, useRef, useCallback, useEffect } from 'react';

const CANVAS_W = 500;
const CANVAS_H = 150;
const PAD = 30;
const DRAW_W = CANVAS_W - PAD * 2;
const DRAW_H = CANVAS_H - PAD * 2;

const MAX_MULT = 10;

function toCanvasX(x) { return PAD + x * DRAW_W; }
function toCanvasY(y) { return PAD + (1 - y / MAX_MULT) * DRAW_H; }
function fromCanvasX(cx) { return (cx - PAD) / DRAW_W; }
function fromCanvasY(cy) { return (1 - (cy - PAD) / DRAW_H) * MAX_MULT; }

function drawCurve(ctx, points, hoveredIdx) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  
  // Grid
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 10; i++) {
    const x = PAD + (i / 10) * DRAW_W;
    ctx.beginPath(); ctx.moveTo(x, PAD); ctx.lineTo(x, PAD + DRAW_H); ctx.stroke();
  }
  for (let i = 0; i <= MAX_MULT; i += 2) {
    const y = toCanvasY(i);
    ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(PAD + DRAW_W, y); ctx.stroke();
  }
  
  // Axis labels
  ctx.fillStyle = '#6b7280';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Low Freq', PAD + DRAW_W * 0.15, CANVAS_H - 3);
  ctx.fillText('High Freq', PAD + DRAW_W * 0.85, CANVAS_H - 3);
  ctx.textAlign = 'right';
  for (let i = 0; i <= MAX_MULT; i += 2) {
    ctx.fillText(i + '×', PAD - 4, toCanvasY(i) + 3);
  }
  
  // Curve
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p3 = points[i + 1];
    const cp1 = p0.cpOut || { x: p0.x + (p3.x - p0.x) * 0.33, y: p0.y };
    const cp2 = p3.cpIn || { x: p3.x - (p3.x - p0.x) * 0.33, y: p3.y };
    
    if (i === 0) ctx.moveTo(toCanvasX(p0.x), toCanvasY(p0.y));
    ctx.bezierCurveTo(
      toCanvasX(cp1.x), toCanvasY(cp1.y),
      toCanvasX(cp2.x), toCanvasY(cp2.y),
      toCanvasX(p3.x), toCanvasY(p3.y)
    );
  }
  ctx.stroke();
  
  // Fill
  ctx.lineTo(toCanvasX(points[points.length - 1].x), toCanvasY(0));
  ctx.lineTo(toCanvasX(points[0].x), toCanvasY(0));
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, PAD, 0, PAD + DRAW_H);
  grad.addColorStop(0, 'rgba(168, 85, 247, 0.12)');
  grad.addColorStop(1, 'rgba(168, 85, 247, 0.02)');
  ctx.fillStyle = grad;
  ctx.fill();
  
  // Handles
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    
    if (p.cpOut && i < points.length - 1) {
      ctx.strokeStyle = '#f59e0b44';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(toCanvasX(p.x), toCanvasY(p.y));
      ctx.lineTo(toCanvasX(p.cpOut.x), toCanvasY(p.cpOut.y));
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(toCanvasX(p.cpOut.x), toCanvasY(p.cpOut.y), 4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (p.cpIn && i > 0) {
      ctx.strokeStyle = '#f59e0b44';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(toCanvasX(p.x), toCanvasY(p.y));
      ctx.lineTo(toCanvasX(p.cpIn.x), toCanvasY(p.cpIn.y));
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(toCanvasX(p.cpIn.x), toCanvasY(p.cpIn.y), 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.fillStyle = hoveredIdx === i ? '#ffffff' : '#a855f7';
    ctx.beginPath();
    ctx.arc(toCanvasX(p.x), toCanvasY(p.y), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export default function DecayMultiplier({ points, onChange }) {
  const canvasRef = useRef(null);
  const [dragInfo, setDragInfo] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const pointsRef = useRef(points);
  pointsRef.current = points;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawCurve(ctx, points, hoveredIdx);
  }, [points, hoveredIdx]);

  const findHandle = useCallback((cx, cy) => {
    const threshold = 10;
    for (let i = 0; i < pointsRef.current.length; i++) {
      const p = pointsRef.current[i];
      if (p.cpOut) {
        const dx = cx - toCanvasX(p.cpOut.x);
        const dy = cy - toCanvasY(p.cpOut.y);
        if (Math.sqrt(dx * dx + dy * dy) < threshold) return { type: 'cpOut', index: i };
      }
      if (p.cpIn) {
        const dx = cx - toCanvasX(p.cpIn.x);
        const dy = cy - toCanvasY(p.cpIn.y);
        if (Math.sqrt(dx * dx + dy * dy) < threshold) return { type: 'cpIn', index: i };
      }
    }
    for (let i = 0; i < pointsRef.current.length; i++) {
      const p = pointsRef.current[i];
      const dx = cx - toCanvasX(p.x);
      const dy = cy - toCanvasY(p.y);
      if (Math.sqrt(dx * dx + dy * dy) < threshold) return { type: 'point', index: i };
    }
    return null;
  }, []);

  const getCanvasCoords = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      cx: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      cy: (e.clientY - rect.top) * (CANVAS_H / rect.height),
    };
  }, []);

  const handleMouseDown = useCallback((e) => {
    const { cx, cy } = getCanvasCoords(e);
    const handle = findHandle(cx, cy);
    if (handle) {
      setDragInfo(handle);
    }
  }, [findHandle, getCanvasCoords]);

  const handleMouseMove = useCallback((e) => {
    const { cx, cy } = getCanvasCoords(e);
    
    if (!dragInfo) {
      const handle = findHandle(cx, cy);
      setHoveredIdx(handle?.type === 'point' ? handle.index : null);
      return;
    }
    
    const x = Math.max(0, Math.min(1, fromCanvasX(cx)));
    const y = Math.max(0.1, Math.min(MAX_MULT, fromCanvasY(cy)));
    
    const newPoints = pointsRef.current.map(p => ({ ...p }));
    const idx = dragInfo.index;
    
    if (dragInfo.type === 'point') {
      if (idx === 0) {
        newPoints[idx] = { ...newPoints[idx], y };
      } else if (idx === newPoints.length - 1) {
        newPoints[idx] = { ...newPoints[idx], y };
      } else {
        const minX = newPoints[idx - 1].x + 0.01;
        const maxX = newPoints[idx + 1].x - 0.01;
        newPoints[idx] = { ...newPoints[idx], x: Math.max(minX, Math.min(maxX, x)), y };
      }
    } else if (dragInfo.type === 'cpOut') {
      newPoints[idx] = { ...newPoints[idx], cpOut: { x: Math.max(newPoints[idx].x, Math.min(1, x)), y } };
    } else if (dragInfo.type === 'cpIn') {
      newPoints[idx] = { ...newPoints[idx], cpIn: { x: Math.max(0, Math.min(newPoints[idx].x, x)), y } };
    }
    
    onChange(newPoints);
  }, [dragInfo, findHandle, getCanvasCoords, onChange]);

  const handleMouseUp = useCallback(() => { setDragInfo(null); }, []);

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
      <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">
        Frequency-Dependent Decay Multiplier
      </h3>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="w-full h-auto rounded-lg bg-gray-950 cursor-crosshair border border-gray-800"
        onMouseDown={handleMouseDown}
      />
      <div className="mt-2 text-[9px] text-gray-500">
        Maps frequency range to decay speed (1× = normal, 10× = ten times faster)
      </div>
    </div>
  );
}
