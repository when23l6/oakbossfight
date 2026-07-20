// Shared zone/hazard rendering loop, extracted verbatim from the original
// drawArena() (iron_fist_battle_v8 (2).html, orig. lines ~6932-7215).
// Generic renderer for S.zones — used directly by many attacks, including
// corBlocks and corStompSwipe which have no dedicated draw block of their
// own and rely entirely on this loop reading their zone data.
//
// Shape-specific branches (spinner/zigzag/line_360/circle_expand) live in
// zoneEngineHelpers.js so both files stay under the 300-line limit; the
// rect warn/active rendering (used by swipe/barrage/wave_lr/blocks/etc.)
// stays inline here since it's the generic fallback path.
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { spawnParticles, spawnEdgeParticles } from '../../core/particles.js';
import { drawSpinnerZone, drawZigzagBall, drawLine360Zone, drawCircleExpandZone } from './zoneEngineHelpers.js';

// Orig. lines ~6932-7215
export function drawZones(ctx, t) {
  // Single grace threshold line for zigzag balls (drawn once, fixed Y)
  if (S.attack === 'spinner' && S.zones && S.zones.some(z => z.type === 'zigzag' && !z.done)) {
    // Grace line: average y-position where balls cross into damage (rel=60)
    const balls = S.zones.filter(z => z.type === 'zigzag' && !z.done);
    const avgBvy = balls.reduce((s, z) => s + (z.bvy || 1), 0) / Math.max(1, balls.length);
    const GRACE_Y = Math.min(ARENA_H - AM - 10, AM + avgBvy * 60);
    const flashA = 0.55 + 0.25 * Math.sin(t * 0.4);
    ctx.strokeStyle = `rgba(255,255,255,${flashA})`;
    ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(AM, GRACE_Y); ctx.lineTo(ARENA_W - AM, GRACE_Y); ctx.stroke();
    ctx.setLineDash([]);
  }

  if (S.zones) {
    for (const z of S.zones) {
      if (z.done || (!z.warn && !z.active && !z.passThru && !z.visible)) continue;
      const isBlue = z.color === '#2255ff';
      const isSlash = z.color === '#cc44ff' || z.color === '#ff44cc';
      const isMemory = z.color === '#ffaa00' || z.color === '#ffcc00';
      const isBlock = z.color === '#ff4400';
      const rc = isBlue ? '40,100,255' : isSlash ? '200,60,255' : isMemory ? '255,180,0' : isBlock ? '255,60,0' : '255,60,0';
      const brightCol = isBlue ? 'rgba(160,210,255,1)' : isSlash ? 'rgba(230,160,255,1)' : isMemory ? 'rgba(255,220,80,1)' : 'rgba(255,160,80,1)';
      const coreCol = isBlue ? 'rgba(20,80,255,0.92)' : isSlash ? 'rgba(170,20,255,0.92)' : isMemory ? 'rgba(255,160,0,0.92)' : 'rgba(255,50,0,0.92)';
      const glowCol = isBlue ? 'rgba(80,150,255,0.5)' : isSlash ? 'rgba(200,80,255,0.5)' : isMemory ? 'rgba(255,200,0,0.5)' : 'rgba(255,100,20,0.5)';

      // Spinner — rotating arm from center
      if (z.type === 'spinner') {
        drawSpinnerZone(ctx, z, t);
        continue;
      }

      // Zigzag ball
      if (z.type === 'zigzag') {
        drawZigzagBall(ctx, z);
        continue;
      }

      // Line 360 — drawn as a rotated beam through the center
      if (z.type === 'line_360') {
        drawLine360Zone(ctx, z);
        continue;
      }

      // Circle expand — drawn separately with arc
      if (z.type === 'circle_expand') {
        drawCircleExpandZone(ctx, z, t);
        continue; // skip normal rect rendering
      }

      if (z.warn) {
        // Memory line: ghost/preview — show outline with low fill so player memorizes position
        if (isMemory) {
          // Solid yellow ghost — visible for full warn duration, then snaps active
          const rel = t - z.startTick;
          const fading = rel > z.warnDur - 15; // last 15 frames: fade out
          const alpha = fading ? 0.18 * (1 - (rel - z.warnDur + 15) / 15) : 0.18;
          ctx.fillStyle = `rgba(255,200,0,${alpha})`;
          ctx.fillRect(z.x, z.y, z.w, z.h);
          ctx.strokeStyle = `rgba(255,220,60,${fading ? 0.3 : 0.7})`;
          ctx.lineWidth = 2; ctx.setLineDash([]);
          ctx.strokeRect(z.x, z.y, z.w, z.h);
          ctx.fillStyle = `rgba(255,200,0,0.06)`;
          for (let sy = z.y + 2; sy < z.y + z.h; sy += 5) ctx.fillRect(z.x, sy, z.w, 2);
          continue;
        }
        // ── WARNING phase ──
        // Rapid flicker: alternates between two shades fast near end of warn
        const rel = t - z.startTick;
        const warnPct = rel / z.warnDur;
        const flickerSpeed = warnPct > 0.6 ? 0.9 : 0.35; // faster near activation
        const pulse = 0.12 + 0.22 * Math.abs(Math.sin(t * flickerSpeed));

        // Base tinted fill
        ctx.fillStyle = `rgba(${rc},${pulse * 0.6})`;
        ctx.fillRect(z.x, z.y, z.w, z.h);

        // Moving diagonal stripes
        ctx.save();
        ctx.beginPath(); ctx.rect(z.x, z.y, z.w, z.h); ctx.clip();
        ctx.strokeStyle = `rgba(${rc},${pulse * 0.35})`;
        ctx.lineWidth = 6;
        const stripeOff = (t * 1.5) % 20;
        for (let s = -z.h; s < z.w + z.h; s += 20) {
          ctx.beginPath();
          ctx.moveTo(z.x + s + stripeOff, z.y);
          ctx.lineTo(z.x + s + stripeOff - z.h, z.y + z.h);
          ctx.stroke();
        }
        ctx.restore();

        // Dashed border — gets brighter as warn ends
        ctx.strokeStyle = isBlue ? `rgba(120,180,255,${0.5 + 0.5 * warnPct})` : `rgba(255,120,50,${0.5 + 0.5 * warnPct})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(z.x, z.y, z.w, z.h);
        ctx.setLineDash([]);

        // Corner tick marks
        const tk = 6;
        ctx.strokeStyle = brightCol; ctx.lineWidth = 2; ctx.setLineDash([]);
        [[z.x, z.y], [z.x + z.w, z.y], [z.x, z.y + z.h], [z.x + z.w, z.y + z.h]].forEach(([cx, cy], i) => {
          const sx = i % 2 === 0 ? 1 : -1, sy = i < 2 ? 1 : -1;
          ctx.beginPath(); ctx.moveTo(cx + sx * tk, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + sy * tk); ctx.stroke();
        });

        // Warn particle drip from edges
        if (t % 5 === 0) spawnEdgeParticles(z.x, z.y, z.w, z.h, isBlue ? '#6699ff' : isSlash ? '#cc66ff' : '#ff7733', 1);

      } else if (z.active) {
        // ── ACTIVE phase ──
        const rel = t - z.startTick - z.warnDur;
        const actPct = Math.min(1, rel / z.activeDur);

        if (z.type === 'wave_lr') {
          // Shockwave bar: bright leading edge fading to trail
          // Core
          ctx.fillStyle = coreCol;
          ctx.fillRect(z.x, z.y, z.w, z.h);

          // Leading edge white flash
          const edgeW = Math.min(14, z.w);
          const ledge = ctx.createLinearGradient(z.x, 0, z.x + edgeW, 0);
          ledge.addColorStop(0, 'rgba(255,255,255,0.95)');
          ledge.addColorStop(0.4, isBlue ? 'rgba(160,220,255,0.7)' : 'rgba(255,180,80,0.7)');
          ledge.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = ledge; ctx.fillRect(z.x, z.y, edgeW, z.h);

          // Wide soft glow ahead of bar
          const preGlow = ctx.createLinearGradient(z.x - 25, 0, z.x, 0);
          preGlow.addColorStop(0, 'rgba(0,0,0,0)');
          preGlow.addColorStop(1, isBlue ? 'rgba(80,150,255,0.35)' : 'rgba(255,120,0,0.35)');
          ctx.fillStyle = preGlow; ctx.fillRect(Math.max(AM, z.x - 25), z.y, 25, z.h);

          // Trail glow behind
          const trail = ctx.createLinearGradient(z.x + z.w, 0, z.x + z.w + 40, 0);
          trail.addColorStop(0, isBlue ? 'rgba(40,100,255,0.5)' : 'rgba(255,80,0,0.5)');
          trail.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = trail; ctx.fillRect(z.x + z.w, z.y, Math.min(40, ARENA_W - AM - z.x - z.w), z.h);

          // Sparks shooting off leading edge
          if (t % 2 === 0) spawnParticles(z.x + 2, z.y + z.h * 0.25, '#ccddff', 1, 3, 14);
          if (t % 2 === 1) spawnParticles(z.x + 2, z.y + z.h * 0.75, '#aabbff', 1, 3, 14);

          // Bright outline
          ctx.strokeStyle = 'rgba(200,230,255,0.9)'; ctx.lineWidth = 1.5;
          ctx.strokeRect(z.x, z.y, z.w, z.h);

        } else {
          // Swipe / barrage static zones
          // Core fill
          ctx.fillStyle = coreCol;
          ctx.fillRect(z.x, z.y, z.w, z.h);

          // Animated scanlines scrolling across
          ctx.save();
          ctx.beginPath(); ctx.rect(z.x, z.y, z.w, z.h); ctx.clip();
          const scanOff = (t * 2) % 8;
          ctx.fillStyle = `rgba(255,255,255,0.07)`;
          for (let sy = z.y - scanOff; sy < z.y + z.h + 8; sy += 8) ctx.fillRect(z.x, sy, z.w, 4);
          ctx.restore();

          // Top highlight bright line
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.fillRect(z.x + 1, z.y + 1, z.w - 2, 2);
          // Bottom edge shadow
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(z.x + 1, z.y + z.h - 3, z.w - 2, 2);

          // Outer glow (double stroke trick)
          ctx.strokeStyle = glowCol; ctx.lineWidth = 5;
          ctx.strokeRect(z.x, z.y, z.w, z.h);
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5;
          ctx.strokeRect(z.x, z.y, z.w, z.h);

          // Edge particle spray
          if (t % 3 === 0) spawnEdgeParticles(z.x, z.y, z.w, z.h, isBlue ? '#88aaff' : isSlash ? '#dd88ff' : '#ff9944', 2);
        }
      }
    }
  }
}
