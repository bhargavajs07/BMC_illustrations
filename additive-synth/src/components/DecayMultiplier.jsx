import { useState, useRef, useCallback, useEffect } from 'react';

const CANVAS_W = 500;
const CANVAS_H = 180;
const PAD = 30;
const DRAW_W = CANVAS_W - PAD * 2;
const DRAW_H = CANVAS_H - PAD * 2;
const MAX_MULT = 10;

function toX(x) { return PAD + x * DRAW_W; }
function toY(y) { return PAD + (1 - y / MAX_MULT) * DRAW_H; }
function fromX(cx) { return Math.max(0, Math.min(1, (cx - PAD) / DRAW_W)); }
function fromY(cy) { return Math.max(0.1, Math.min(MAX_MULT, (1 - (cy - PAD) / DRAW_H) * MAX_MULT)); }

function drawScene(ctx, points, hovIdx) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Grid
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 10; i++) {
    const x = PAD + (i / 10) * DRAW_W;
    ctx.beginPath(); ctx.moveTo(x, PAD); ctx.lineTo(x, PAD + DRAW_H); ctx.stroke();
  }
  for (let i = 0; i <= MAX_MULT; i += 1) {
    const y = toY(i);
    ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(PAD + DRAW_W, y); ctx.stroke();
  }

  // 1× reference line
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(PAD, toY(1)); ctx.lineTo(PAD + DRAW_W, toY(1)); ctx.stroke();
  ctx.setLineDash([]);

  // Axis labels
  ctx.fillStyle = '#6b7280';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('A0', PAD, CANVAS_H - 3);
  ctx.fillText('C4', PAD + DRAW_W * 0.5, CANVAS_H - 3);
  ctx.fillText('C8', PAD + DRAW_W, CANVAS_H - 3);
  ctx.textAlign = 'right';
  for (let i = 0; i <= MAX_MULT; i += 2) {
    ctx.fillText(i + '×', PAD - 4, toY(i) + 3);
  }

  // Curve
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i], p3 = points[i + 1];
    const cp1 = p0.cpOut || { x: p0.x + (p3.x - p0.x) * 0.33, y: p0.y };
    const cp2 = p3.cpIn || { x: p3.x - (p3.x - p0.x) * 0.33, y: p3.y };
    if (i === 0) ctx.moveTo(toX(p0.x), toY(p0.y));
    ctx.bezierCurveTo(toX(cp1.x), toY(cp1.y), toX(cp2.x), toY(cp2.y), toX(p3.x), toY(p3.y));
  }
  ctx.stroke();

  // Fill under curve
  ctx.lineTo(toX(points[points.length - 1].x), toY(0));
  ctx.lineTo(toX(points[0].x), toY(0));
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, PAD, 0, PAD + DRAW_H);
  grad.addColorStop(0, 'rgba(168,85,247,0.12)');
  grad.addColorStop(1, 'rgba(168,85,247,0.01)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Control handles
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const drawHandle = (cp, color) => {
      ctx.strokeStyle = color + '44';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(toX(p.x), toY(p.y));
      ctx.lineTo(toX(cp.x), toY(cp.y));
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(toX(cp.x), toY(cp.y), 4, 0, Math.PI * 2); ctx.fill();
    };
    if (p.cpOut && i < points.length - 1) drawHandle(p.cpOut, '#f59e0b');
    if (p.cpIn && i > 0) drawHandle(p.cpIn, '#f59e0b');

    ctx.fillStyle = hovIdx === i ? '#fff' : '#a855f7';
    ctx.beginPath(); ctx.arc(toX(p.x), toY(p.y), 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export default function DecayMultiplier({ points, onChange }) {
  const canvasRef = useRef(null);
  const [dragInfo, setDragInfo] = useState(null);
  const [hovIdx, setHovIdx] = useState(null);
  const ptsRef = useRef(points);
  ptsRef.current = points;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) drawScene(canvas.getContext('2d'), points, hovIdx);
  }, [points, hovIdx]);

  const getCoords = useCallback((e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { cx: (e.clientX - r.left) * (CANVAS_W / r.width), cy: (e.clientY - r.top) * (CANVAS_H / r.height) };
  }, []);

  const findHandle = useCallback((cx, cy) => {
    const thresh = 12;
    for (let i = 0; i < ptsRef.current.length; i++) {
      const p = ptsRef.current[i];
      for (const [key, prop] of [['cpOut', p.cpOut], ['cpIn', p.cpIn]]) {
        if (prop) {
          const dx = cx - toX(prop.x), dy = cy - toY(prop.y);
          if (Math.sqrt(dx * dx + dy * dy) < thresh) return { type: key, index: i };
        }
      }
    }
    for (let i = 0; i < ptsRef.current.length; i++) {
      const p = ptsRef.current[i];
      const dx = cx - toX(p.x), dy = cy - toY(p.y);
      if (Math.sqrt(dx * dx + dy * dy) < thresh) return { type: 'point', index: i };
    }
    return null;
  }, []);

  const handleDown = useCallback((e) => {
    const { cx, cy } = getCoords(e);
    const h = findHandle(cx, cy);
    if (h) {
      setDragInfo(h);
    } else {
      // Add new point on double-click only
    }
  }, [findHandle, getCoords]);

  const handleMove = useCallback((e) => {
    const { cx, cy } = getCoords(e);
    if (!dragInfo) {
      const h = findHandle(cx, cy);
      setHovIdx(h?.type === 'point' ? h.index : null);
      return;
    }
    const x = fromX(cx), y = fromY(cy);
    const np = ptsRef.current.map(p => ({ ...p }));
    const idx = dragInfo.index;

    if (dragInfo.type === 'point') {
      if (idx === 0) np[idx] = { ...np[idx], y };
      else if (idx === np.length - 1) np[idx] = { ...np[idx], y };
      else {
        const minX = np[idx - 1].x + 0.01;
        const maxX = np[idx + 1].x - 0.01;
        np[idx] = { ...np[idx], x: Math.max(minX, Math.min(maxX, x)), y };
      }
    } else if (dragInfo.type === 'cpOut') {
      np[idx] = { ...np[idx], cpOut: { x: Math.max(np[idx].x, Math.min(1, x)), y } };
    } else {
      np[idx] = { ...np[idx], cpIn: { x: Math.max(0, Math.min(np[idx].x, x)), y } };
    }
    onChange(np);
  }, [dragInfo, findHandle, getCoords, onChange]);

  const handleUp = useCallback(() => setDragInfo(null), []);

  const handleDblClick = useCallback((e) => {
    const { cx, cy } = getCoords(e);
    const h = findHandle(cx, cy);
    if (h?.type === 'point' && h.index > 0 && h.index < ptsRef.current.length - 1) {
      const np = [...ptsRef.current];
      np.splice(h.index, 1);
      onChange(np);
      return;
    }
    // Add point
    const x = fromX(cx), y = fromY(cy);
    const np = [...ptsRef.current];
    let ins = np.length;
    for (let i = 0; i < np.length; i++) {
      if (np[i].x > x) { ins = i; break; }
    }
    const dx = 0.05;
    np.splice(ins, 0, { x, y, cpIn: { x: x - dx, y }, cpOut: { x: x + dx, y } });
    onChange(np);
  }, [findHandle, getCoords, onChange]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [handleMove, handleUp]);

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">
        Frequency-Dependent Decay Multiplier
      </h3>
      <canvas
        ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
        className="w-full h-auto rounded-lg bg-gray-950 cursor-crosshair border border-gray-800"
        onMouseDown={handleDown}
        onDoubleClick={handleDblClick}
      />
      <div className="flex justify-between mt-2 text-[9px] text-gray-500">
        <span>Low frequencies (1×) → High frequencies (up to 10×)</span>
        <span>Double-click to add/remove points</span>
      </div>
    </div>
  );
}
