// Quad survival overlay (4 vertical columns), extracted verbatim from the
// original drawArena() (iron_fist_battle_v8 (2).html, orig. lines ~7544-7686).
// Single block serving both the quadPhase and corQuad (corQuadPhase) attacks —
// combined in the original because both attacks share the exact same visual.
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';

// Orig. lines ~7544-7686
// Gate condition (kept verbatim): S.quadPhase || S.corQuadPhase
// (no `t` param needed — this block reads S.tick directly, not the local t)
export function drawQuad(ctx) {
  if (S.quadPhase || S.corQuadPhase) {
    const IW = ARENA_W - AM * 2, IH = ARENA_H - AM * 2;
    const cw = IW / 4;
    const SLAB_H = IH;

    // Column dividers
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    for (let i = 1; i < 4; i++) {
      const lx = AM + i * cw;
      ctx.beginPath(); ctx.moveTo(lx, AM); ctx.lineTo(lx, ARENA_H - AM); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();

    // Safe column green highlight
    {
      const colX = AM + S.quadSafe * cw;
      const pulse = 0.35 + 0.25 * Math.sin(S.tick * 0.22);
      ctx.fillStyle = 'rgba(0,180,50,0.35)';
      ctx.fillRect(colX, AM, cw, IH);
      ctx.strokeStyle = `rgba(0,255,80,${pulse})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(colX + 1, AM + 1, cw - 2, IH - 2);
    }

    // Ghost preview of NEXT round danger columns (tiny peek at top)
    if (S.quadNextSafe !== undefined) {
      const GHOST_H = 10;
      for (let c = 0; c < 4; c++) {
        if (c === S.quadNextSafe) continue;
        const gx = AM + c * cw;
        ctx.fillStyle = 'rgba(255,60,0,0.20)';
        ctx.fillRect(gx, AM, cw, GHOST_H);
        ctx.fillStyle = 'rgba(255,90,0,0.55)';
        ctx.fillRect(gx, AM + GHOST_H - 2, cw, 2);
      }
    }

    // Falling slabs — clipped to arena interior
    ctx.save();
    ctx.beginPath(); ctx.rect(AM, AM, IW, IH); ctx.clip();

    for (const sl of S.quadSlabs) {
      const colX = AM + sl.col * cw;
      const slabTop = sl.y;
      const slabBot = slabTop + SLAB_H;
      if (slabBot <= AM) continue;
      const visTop = Math.max(AM, slabTop);
      const visH = Math.min(slabBot, ARENA_H - AM) - visTop;
      if (visH <= 0) continue;

      if (sl.active) {
        const flicker = 0.72 + 0.14 * Math.sin(S.tick * 0.8);
        ctx.fillStyle = `rgba(210,15,0,${flicker})`;
        ctx.fillRect(colX, visTop, cw, visH);
        // Horizontal brick lines fixed to slab position
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        const brickH = 10;
        const firstLine = Math.ceil((visTop - slabTop) / brickH) * brickH;
        for (let by = firstLine; by < SLAB_H; by += brickH) {
          const lineY = slabTop + by;
          if (lineY < AM || lineY >= ARENA_H - AM) continue;
          ctx.fillRect(colX, lineY, cw, 1.5);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(colX + Math.floor(cw / 2) - 1, visTop, 2, visH);
        // Leading bottom edge glow
        const botY = Math.min(slabBot, ARENA_H - AM);
        if (botY > AM) {
          ctx.fillStyle = 'rgba(255,110,0,0.9)';
          ctx.fillRect(colX, botY - 3, cw, 3);
        }
      } else {
        // Warning: semi-transparent with downward speed-lines
        const warn = 0.36 + 0.10 * Math.sin(S.tick * 0.35);
        ctx.fillStyle = `rgba(175,25,0,${warn})`;
        ctx.fillRect(colX, visTop, cw, visH);
        ctx.save();
        ctx.beginPath(); ctx.rect(colX, visTop, cw, visH); ctx.clip();
        ctx.strokeStyle = 'rgba(255,80,0,0.22)';
        ctx.lineWidth = 3;
        const strOff = (S.tick * 3) % 20;
        for (let s = -IH; s < cw + IH; s += 20) {
          ctx.beginPath();
          ctx.moveTo(colX + s + strOff, visTop);
          ctx.lineTo(colX + s + strOff - IH * 0.4, visTop + visH);
          ctx.stroke();
        }
        ctx.restore();
        const botY2 = Math.min(slabBot, ARENA_H - AM);
        if (botY2 > AM) {
          ctx.fillStyle = 'rgba(255,130,0,0.7)';
          ctx.fillRect(colX, botY2 - 3, cw, 3);
        }
      }
    }
    ctx.restore();

    // Previous safe column yellow ghost
    if (S.quadPrev >= 0 && S.quadShowPrevTimer > 0) {
      const a = (S.quadShowPrevTimer / 18) * 0.28;
      const px2 = AM + S.quadPrev * cw;
      ctx.fillStyle = `rgba(255,255,80,${a})`;
      ctx.fillRect(px2, AM, cw, IH);
      ctx.strokeStyle = `rgba(255,255,80,${a * 2})`;
      ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
      ctx.strokeRect(px2 + 1, AM + 1, cw - 2, IH - 2);
      ctx.setLineDash([]);
    }

    // Timer bar
    {
      const ROUND_DUR = Math.max(36, 45 - Math.floor(S.quadRound / 5) * 9);
      const prog = Math.min(1, S.quadTimer / ROUND_DUR);
      const barY = ARENA_H - AM - 4;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(AM, barY, IW, 4);
      const rc = Math.floor(100 + 155 * prog), gc = Math.floor(200 * (1 - prog));
      ctx.fillStyle = `rgb(${rc},${gc},0)`;
      ctx.fillRect(AM, barY, IW * (1 - prog), 4);
    }

    // Round counter
    {
      const remaining = 30 - S.quadRound;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      const tier = Math.floor(S.quadRound / 5);
      const tierStr = ['', '  FAST', '  FASTER', '  DANGER', '  MAX', '  !!!'][tier] || '';
      ctx.fillText(`${remaining} left${tierStr}`, ARENA_W / 2, AM + 8);
      ctx.textAlign = 'start';
    }

    // Blackout flash (rounds 21-30: whole arena goes black between rounds)
    if (S.quadBlackout) {
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fillRect(0, 0, ARENA_W, ARENA_H);
    }
  }
}
