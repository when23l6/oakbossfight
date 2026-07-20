import { S } from '../../state/gameState.js';
import { arenaCanvas, aCtx } from '../../core/canvasRefs.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { BC_FLASH_DUR, BC_BULLET_R } from '../attacks/blindchase.js';

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 8392-8444
// (drawArena's "── Blindchase drawing ──" block). The S.blindchasePhase
// gate is kept inside the function — call unconditionally every frame.
// Split out of possessionCompulsionBlindchaseDraw.js (which re-exports
// this) because the combined file exceeded the 300-line limit.
export function drawBlindchase(){
  const ctx=aCtx;
  if(S.blindchasePhase){
    const isFlash=S.blindchaseFlash>0;
    const flashProg=S.blindchaseFlash/BC_FLASH_DUR;
    const BC_INVERT_FLASH_DUR=20;
    const invertProg=S._bcInvertFlash/BC_INVERT_FLASH_DUR;

    // Blue invert flash drawn FIRST (under black layer)
    if(S._bcInvertFlash>0){
      ctx.fillStyle=`rgba(0,80,255,${invertProg*0.55})`;
      ctx.fillRect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2);
    }

    if(!isFlash){
      // Full black — nothing visible
      ctx.fillStyle='#000';
      ctx.fillRect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2);
    } else {
      // Flash: brief reveal
      ctx.fillStyle=`rgba(0,0,0,${0.85*(1-flashProg*0.7)})`;
      ctx.fillRect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2);

      ctx.save();
      ctx.beginPath(); ctx.rect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2); ctx.clip();

      // Draw bullets
      for(const b of S.blindchaseBullets){
        const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,BC_BULLET_R*3);
        g.addColorStop(0,`rgba(255,60,60,${flashProg})`);
        g.addColorStop(1,'rgba(255,0,0,0)');
        ctx.fillStyle=g;
        ctx.beginPath(); ctx.arc(b.x,b.y,BC_BULLET_R*3,0,Math.PI*2); ctx.fill();
        ctx.fillStyle=`rgba(255,200,200,${flashProg})`;
        ctx.beginPath(); ctx.arc(b.x,b.y,BC_BULLET_R,0,Math.PI*2); ctx.fill();
      }

      // Bullet count hint
      ctx.fillStyle=`rgba(255,80,80,${flashProg*0.8})`;
      ctx.font='bold 9px monospace'; ctx.textAlign='left';
      ctx.fillText(`BULLETS: ${S.blindchaseBullets.length}`, AM+4, AM+10);
      ctx.textAlign='start';

      ctx.restore();
    }

    // "INVERTED"/"NORMAL" label drawn on top after black
    if(S._bcInvertFlash>0){
      ctx.fillStyle=`rgba(100,180,255,${invertProg})`;
      ctx.font="bold 22px 'VT323', monospace";
      ctx.textAlign='center';
      ctx.fillText(S._bcInverted ? 'INVERTED' : 'NORMAL', ARENA_W/2, ARENA_H/2);
      ctx.textAlign='start';
    }
  }
}
