// Zone-shape renderers used by zoneEngine.js's drawZones() loop.
// Extracted verbatim from the original drawArena() zone loop
// (iron_fist_battle_v8 (2).html, ~lines 6959-7083). Split out of
// zoneEngine.js purely to keep both files under the 300-line limit —
// logic/values are unchanged from the original.
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { spawnParticles } from '../../core/particles.js';

// Orig. lines ~6959-6986 (inside the S.zones loop, z.type==='spinner' branch)
export function drawSpinnerZone(ctx, z, t) {
  const cos = Math.cos(z.angle || 0), sin = Math.sin(z.angle || 0);
  const ex = z.cx + cos * z.armLen, ey = z.cy + sin * z.armLen;
  ctx.save();
  ctx.beginPath(); ctx.rect(AM, AM, ARENA_W - AM * 2, ARENA_H - AM * 2); ctx.clip();
  if (z.warn) {
    const pulse = 0.3 + 0.2 * Math.sin(t * 0.4);
    ctx.strokeStyle = `rgba(255,80,0,${pulse})`;
    ctx.lineWidth = z.thickness || 10; ctx.setLineDash([10, 6]);
    ctx.beginPath(); ctx.moveTo(z.cx, z.cy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.setLineDash([]);
  } else if (z.active) {
    // glow
    ctx.strokeStyle = 'rgba(255,80,0,0.2)'; ctx.lineWidth = (z.thickness || 10) + 12;
    ctx.beginPath(); ctx.moveTo(z.cx, z.cy); ctx.lineTo(ex, ey); ctx.stroke();
    // core
    ctx.strokeStyle = 'rgba(255,60,0,0.95)'; ctx.lineWidth = z.thickness || 10;
    ctx.beginPath(); ctx.moveTo(z.cx, z.cy); ctx.lineTo(ex, ey); ctx.stroke();
    // bright edge
    ctx.strokeStyle = 'rgba(255,200,80,0.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(z.cx, z.cy); ctx.lineTo(ex, ey); ctx.stroke();
    // pivot dot
    ctx.fillStyle = 'rgba(255,200,80,0.9)';
    ctx.beginPath(); ctx.arc(z.cx, z.cy, 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// Orig. lines ~6988-7016 (z.type==='zigzag' branch)
export function drawZigzagBall(ctx, z) {
  const zrel = S.atkTimer - z.startTick;
  if (zrel < 0) return;
  const r = z.ballR || 8;

  if (z.grace) {
    // White — grace period, no damage
    const glow = ctx.createRadialGradient(z.bx, z.by, 0, z.bx, z.by, r * 2);
    glow.addColorStop(0, 'rgba(255,255,255,0.35)');
    glow.addColorStop(1, 'rgba(200,220,255,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(z.bx, z.by, r * 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(240,240,255,0.9)';
    ctx.beginPath(); ctx.arc(z.bx, z.by, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(z.bx - r * 0.3, z.by - r * 0.3, r * 0.35, 0, Math.PI * 2); ctx.fill();
  } else {
    // Orange — active, deals damage
    const glow = ctx.createRadialGradient(z.bx, z.by, 0, z.bx, z.by, r * 2);
    glow.addColorStop(0, 'rgba(255,220,0,0.4)');
    glow.addColorStop(1, 'rgba(255,180,0,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(z.bx, z.by, r * 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,210,0,0.95)';
    ctx.beginPath(); ctx.arc(z.bx, z.by, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,150,0.8)';
    ctx.beginPath(); ctx.arc(z.bx - r * 0.3, z.by - r * 0.3, r * 0.35, 0, Math.PI * 2); ctx.fill();
  }
}

// Orig. lines ~7018-7046 (z.type==='line_360' branch)
export function drawLine360Zone(ctx, z) {
  const len = Math.sqrt(ARENA_W * ARENA_W + ARENA_H * ARENA_H);
  const cos = Math.cos(z.angle), sin = Math.sin(z.angle);
  // Ray from origin outward in the angle direction
  const x1 = z.cx, y1 = z.cy;
  const x2 = z.cx + cos * len, y2 = z.cy + sin * len;
  ctx.save();
  ctx.beginPath(); ctx.rect(AM, AM, ARENA_W - AM * 2, ARENA_H - AM * 2); ctx.clip();
  if (z.warn) {
    ctx.strokeStyle = 'rgba(255,0,120,0.55)';
    ctx.lineWidth = z.thickness || 8;
    ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]);
    // Origin dot
    ctx.fillStyle = 'rgba(255,0,120,0.8)';
    ctx.beginPath(); ctx.arc(x1, y1, 5, 0, Math.PI * 2); ctx.fill();
  } else if (z.active) {
    ctx.strokeStyle = 'rgba(255,0,120,0.25)'; ctx.lineWidth = (z.thickness || 8) + 10;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,0,150,0.95)'; ctx.lineWidth = z.thickness || 8;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,180,220,0.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  ctx.restore();
}

// Orig. lines ~7048-7083 (z.type==='circle_expand' branch)
export function drawCircleExpandZone(ctx, z, t) {
  if (z.passThru) {
    // white ring — safe to walk through
    const alpha = 0.5 + 0.3 * Math.sin(t * 0.3);
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`; ctx.lineWidth = (z.thickness || 12);
    ctx.beginPath(); ctx.arc(z.cx, z.cy, z.r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = `rgba(200,220,255,0.3)`; ctx.lineWidth = (z.thickness || 12) + 8;
    ctx.beginPath(); ctx.arc(z.cx, z.cy, z.r, 0, Math.PI * 2); ctx.stroke();
    return;
  } else if (z.warn) {
    // pulsing center dot warning
    const pulse = 0.15 + 0.2 * Math.abs(Math.sin(t * 0.45));
    ctx.fillStyle = `rgba(255,30,0,${pulse})`;
    ctx.beginPath(); ctx.arc(z.cx, z.cy, z.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,80,0,0.8)'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.arc(z.cx, z.cy, z.r + 4, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  } else if (z.active) {
    const thick = z.thickness || 20;
    // outer glow
    ctx.strokeStyle = 'rgba(255,60,0,0.25)'; ctx.lineWidth = thick + 12;
    ctx.beginPath(); ctx.arc(z.cx, z.cy, z.r, 0, Math.PI * 2); ctx.stroke();
    // main ring
    ctx.strokeStyle = 'rgba(255,40,0,0.92)'; ctx.lineWidth = thick;
    ctx.beginPath(); ctx.arc(z.cx, z.cy, z.r, 0, Math.PI * 2); ctx.stroke();
    // bright inner edge
    ctx.strokeStyle = 'rgba(255,180,80,0.7)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(z.cx, z.cy, z.r - thick / 2, 0, Math.PI * 2); ctx.stroke();
    // sparks on ring edge
    if (t % 3 === 0) {
      const ang = Math.random() * Math.PI * 2;
      spawnParticles(z.cx + Math.cos(ang) * z.r, z.cy + Math.sin(ang) * z.r, '#ff8844', 2, 2, 14);
    }
  }
}
