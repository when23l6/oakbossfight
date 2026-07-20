// Rifle + corRifleGrenade + grenade rendering, extracted verbatim from the
// original drawArena() (iron_fist_battle_v8 (2).html). Three pieces kept
// together in one function because their gate conditions are combined /
// interdependent in the original and were not meant to be split per-attack:
//   - rifle main draw:      orig. lines ~7688-7799
//     gate: S.riflePhase || (S.corRGPhase && S.rifleWalls && S.rifleWalls.some(w=>w.alive||w.shatterTimer>0))
//   - "ATTACK" button prompt: orig. lines ~7902-7918
//     gate: S.corRGPhase && S.corRGButtonActive && (S.corRGStage==='rifle'||S.corRGStage==='finish')
//   - grenade draw:          orig. lines ~8089-8161
//     gate: (S.grenadePhase || S.corRGPhase) && S.grenades
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { spawnParticles } from '../../core/particles.js';
import { _rifleAimOrigin } from '../attacks/rifle.js';
import { GRN_ARC_DUR, GRN_BLAST_DUR, GRN_BLAST_R } from '../attacks/grenade.js';

// Orig. lines ~7688-8161 (three combined pieces, in original relative order)
export function drawRifleGrenade(ctx, t) {
  // ── Rifle attack drawing ── (orig. ~7688-7799)
  if (S.riflePhase || (S.corRGPhase && S.rifleWalls && S.rifleWalls.some(w => w.alive || w.shatterTimer > 0))) {
    const ik = ARENA_W - AM * 2, ih = ARENA_H - AM * 2;
    ctx.save();
    ctx.beginPath(); ctx.rect(AM, AM, ik, ih); ctx.clip();

    // Draw cover walls
    for (const w of S.rifleWalls) {
      if (w.alive) {
        // Solid steel wall
        ctx.fillStyle = '#888';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.fillStyle = '#bbb';
        ctx.fillRect(w.x, w.y, w.w, 2); // top highlight
        ctx.fillStyle = '#555';
        ctx.fillRect(w.x, w.y + w.h - 2, w.w, 2); // bottom shadow
        ctx.strokeStyle = 'rgba(200,200,200,0.6)';
        ctx.lineWidth = 1; ctx.strokeRect(w.x, w.y, w.w, w.h);
      } else if (w.shatterTimer > 0) {
        // Shatter debris — flying chunks
        const prog = 1 - (w.shatterTimer / 40);
        ctx.globalAlpha = Math.max(0, 1 - prog * 1.5);
        const cx2 = w.x + w.w / 2, cy2 = w.y + w.h / 2;
        ctx.fillStyle = '#888';
        for (let ci = 0; ci < 6; ci++) {
          const ang = (ci / 6) * Math.PI * 2 + prog * 3;
          const dist = prog * 22;
          const chunkW = 10 + Math.sin(ci * 1.3) * 5, chunkH = 6;
          ctx.fillRect(cx2 + Math.cos(ang) * dist - chunkW / 2, cy2 + Math.sin(ang) * dist + prog * 15 - chunkH / 2, chunkW, chunkH);
        }
        ctx.globalAlpha = 1;
      }
    }

    // AIM phase — two diagonal red laser sight lines tracking player
    if (S.rifleState === 'aim') {
      const o = _rifleAimOrigin();
      const ang = S.rifleAimAngle;
      // Spread narrows gradually over the full aim duration (visual tension build-up)
      const aimProg = Math.min(1, S.rifleTimer / 90);
      const spread = 0.18 * (1 - aimProg * 0.85); // never fully closes until bullet fires
      const aimLen = Math.sqrt(ARENA_W * ARENA_W + ARENA_H * ARENA_H);

      for (let side = -1; side <= 1; side += 2) {
        const a = ang + spread * side;
        const ex = o.x + Math.cos(a) * aimLen, ey = o.y + Math.sin(a) * aimLen;
        const pulse = 0.55 + 0.25 * Math.sin(t * 0.5);
        ctx.strokeStyle = `rgba(255,0,0,${pulse * 0.3})`;
        ctx.lineWidth = 6; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.strokeStyle = `rgba(255,50,50,${pulse})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(ex, ey); ctx.stroke();
      }
      // Center dot
      ctx.fillStyle = 'rgba(255,80,80,0.9)';
      ctx.beginPath(); ctx.arc(o.x, o.y, 4, 0, Math.PI * 2); ctx.fill();
      // Dotted center line
      const exC = o.x + Math.cos(ang) * aimLen, eyC = o.y + Math.sin(ang) * aimLen;
      ctx.strokeStyle = 'rgba(255,100,100,0.35)';
      ctx.lineWidth = 1; ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(exC, eyC); ctx.stroke();
      ctx.setLineDash([]);

      // Shot counter
      ctx.fillStyle = 'rgba(255,100,100,0.8)';
      ctx.font = 'bold 9px monospace'; ctx.textAlign = 'left';
      ctx.fillText(`SHOT ${S.rifleShot + 1}/3`, AM + 4, AM + 10);
      ctx.textAlign = 'start';
    }

    // FIRE phase — live bullet head travels along frozen angle
    if (S.rifleState === 'fire' && S.rifleBullet) {
      const b = S.rifleBullet;
      const o = _rifleAimOrigin();

      // Streak trail from origin to bullet head
      if (b.dist > 2) {
        const grad = ctx.createLinearGradient(o.x, o.y, b.bx, b.by);
        grad.addColorStop(0, 'rgba(255,200,80,0)');
        grad.addColorStop(0.6, 'rgba(255,120,0,0.5)');
        grad.addColorStop(1, 'rgba(255,255,200,1)');
        ctx.strokeStyle = grad; ctx.lineWidth = 8; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(b.bx, b.by); ctx.stroke();
        // White core
        ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(b.bx, b.by); ctx.stroke();
      }

      // Bullet head spark (always visible even if tiny trail)
      if (!b.done) {
        ctx.fillStyle = 'rgba(255,255,180,1)';
        ctx.beginPath(); ctx.arc(b.bx, b.by, 5, 0, Math.PI * 2); ctx.fill();
        // Small leading glow
        ctx.fillStyle = 'rgba(255,180,0,0.5)';
        ctx.beginPath(); ctx.arc(b.bx, b.by, 10, 0, Math.PI * 2); ctx.fill();
        if (t % 2 === 0) spawnParticles(b.bx, b.by, '#ffcc44', 2, 3, 8);
      }

      // Impact flash when done
      if (b.done) {
        const stopX = b.ox + b.cos * b.hitDist, stopY = b.oy + b.sin * b.hitDist;
        ctx.fillStyle = 'rgba(255,220,80,0.9)';
        ctx.beginPath(); ctx.arc(stopX, stopY, 16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath(); ctx.arc(stopX, stopY, 8, 0, Math.PI * 2); ctx.fill();
        spawnParticles(stopX, stopY, '#ffcc44', 4, 5, 14);
      }
    }

    ctx.restore();
  }

  // ── Corridor Rifle+Grenade attack button ── (orig. ~7902-7918)
  if (S.corRGPhase && S.corRGButtonActive && (S.corRGStage === 'rifle' || S.corRGStage === 'finish')) {
    const bx = ARENA_W / 2 - 22, by = AM + 4, bw = 44, bh = 20;
    const pulse = 0.85 + 0.15 * Math.sin(t * 0.3);
    // White border
    ctx.strokeStyle = `rgba(255,255,255,${pulse})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
    // Yellow text label — same VT323 style as ACT buttons
    ctx.fillStyle = `rgba(255,255,0,${pulse})`;
    ctx.font = 'bold 18px VT323, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ATTACK', bx + bw / 2, by + bh / 2);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }

  // ── Grenade drawing ── (orig. ~8089-8161)
  if ((S.grenadePhase || S.corRGPhase) && S.grenades) {
    ctx.save();
    ctx.beginPath(); ctx.rect(AM, AM, ARENA_W - AM * 2, ARENA_H - AM * 2); ctx.clip();

    for (const g of S.grenades) {
      if (g.state === 'done') continue;

      // During wait: show faint landing markers so player knows where to move
      if (g.state === 'wait') {
        const warnAlpha = 0.15 + 0.1 * Math.sin(t * 0.6);
        ctx.strokeStyle = `rgba(255,80,0,${warnAlpha})`;
        ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.arc(g.lx, g.ly, GRN_BLAST_R, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = `rgba(255,60,0,0.05)`;
        ctx.beginPath(); ctx.arc(g.lx, g.ly, GRN_BLAST_R, 0, Math.PI * 2); ctx.fill();
        continue;
      }

      if (g.state === 'arc') {
        // Parabolic arc: lerp x linearly, y with arc peak
        const prog = g.timer / GRN_ARC_DUR;
        const gx = g.ox + (g.lx - g.ox) * prog;
        // Arc height peaks at midpoint — higher arc = more readable
        const arcH = 60;
        const gy = g.oy + (g.ly - g.oy) * prog - arcH * Math.sin(prog * Math.PI);

        // Grenade dot
        ctx.fillStyle = 'rgba(80,200,80,0.95)';
        ctx.beginPath(); ctx.arc(gx, gy, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(120,255,120,0.5)';
        ctx.beginPath(); ctx.arc(gx, gy, 7, 0, Math.PI * 2); ctx.fill();

        // Dashed shadow circle at landing spot — shows where it will land
        const warnAlpha = 0.35 + 0.2 * Math.sin(t * 0.5);
        ctx.strokeStyle = `rgba(255,80,0,${warnAlpha})`;
        ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.arc(g.lx, g.ly, GRN_BLAST_R, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        // Faint fill
        ctx.fillStyle = `rgba(255,60,0,0.08)`;
        ctx.beginPath(); ctx.arc(g.lx, g.ly, GRN_BLAST_R, 0, Math.PI * 2); ctx.fill();
        // Cross-hair center dot
        ctx.fillStyle = `rgba(255,120,0,${warnAlpha})`;
        ctx.beginPath(); ctx.arc(g.lx, g.ly, 3, 0, Math.PI * 2); ctx.fill();

      } else if (g.state === 'warn') {
        // Grenade landed — blast circle pulses urgently
        const pulse = 0.5 + 0.4 * Math.sin(t * 1.2);
        ctx.strokeStyle = `rgba(255,60,0,${0.6 + pulse * 0.4})`;
        ctx.lineWidth = 3; ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(g.lx, g.ly, GRN_BLAST_R, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = `rgba(255,60,0,${0.1 + pulse * 0.12})`;
        ctx.beginPath(); ctx.arc(g.lx, g.ly, GRN_BLAST_R, 0, Math.PI * 2); ctx.fill();
        // Grenade dot at landing
        ctx.fillStyle = 'rgba(80,200,80,0.9)';
        ctx.beginPath(); ctx.arc(g.lx, g.ly, 4, 0, Math.PI * 2); ctx.fill();
        if (t % 3 === 0) spawnParticles(g.lx, g.ly, '#44ff44', 1, 1, 10);

      } else if (g.state === 'blast') {
        // Explosion — fills blast radius with flash
        const prog = g.timer / GRN_BLAST_DUR;
        const alpha = 1 - prog;
        ctx.fillStyle = `rgba(255,200,50,${alpha * 0.85})`;
        ctx.beginPath(); ctx.arc(g.lx, g.ly, GRN_BLAST_R * (0.6 + prog * 0.4), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.6})`;
        ctx.beginPath(); ctx.arc(g.lx, g.ly, GRN_BLAST_R * 0.4, 0, Math.PI * 2); ctx.fill();
        if (t % 2 === 0) spawnParticles(g.lx, g.ly, '#ffcc44', 4, 5, 14);
      }
    }
    ctx.restore();
  }
}
