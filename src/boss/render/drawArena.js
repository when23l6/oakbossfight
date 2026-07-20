// Orchestrator for the arena canvas, extracted from the original
// drawArena() (iron_fist_battle_v8 (2).html, orig. lines 6851-8504).
// Replicates the original function's structure and draw ORDER exactly —
// z-ordering depends on it — but delegates each block's body to the
// already-extracted render functions instead of inlining the drawing code.
//
// The only inline code kept here is the top-level bg fill (orig. 6851-6854)
// and the "legacy atmosphere" block (orig. 6858-6930), which has no
// corresponding extracted function anywhere else in boss/render/.
//
// Every delegated function below keeps its own `if(S.xPhase)` gate inside
// itself (confirmed by reading each render file) — so all calls here are
// unconditional; the gating happens inside the callee.
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { aCtx } from '../../core/canvasRefs.js';

import { drawZones } from './zoneEngine.js';
import { drawParticleLayer, drawArenaBorder, drawPlayerHeart } from './playerRender.js';
import { drawPlatforms, drawSplit, drawDropper, drawWalls } from './group3Draw.js';
import { drawCorridor } from './corridorDraw.js';
import { drawQuad } from './quadDraw.js';
import { drawRifleGrenade } from './rifleGrenadeDraw.js';
import { drawRicochet, drawRapidfire, drawCorMultiRic, drawCorSpinRapid, drawHealOrbs } from './group1Draw.js';
import { drawCorMRS, drawCor10, drawMeditate } from './group2Draw.js';
import { drawPossession, drawCompulsion, drawBlindchase } from './possessionCompulsionBlindchaseDraw.js';

// Orig. lines 6851-8504
export function drawArena(){
  const ctx=aCtx;
  const t=S.tick;
  ctx.fillStyle='#000';ctx.fillRect(0,0,ARENA_W,ARENA_H);

  // ── Per-attack background atmosphere ── (orig. 6858-6930)
  // Legacy code with no corresponding extracted function — kept inline
  // verbatim, gated on S.turn==='boss' && S.attack==='swipe'|'stomp'|
  // 'circle'|'memory_line'|'blocks'|'slash'|'barrage'|'rifle'.
  if(S.turn==='boss'){
    if(S.attack==='swipe'){
      // Red vignette pulses when zones are active
      const hasActive=S.zones&&S.zones.some(z=>z.active);
      const intensity=hasActive?(0.10+0.07*Math.sin(t*0.45)):0.03;
      const haze=ctx.createRadialGradient(ARENA_W/2,ARENA_H/2,8,ARENA_W/2,ARENA_H/2,ARENA_W*0.75);
      haze.addColorStop(0,'rgba(200,0,0,0)');
      haze.addColorStop(1,`rgba(180,0,0,${intensity})`);
      ctx.fillStyle=haze; ctx.fillRect(0,0,ARENA_W,ARENA_H);
      // screen-edge red flash on zone activation
      if(hasActive){
        ctx.fillStyle=`rgba(255,0,0,${0.07+0.05*Math.sin(t*0.6)})`;
        ctx.fillRect(AM,AM,ARENA_W-AM*2,3);
        ctx.fillRect(AM,ARENA_H-AM-3,ARENA_W-AM*2,3);
        ctx.fillRect(AM,AM,3,ARENA_H-AM*2);
        ctx.fillRect(ARENA_W-AM-3,AM,3,ARENA_H-AM*2);
      }
    }
    if(S.attack==='stomp'){
      // Pulsing blue ground plane
      const gAmt=0.14+0.10*Math.sin(t*0.22);
      const flG=ctx.createLinearGradient(0,ARENA_H-AM-50,0,ARENA_H);
      flG.addColorStop(0,'rgba(0,30,200,0)');
      flG.addColorStop(1,`rgba(20,70,255,${gAmt})`);
      ctx.fillStyle=flG; ctx.fillRect(AM,ARENA_H-AM-50,ARENA_W-AM*2,50);
      // horizontal scan line sweeping up arena
      const scanY=ARENA_H-AM-((t*1.2)%(ARENA_H-AM*2));
      ctx.fillStyle='rgba(80,160,255,0.06)';
      ctx.fillRect(AM,scanY,ARENA_W-AM*2,3);
    }
    if(S.attack==='circle'){
      // Pulsing red center glow
      const cg=ctx.createRadialGradient(ARENA_W/2,ARENA_H/2,0,ARENA_W/2,ARENA_H/2,40);
      cg.addColorStop(0,`rgba(255,0,0,${0.08+0.06*Math.sin(t*0.3)})`);
      cg.addColorStop(1,'rgba(255,0,0,0)');
      ctx.fillStyle=cg;ctx.fillRect(0,0,ARENA_W,ARENA_H);
    }
    if(S.attack==='memory_line'){
      const pulse=0.04+0.03*Math.sin(t*0.3);
      ctx.fillStyle=`rgba(255,180,0,${pulse})`;
      ctx.fillRect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2);
    }
    if(S.attack==='blocks'){
      const pulse=0.05+0.03*Math.sin(t*0.25);
      ctx.fillStyle=`rgba(255,60,0,${pulse})`;
      ctx.fillRect(AM,AM,3,ARENA_H-AM*2);ctx.fillRect(ARENA_W-AM-3,AM,3,ARENA_H-AM*2);
      ctx.fillRect(AM,AM,ARENA_W-AM*2,3);ctx.fillRect(AM,ARENA_H-AM-3,ARENA_W-AM*2,3);
    }
    if(S.attack==='slash'){
      // Purple-white edge crackle for slash
      const crk=0.07+0.05*Math.sin(t*0.6);
      ctx.fillStyle=`rgba(180,80,255,${crk})`;
      ctx.fillRect(AM,AM,ARENA_W-AM*2,3);
      ctx.fillRect(AM,ARENA_H-AM-3,ARENA_W-AM*2,3);
    }
    if(S.attack==='barrage'){
      // Orange corner burns
      const burn=0.08+0.05*Math.sin(t*0.4);
      [[AM,AM],[ARENA_W-AM-30,AM],[AM,ARENA_H-AM-30],[ARENA_W-AM-30,ARENA_H-AM-30]].forEach(([cx,cy])=>{
        const cg=ctx.createRadialGradient(cx+15,cy+15,0,cx+15,cy+15,35);
        cg.addColorStop(0,`rgba(255,80,0,${burn})`);
        cg.addColorStop(1,'rgba(255,80,0,0)');
        ctx.fillStyle=cg; ctx.fillRect(cx,cy,30,30);
      });
    }
    if(S.attack==='rifle'){
      // Dark red top vignette — gun barrel direction
      const rdark=ctx.createLinearGradient(0,AM,0,AM+60);
      rdark.addColorStop(0,`rgba(180,0,0,${0.18+0.08*Math.sin(t*0.3)})`);
      rdark.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=rdark; ctx.fillRect(AM,AM,ARENA_W-AM*2,60);
    }
  }

  // ── Hitbox zones ── (orig. 6932-7215)
  drawZones(ctx, t);

  // ── Particles / arena border ── (orig. 7217-7234)
  drawParticleLayer(ctx);
  drawArenaBorder(ctx);

  // ── Platforms / split / dropper / walls / corridor ── (orig. 7237-7510)
  drawPlatforms();
  drawSplit();
  drawDropper();
  drawWalls();
  drawCorridor();

  // ── Player heart ── (orig. 7511-7542)
  drawPlayerHeart(ctx);

  // ── Quad survival overlay ── (orig. 7544-7686)
  drawQuad(ctx);

  // ── Rifle / corRifleGrenade "ATTACK" button / grenade ── (orig. 7688-7799,
  // 7902-7918, 8089-8161 — combined into one function; called once here at
  // the position of the first block)
  drawRifleGrenade(ctx, t);

  // ── Ricochet ── (orig. 7801-7834)
  drawRicochet();

  // ── Heal VFX + heal orbs ── (orig. 7836-7869)
  drawHealOrbs();

  // ── Spin rapid ── (orig. 7871-7900)
  drawCorSpinRapid();

  // ── Corridor multi-ricochet balls ── (orig. 7920-7944)
  drawCorMultiRic();

  // ── corMRS ── (orig. 7947-7994)
  drawCorMRS();

  // ── Attack 10 (spin stage) ── (orig. 7996-8045)
  drawCor10();

  // ── Rapid fire ── (orig. 8047-8087)
  drawRapidfire();

  // ── Possession ── (orig. 8163-8252)
  drawPossession();

  // ── Compulsion ── (orig. 8254-8389)
  drawCompulsion();

  // ── Blindchase ── (orig. 8391-8444)
  drawBlindchase();

  // ── Meditate visuals + press flash ── (orig. 8446-8503)
  drawMeditate();
}
