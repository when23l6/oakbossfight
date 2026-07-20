import { S } from '../../state/gameState.js';
import { bossCanvas, bCtx } from '../../core/canvasRefs.js';
import { drawVignette } from './bossCommon.js';
import { drawBossPhase7 } from './bossPhase7.js';
import { drawBossPhase8Eyes } from './bossPhase8Detail.js';

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 5620-5910.
// The body was ~291 lines, over the ~280-line split threshold, so the
// "── EYES ──" block (original lines 5835-5905) was pulled out into
// ./bossPhase8Detail.js as drawBossPhase8Eyes(); it is called below in the
// exact spot the inline code used to sit.

// ── PHASE 8 BOSS MODEL ──────────────────────────
// Two visual states:
//   bossOld    — shrunken, pale, slow bob, hunched posture
//   bossHorror — same shrunken body, hollow black void eyes, wide rictus smile
// Before bossOld: identical to phase 7 (coil still open)
export function drawBossPhase8(tick){
  const ctx=bCtx,W=bossCanvas.width,H=bossCanvas.height;
  ctx.clearRect(0,0,W,H);
  const flash=S.bossHitFlash>0;
  const old=S.bossOld;
  const horror=S.bossHorror;

  // Before old: reuse phase7 look exactly
  if(!old){ drawBossPhase7(tick); return; }

  // Shrunken old man: slow, shallow bob; arms hang lower; paler skin
  const dead=S.bossDeadEyes;
  const bob=dead?0:Math.sin(tick*0.012)*2;
  const ls=dead?0:Math.sin(tick*0.014)*4;
  const rs=dead?0:-ls;
  // Shrink by drawing at a slightly higher base (bob offset up)
  const cx=W/2+(S.bossOffsetX||0), by=40+bob; // higher by ~18px = looks shorter

  // Fade out when dead
  if(dead){
    if(S._bossDeadAlpha===null||S._bossDeadAlpha===undefined) S._bossDeadAlpha=1.0;
    S._bossDeadAlpha=Math.max(0, S._bossDeadAlpha-0.008);
    ctx.globalAlpha=S._bossDeadAlpha;
    if(S._bossDeadAlpha<=0){ ctx.globalAlpha=1; return; }
  }

  const skin  =flash?'#fff':'#c8a898'; // pale, ashen
  const dSkin =flash?'#fff':'#9a7060';
  const pants =flash?'#fff':'#1a0a1a';
  const dPants=flash?'#fff':'#0a0010';
  const belt  =flash?'#fff':'#332200';
  const bandage=flash?'#fff':'#e8dcc8';
  const bandageShadow=flash?'#fff':'#b8a898';

  // SHADOW — smaller than before
  if(!flash){ctx.fillStyle='rgba(0,0,0,0.35)';ctx.beginPath();ctx.ellipse(cx,by+260,52,8,0,0,Math.PI*2);ctx.fill();}

  // LEGS — shorter stride, less width
  ctx.fillStyle=pants;
  ctx.fillRect(cx-18,by+150,24,100);
  ctx.fillRect(cx+2, by+150,24,100);
  if(!flash){ctx.fillStyle=dPants;ctx.fillRect(cx-3,by+150,4,100);}

  // BELT
  ctx.fillStyle=belt;ctx.fillRect(cx-32,by+144,64,9);
  if(!flash){ctx.fillStyle='#664400';ctx.fillRect(cx-4,by+146,8,5);}

  // TORSO — narrower, slumped
  ctx.fillStyle=skin;
  ctx.fillRect(cx-30,by+56,60,90);
  if(!flash){
    ctx.fillStyle=dSkin;
    ctx.fillRect(cx-2,by+56,3,90);
    ctx.fillRect(cx-18,by+70,5,55);
    ctx.fillRect(cx+13,by+70,5,55);
    // torn shirt remnants
    ctx.fillStyle='#444';
    ctx.fillRect(cx-30,by+56,10,5);
    ctx.fillRect(cx+20,by+56,10,5);
    // age spots / frailty marks on torso
    ctx.fillStyle='rgba(90,60,40,0.35)';
    ctx.fillRect(cx-14,by+72,6,4);
    ctx.fillRect(cx+8, by+86,5,3);
    ctx.fillRect(cx-10,by+100,4,3);
  }

  // Torso bandage — same diagonal strip as ph6/7, but bloodier
  if(!flash){
    ctx.save();
    ctx.beginPath();ctx.rect(cx-30,by+56,60,90);ctx.clip();
    ctx.translate(cx-30,by+56);ctx.rotate(Math.PI/4);
    ctx.fillStyle=bandage;ctx.fillRect(-10,16,160,16);
    ctx.fillStyle=bandageShadow;ctx.fillRect(-10,16,160,3);ctx.fillRect(-10,29,160,3);
    // heavy blood soak — more than ph6
    ctx.fillStyle='rgba(80,0,0,0.65)';ctx.beginPath();ctx.ellipse(50,22,20,7,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(50,0,0,0.75)';ctx.beginPath();ctx.ellipse(52,21,10,4,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(110,0,0,0.4)';ctx.beginPath();ctx.ellipse(40,24,8,3,0.3,0,Math.PI*2);ctx.fill();
    // fresh drip — from the coughing
    ctx.fillStyle='rgba(160,0,0,0.5)';ctx.fillRect(50,28,3,12);ctx.fillRect(58,30,2,8);
    ctx.restore();
  }

  // Open torso cavity — antenna still visible
  if(!flash){
    const cavX=cx-16,cavY=by+66,cavW=32,cavH=52;
    ctx.fillStyle='#050510';ctx.fillRect(cavX,cavY,cavW,cavH);
    ctx.strokeStyle='#444';ctx.lineWidth=2;ctx.strokeRect(cavX,cavY,cavW,cavH);
    ctx.fillStyle='#2a2a2a';ctx.fillRect(cavX,cavY,cavW,3);ctx.fillRect(cavX,cavY+cavH-3,cavW,3);
    // Antenna — dimmer, flickering (old/damaged)
    const coilX=cx,coilY=by+70,coilH=42;
    const flicker=0.3+0.2*Math.sin(tick*0.6)+0.1*Math.sin(tick*1.7); // unstable
    ctx.fillStyle='#666';ctx.fillRect(coilX-2,coilY+coilH-5,5,5);
    for(let i=0;i<4;i++){const cy2=coilY+i*9;ctx.fillStyle=`rgba(130,130,150,${0.5+0.1*(i%2)})`;ctx.fillRect(coilX-3,cy2,6,5);}
    ctx.fillStyle='#888';ctx.fillRect(coilX-4,coilY,8,3);
    // Faint, unstable arcs
    ctx.strokeStyle=`rgba(80,120,200,${flicker})`;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(coilX,coilY);ctx.lineTo(coilX-6+Math.sin(tick*0.7)*3,coilY+7+Math.cos(tick*0.5)*2);ctx.lineTo(cavX+2,coilY+10+Math.sin(tick*0.3)*4);ctx.stroke();
    ctx.beginPath();ctx.moveTo(coilX,coilY);ctx.lineTo(coilX+6+Math.sin(tick*0.9)*3,coilY+5+Math.cos(tick*0.6)*2);ctx.lineTo(cavX+cavW-2,coilY+13+Math.sin(tick*0.4)*3);ctx.stroke();
    // Dim glow
    const glow=ctx.createRadialGradient(coilX,coilY+coilH/2,1,coilX,coilY+coilH/2,18);
    glow.addColorStop(0,`rgba(50,90,180,${flicker*0.5})`);glow.addColorStop(1,'rgba(0,10,50,0)');
    ctx.fillStyle=glow;ctx.fillRect(cavX,cavY,cavW,cavH);
    // Skin flaps
    ctx.fillStyle=skin;ctx.fillRect(cx-30,by+66,14,52);ctx.fillRect(cx+16,by+66,14,52);
    if(!flash){ctx.fillStyle=dSkin;ctx.fillRect(cx-30,by+66,2,52);ctx.fillRect(cx+28,by+66,2,52);}
  }

  // LEFT ARM — small gap from torso (right edge at cx-36, gap of 6px from cx-30)
  ctx.fillStyle=skin;
  ctx.fillRect(cx-58, by+60+ls, 22, 30);
  ctx.fillRect(cx-56, by+88+ls, 18, 28);
  ctx.fillRect(cx-54, by+114+ls,16, 22);
  if(!flash){
    ctx.fillStyle=dSkin;
    ctx.fillRect(cx-58,by+60+ls, 3,80);
    ctx.fillRect(cx-58,by+60+ls,22, 3);
    ctx.fillRect(cx-56,by+128+ls,4,8);
  }
  // forearm
  ctx.fillStyle=skin;
  ctx.fillRect(cx-52,by+134+ls,14,48);
  if(!flash){
    ctx.fillStyle=dSkin;
    ctx.fillRect(cx-52,by+134+ls,2,48);
    ctx.fillRect(cx-52,by+134+ls,14,2);
  }
  // FIST (left) — small, tight, matches forearm width
  ctx.fillStyle=skin;
  ctx.fillRect(cx-54,by+182+ls,16,10);
  ctx.fillRect(cx-53,by+191+ls,14, 7);
  if(!flash){
    ctx.fillStyle=dSkin;
    for(let i=0;i<3;i++) ctx.fillRect(cx-53+i*5,by+181+ls,4,2);
    ctx.fillStyle='rgba(0,0,0,0.28)';
    ctx.fillRect(cx-53,by+191+ls,14,2);
    for(let i=1;i<3;i++) ctx.fillRect(cx-53+i*4,by+192+ls,1,6);
    ctx.fillStyle='rgba(80,50,30,0.4)';
    ctx.fillRect(cx-51,by+184+ls,2,2);
  }
  if(!flash){
    ctx.fillStyle=bandage;ctx.fillRect(cx-54,by+178+ls,16,5);
    ctx.fillStyle=bandageShadow;ctx.fillRect(cx-54,by+178+ls,16,2);
    ctx.fillStyle='rgba(140,0,0,0.4)';ctx.fillRect(cx-51,by+179+ls,2,3);
  }

  // RIGHT ARM — small gap from torso (left edge at cx+36)
  ctx.fillStyle=skin;
  ctx.fillRect(cx+36, by+60+rs, 22, 30);
  ctx.fillRect(cx+38, by+88+rs, 18, 28);
  ctx.fillRect(cx+38, by+114+rs,16, 22);
  if(!flash){
    ctx.fillStyle=dSkin;
    ctx.fillRect(cx+36+19,by+60+rs, 3,80);
    ctx.fillRect(cx+36,   by+60+rs,22, 3);
    ctx.fillRect(cx+52,   by+128+rs,4, 8);
  }
  ctx.fillStyle=skin;
  ctx.fillRect(cx+38,by+134+rs,14,48);
  if(!flash){
    ctx.fillStyle=dSkin;
    ctx.fillRect(cx+38+12,by+134+rs,2,48);
    ctx.fillRect(cx+38,   by+134+rs,14,2);
  }
  // FIST (right) — small, tight, matches forearm width
  ctx.fillStyle=skin;
  ctx.fillRect(cx+38,by+182+rs,16,10);
  ctx.fillRect(cx+39,by+191+rs,14, 7);
  if(!flash){
    ctx.fillStyle=dSkin;
    for(let i=0;i<3;i++) ctx.fillRect(cx+39+i*5,by+181+rs,4,2);
    ctx.fillStyle='rgba(0,0,0,0.28)';
    ctx.fillRect(cx+39,by+191+rs,14,2);
    for(let i=1;i<3;i++) ctx.fillRect(cx+39+i*4,by+192+rs,1,6);
    ctx.fillStyle='rgba(80,50,30,0.4)';
    ctx.fillRect(cx+41,by+184+rs,2,2);
  }
  if(!flash){
    ctx.fillStyle=bandage;ctx.fillRect(cx+38,by+178+rs,16,5);
    ctx.fillStyle=bandageShadow;ctx.fillRect(cx+38,by+178+rs,16,2);
    ctx.fillStyle='rgba(140,0,0,0.4)';ctx.fillRect(cx+41,by+179+rs,2,3);
  }

  // NECK — thinner
  ctx.fillStyle=skin;ctx.fillRect(cx-12,by+44,24,16);
  if(!flash){ctx.fillStyle=dSkin;ctx.fillRect(cx-12,by+54,24,5);}

  // HEAD — same size but with old man features
  ctx.fillStyle=skin;ctx.fillRect(cx-18,by+2,36,46);
  if(!flash){ctx.fillStyle=dSkin;ctx.fillRect(cx-18,by+40,36,7);}

  // HAIR — same flat-top grey but slightly thinner
  if(!flash){
    ctx.fillStyle='#999999';
    ctx.fillRect(cx-18,by-6,36,12);
    ctx.fillRect(cx-20,by-2,5,16);
    ctx.fillRect(cx+15,by-2,5,16);
    ctx.fillStyle='#666666';
    ctx.fillRect(cx-20,by+6,5,8);
    ctx.fillRect(cx+15,by+6,5,8);
    ctx.fillRect(cx-18,by-6,36,3);
    // wrinkle lines on forehead
    ctx.fillStyle='rgba(90,60,40,0.3)';
    ctx.fillRect(cx-12,by+10,24,2);
    ctx.fillRect(cx-10,by+16,20,1);
  }

  // Blood drip on face — appears on narrator cough line
  if(S.bossBloodDrip && !flash){
    ctx.fillStyle='rgba(160,0,0,0.75)';
    ctx.fillRect(cx-4,by+28,3,14); // drip from mouth area
    ctx.fillRect(cx-4,by+26,5,4);  // source smear
    ctx.fillStyle='rgba(120,0,0,0.5)';
    ctx.fillRect(cx-5,by+40,2,6);  // trailing drop
  }

  // ── EYES ──
  drawBossPhase8Eyes(ctx, cx, by, tick, flash, W, H, horror);

  drawVignette(ctx,W,H,0.10,0.80,0.78,0.55);
  // S.bossHitFlash decrements once per tick in core/loop.js's updateOnce(),
  // not here — see that file for why.
  if(dead) ctx.globalAlpha=1;
}
