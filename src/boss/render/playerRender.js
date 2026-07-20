// Player-related rendering pieces shared across nearly every attack.
// Extracted verbatim from the original drawArena() (iron_fist_battle_v8 (2).html):
//   - drawParticleLayer: orig. lines ~7217-7226 (particle update + draw)
//   - drawArenaBorder:   orig. lines ~7227-7234 (special-cased for cor10 "spin" stage)
//   - drawPlayerHeart:   orig. lines ~7511-7542 (heart + hit-flash, incl. split-phase
//                        second heart; long OR-condition references nearly every
//                        attack flag — kept generic on purpose, do not attribute to
//                        one attack)
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { updateParticles, spawnParticles } from '../../core/particles.js';
import { COR10_AM } from '../attacks/cor10.js';

// Orig. lines ~7217-7226
export function drawParticleLayer(ctx) {
  updateParticles();
  for (const p of S.particles) {
    const alpha = (p.life / p.maxLife) * 0.9;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.col;
    ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
  }
  ctx.globalAlpha = 1;
}

// Orig. lines ~7227-7234
export function drawArenaBorder(ctx) {
  if (S.cor10Phase && S.cor10Stage === 'spin') {
    ctx.strokeStyle = 'rgba(100,200,255,0.9)';
    ctx.lineWidth = 3; ctx.strokeRect(COR10_AM, COR10_AM, ARENA_W - COR10_AM * 2, ARENA_H - COR10_AM * 2);
  } else {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3; ctx.strokeRect(AM, AM, ARENA_W - AM * 2, ARENA_H - AM * 2);
  }
}

// Orig. lines ~7511-7542
// Gate condition (kept verbatim — reads nearly every attack-phase flag on S):
//   S.turn==='boss' || S.quadPhase || S.dropperPhase || S.wallsPhase || S.riflePhase ||
//   S.ricochetPhase || S.rapidfirePhase || S.grenadePhase || S.possessionPhase ||
//   S.compulsionPhase || S.blindchasePhase || S.corridorPhase || S.corMultiRicPhase ||
//   S.corBlocksPhase || S.corRGPhase || S.corSpinRapidPhase || S.corSSPhase ||
//   S.corQuadPhase || S.healOrbsPhase || S.corMRSPhase || S.cor10Phase
export function drawPlayerHeart(ctx) {
  if (S.turn === 'boss' || S.quadPhase || S.dropperPhase || S.wallsPhase || S.riflePhase || S.ricochetPhase || S.rapidfirePhase || S.grenadePhase || S.possessionPhase || S.compulsionPhase || S.blindchasePhase || S.corridorPhase || S.corMultiRicPhase || S.corBlocksPhase || S.corRGPhase || S.corSpinRapidPhase || S.corSSPhase || S.corQuadPhase || S.healOrbsPhase || S.corMRSPhase || S.cor10Phase) {
    if (S.pHitFlash <= 0 || S.tick % 6 < 3) {
      const px = S.px, py = S.py;
      const hcol = (S.gravity || S.splitPhase || S.quadPhase || S.corQuadPhase || S.dropperPhase) ? '#4488ff' : (S.possessionInverted || S.possessionFlash > 0 || S._bcInverted) ? '#aa44ff' : '#ff0044';
      // Soft glow under heart
      const hg = ctx.createRadialGradient(px, py, 0, px, py, 18);
      hg.addColorStop(0, S.quadPhase || S.corQuadPhase || S.dropperPhase ? 'rgba(60,120,255,0.35)' : (S.gravity ? 'rgba(60,120,255,0.35)' : (S.possessionInverted || S.possessionFlash > 0) ? 'rgba(160,60,255,0.35)' : 'rgba(255,0,60,0.35)'));
      hg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = hg; ctx.fillRect(px - 18, py - 18, 36, 36);
      ctx.fillStyle = hcol;
      ctx.fillRect(px - 6, py - 4, 5, 5); ctx.fillRect(px + 1, py - 4, 5, 5);
      ctx.fillRect(px - 8, py - 8, 6, 5); ctx.fillRect(px + 2, py - 8, 6, 5);
      ctx.fillRect(px - 9, py - 4, 4, 7); ctx.fillRect(px + 5, py - 4, 4, 7);
      ctx.fillRect(px - 7, py + 3, 5, 4); ctx.fillRect(px + 2, py + 3, 5, 4);
      ctx.fillRect(px - 5, py + 7, 10, 4); ctx.fillRect(px - 3, py + 11, 6, 3);
    }
    // hit flash burst particles
    // Second heart (split phase right side)
    if (S.splitPhase && (S.p2HitFlash <= 0 || S.tick % 6 < 3)) {
      ctx.fillStyle = '#4488ff';
      const p2x = S.px2, p2y = S.py2;
      ctx.fillRect(p2x - 6, p2y - 4, 5, 5); ctx.fillRect(p2x + 1, p2y - 4, 5, 5);
      ctx.fillRect(p2x - 8, p2y - 8, 6, 5); ctx.fillRect(p2x + 2, p2y - 8, 6, 5);
      ctx.fillRect(p2x - 9, p2y - 4, 4, 7); ctx.fillRect(p2x + 5, p2y - 4, 4, 7);
      ctx.fillRect(p2x - 7, p2y + 3, 5, 4); ctx.fillRect(p2x + 2, p2y + 3, 5, 4);
      ctx.fillRect(p2x - 5, p2y + 7, 10, 4); ctx.fillRect(p2x - 3, p2y + 11, 6, 3);
    }
    if (S.pHitFlash === 29) {
      spawnParticles(S.px, S.py, (S.gravity || S.quadPhase) ? '#4488ff' : '#ff0044', 10, 3, 16);
    }
    if (S.pHitFlash > 0) S.pHitFlash--;
  }
}
