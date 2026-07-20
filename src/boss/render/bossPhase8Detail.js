import { S } from '../../state/gameState.js';

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 5835-5905 (the
// "── EYES ──" block of drawBossPhase8). Split out of bossPhase8.js purely to
// stay under the 300-line-per-file limit — drawBossPhase8's body alone was
// ~291 lines. Called by drawBossPhase8() in ./bossPhase8.js.

export function drawBossPhase8Eyes(ctx, cx, by, tick, flash, W, H, horror){
  if(!flash){ctx.fillStyle='#000';ctx.fillRect(cx-14,by+12,18,12);ctx.fillRect(cx-4,by+12,18,12);}

  if(S.bossDeadEyes){
    // DEAD EYES — pure black, closed, no mouth
    if(!flash){
      ctx.fillStyle='#000';
      ctx.fillRect(cx-14,by+12,18,12);ctx.fillRect(cx-4,by+12,18,12);
      // Closed lids — thin dark lines
      ctx.fillStyle='rgba(60,40,30,0.7)';
      ctx.fillRect(cx-14,by+17,18,3);ctx.fillRect(cx-4,by+17,18,3);
    }
  } else if(horror){
    // HOLLOW VOID EYES — pure black, no iris, no glow
    ctx.fillStyle='#000000';
    ctx.fillRect(cx-14,by+12,18,14);
    ctx.fillRect(cx-4, by+12,18,14);
    // Subtle dark shadow spilling below eye sockets
    if(!flash){
      ctx.fillStyle='rgba(0,0,0,0.55)';
      ctx.fillRect(cx-16,by+24,22,6);
      ctx.fillRect(cx-6, by+24,22,6);
    }
    // Small red dot in left eye only
    if(!flash){
      ctx.fillStyle='#cc0000';
      ctx.fillRect(cx-8,by+17,4,4);
    }
    // RICTUS SMILE — wide, too wide, pixelated
    if(!flash){
      ctx.fillStyle='#1a0000';
      // Mouth bar — wider than face
      ctx.fillRect(cx-16,by+34,32,5);
      // Teeth — small white blocks inside
      ctx.fillStyle='#e8e0d0';
      for(let i=0;i<6;i++) ctx.fillRect(cx-13+i*5,by+34,4,4);
      // Corner creases pulling wide
      ctx.fillStyle='#3a0808';
      ctx.fillRect(cx-18,by+32,4,8);
      ctx.fillRect(cx+14, by+32,4,8);
      // Smile lines carved into cheeks
      ctx.fillStyle='rgba(80,30,20,0.5)';
      ctx.fillRect(cx-18,by+28,3,10);
      ctx.fillRect(cx+15, by+28,3,10);
    }
    // Pulsing dark vignette — arena feels wrong
    if(!flash){
      const pulse=0.18+0.08*Math.sin(tick*0.07);
      const dv=ctx.createRadialGradient(W/2,H*0.4,H*0.05,W/2,H*0.4,H*0.85);
      dv.addColorStop(0,'rgba(0,0,0,0)');
      dv.addColorStop(1,`rgba(10,0,20,${pulse})`);
      ctx.fillStyle=dv;ctx.fillRect(0,0,W,H);
    }
  } else {
    // OLD MAN EYES — pale, watery, half-lidded
    if(!flash){ctx.fillStyle='#000';ctx.fillRect(cx-14,by+12,18,12);ctx.fillRect(cx-4,by+12,18,12);}
    const eyeCol=flash?'#fff':`rgba(160,140,120,${0.7+0.05*Math.sin(tick*0.04)})`;
    ctx.fillStyle=eyeCol;
    ctx.fillRect(cx-13,by+14,16,8);ctx.fillRect(cx-3,by+14,16,8);
    // heavy eyelid drooping — dark bar over top half of eye
    if(!flash){
      ctx.fillStyle='rgba(0,0,0,0.5)';
      ctx.fillRect(cx-14,by+12,18,5);
      ctx.fillRect(cx-4, by+12,18,5);
    }
    // Thin tired mouth line
    if(!flash){
      ctx.fillStyle='#7a4030';
      ctx.fillRect(cx-8,by+34,16,2);
    }
  }
}
