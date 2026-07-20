import { S } from '../../state/gameState.js';
import { bossCanvas, bCtx } from '../../core/canvasRefs.js';
import { drawBossHair, drawVignette } from './bossCommon.js';

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 6243-6402.

// ── PHASE 5 BOSS MODEL ──────────────────────────
export function drawBossPhase5(tick){
  const ctx=bCtx,W=bossCanvas.width,H=bossCanvas.height;
  ctx.clearRect(0,0,W,H);
  const flash=S.bossHitFlash>0;
  const healing=S.bossHealFlash>0;
  const bandaged=S.bossBandaged;
  const bob=Math.sin(tick*0.03)*3;
  const ls=Math.sin(tick*0.04)*10;
  const rs=-ls;
  const cx=W/2+(S.bossOffsetX||0),by=22+bob;

  const healAlpha=healing?(S.bossHealFlash/40)*0.55:0;

  // Before bandaged: still looks like ph3 (dark raw skin)
  // After bandaged: cleaner, slightly lighter tone
  const skin      =flash?'#fff':bandaged?'#b86848':'#b06040';
  const dSkin     =flash?'#fff':'#7a3820';
  const pants     =flash?'#fff':'#1a0a1a';
  const dPants    =flash?'#fff':'#0a0010';
  const belt      =flash?'#fff':'#332200';
  const bandage   =flash?'#fff':healing?'#eeeedd':'#d4c4a0';
  const bandageShadow=flash?'#fff':'#b0a080';

  // SHADOW
  if(!flash){ctx.fillStyle='rgba(0,0,0,0.5)';ctx.beginPath();ctx.ellipse(cx,by+272,72,12,0,0,Math.PI*2);ctx.fill();}

  // LEGS
  ctx.fillStyle=pants;
  ctx.fillRect(cx-22,by+156,28,106);
  ctx.fillRect(cx+2, by+156,28,106);
  if(!flash){ctx.fillStyle=dPants;ctx.fillRect(cx-4,by+156,5,106);}

  // BELT
  ctx.fillStyle=belt;ctx.fillRect(cx-38,by+150,76,10);
  if(!flash){ctx.fillStyle='#664400';ctx.fillRect(cx-5,by+152,10,6);}

  // BARE TORSO — clean, no veins
  ctx.fillStyle=skin;
  ctx.fillRect(cx-38,by+60,76,94);
  if(!flash){
    ctx.fillStyle=dSkin;
    ctx.fillRect(cx-2,by+60,4,94);
    ctx.fillRect(cx-22,by+75,6,60);
    ctx.fillRect(cx+16,by+75,6,60);
    // torn shirt remnants
    ctx.fillStyle='#444';
    ctx.fillRect(cx-38,by+60,12,6);
    ctx.fillRect(cx+26,by+60,12,6);
  }

  // TORSO BANDAGES — single wide diagonal \ strip (45°, left-top to right-bottom)
  if(bandaged && !flash){
    ctx.save();
    ctx.beginPath();ctx.rect(cx-38,by+60,76,94);ctx.clip();
    // Draw a wide diagonal band at 45° using rotated rectangle
    ctx.translate(cx-38, by+60);
    ctx.rotate(Math.PI/4); // 45°
    // In rotated space, draw a wide horizontal band centred on the diagonal
    ctx.fillStyle=bandage;
    ctx.fillRect(-10, 20, 180, 18);
    ctx.fillStyle=bandageShadow;
    ctx.fillRect(-10, 20, 180, 3);
    ctx.fillRect(-10, 35, 180, 3);
    ctx.restore();
  }

  // LEFT ARM
  ctx.fillStyle=skin;
  ctx.beginPath();ctx.ellipse(cx-94,by+104+ls,38,58,0,0,Math.PI*2);ctx.fill();
  if(!flash){
    ctx.fillStyle=dSkin;
    for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(cx-94,by+74+ls+i*22,30,5,0,0,Math.PI*2);ctx.fill();}
  }
  ctx.fillStyle=skin;
  ctx.fillRect(cx-128,by+150+ls,60,48);
  ctx.fillRect(cx-132,by+192+ls,68,36);
  if(!flash){
    ctx.fillStyle=dSkin;
    for(let i=0;i<4;i++) ctx.fillRect(cx-128+i*16,by+222+ls,12,8);
  }
  // LEFT WRIST BANDAGE
  if(bandaged && !flash){
    ctx.fillStyle=bandage;
    ctx.fillRect(cx-132,by+188+ls,68,10);
    ctx.fillRect(cx-132,by+200+ls,68,6);
    ctx.fillStyle=bandageShadow;
    ctx.fillRect(cx-132,by+188+ls,68,2);
    ctx.fillRect(cx-132,by+197+ls,68,1);
    ctx.fillRect(cx-132,by+205+ls,68,1);
    // Knuckles
    ctx.fillStyle=bandage;
    ctx.fillRect(cx-132,by+218+ls,68,8);
    ctx.fillStyle=bandageShadow;
    for(let i=0;i<4;i++) ctx.fillRect(cx-130+i*16,by+218+ls,2,8);
  }

  // RIGHT ARM
  ctx.fillStyle=skin;
  ctx.beginPath();ctx.ellipse(cx+94,by+104+rs,38,58,0,0,Math.PI*2);ctx.fill();
  if(!flash){
    ctx.fillStyle=dSkin;
    for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(cx+94,by+74+rs+i*22,30,5,0,0,Math.PI*2);ctx.fill();}
  }
  ctx.fillStyle=skin;
  ctx.fillRect(cx+68,by+150+rs,60,48);
  ctx.fillRect(cx+64,by+192+rs,68,36);
  if(!flash){
    ctx.fillStyle=dSkin;
    for(let i=0;i<4;i++) ctx.fillRect(cx+68+i*16,by+222+rs,12,8);
  }
  // RIGHT WRIST BANDAGE
  if(bandaged && !flash){
    ctx.fillStyle=bandage;
    ctx.fillRect(cx+64,by+188+rs,68,10);
    ctx.fillRect(cx+64,by+200+rs,68,6);
    ctx.fillStyle=bandageShadow;
    ctx.fillRect(cx+64,by+188+rs,68,2);
    ctx.fillRect(cx+64,by+197+rs,68,1);
    ctx.fillRect(cx+64,by+205+rs,68,1);
    // Knuckles
    ctx.fillStyle=bandage;
    ctx.fillRect(cx+64,by+218+rs,68,8);
    ctx.fillStyle=bandageShadow;
    for(let i=0;i<4;i++) ctx.fillRect(cx+66+i*16,by+218+rs,2,8);
  }

  // NECK
  ctx.fillStyle=skin;
  ctx.fillRect(cx-16,by+48,32,18);
  if(!flash){ctx.fillStyle=dSkin;ctx.fillRect(cx-16,by+60,32,6);}

  // HEAD
  ctx.fillStyle=skin;
  ctx.fillRect(cx-20,by+2,40,52);
  if(!flash){ctx.fillStyle=dSkin;ctx.fillRect(cx-20,by+44,40,8);}

  // HAIR
  if(!flash) drawBossHair(ctx,cx,by);

  // EYES — still red, but steadier (no wild glow)
  if(!flash){ctx.fillStyle='#000';ctx.fillRect(cx-16,by+14,20,14);ctx.fillRect(cx-4,by+14,20,14);}
  ctx.fillStyle=flash?'#fff':`rgba(255,${20+Math.floor(Math.sin(tick*0.06)*10)},0,0.90)`;
  ctx.fillRect(cx-15,by+15,18,12);ctx.fillRect(cx-3,by+15,18,12);
  if(!flash){
    ctx.fillStyle=`rgba(255,0,0,${0.07+0.04*Math.sin(tick*0.06)})`;
    ctx.fillRect(cx-22,by+8,28,26);ctx.fillRect(cx-6,by+8,28,26);
  }

  // Heal glow overlay — green shimmer across whole body
  if(healing && !flash){
    ctx.fillStyle=`rgba(80,200,80,${healAlpha})`;
    ctx.fillRect(cx-140,by,290,260);
  }

  // VIGNETTE
  if(!flash) drawVignette(ctx,W,H,0.10,0.80,0.72,0.55);

  if(S.bossHitFlash>0) S.bossHitFlash--;
  if(S.bossHealFlash>0) S.bossHealFlash--;
}
