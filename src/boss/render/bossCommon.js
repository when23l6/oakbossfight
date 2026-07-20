import { S } from '../../state/gameState.js';
import { bossCanvas, bCtx } from '../../core/canvasRefs.js';
import { drawBossPhase3 } from './bossPhase3.js';
import { drawBossPhase5 } from './bossPhase5.js';
import { drawBossPhase6 } from './bossPhase6.js';
import { drawBossPhase7 } from './bossPhase7.js';
import { drawBossPhase8 } from './bossPhase8.js';

// Extracted verbatim from "iron_fist_battle_v8 (2).html":
//   drawVignette  lines 5594-5601
//   drawBossHair  lines 5604-5613
//   drawBoss      lines 5912-6031 (the generic phase1/phase2 body, plus the
//                 dispatch to the per-phase draw functions for phase>=3)

export function drawVignette(ctx, W, H, innerR, outerR, radAlpha, botStart){
  const vg=ctx.createRadialGradient(W/2,H*0.5,H*innerR,W/2,H*0.5,H*outerR);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,`rgba(0,0,0,${radAlpha})`);
  ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  const bf=ctx.createLinearGradient(0,H*botStart,0,H);
  bf.addColorStop(0,'rgba(0,0,0,0)');bf.addColorStop(1,'rgba(0,0,0,0.95)');
  ctx.fillStyle=bf;ctx.fillRect(0,0,W,H);
}

// Shared warm-silver spiky/tousled hair (ph5 and ph6 are identical)
export function drawBossHair(ctx, cx, by){
  const hairCol='#b8ac98', shadeCol='#8c8270';

  // Side hair (sideburns) — frames the head
  ctx.fillStyle=hairCol;
  ctx.fillRect(cx-24,by-4,6,20);
  ctx.fillRect(cx+18,by-4,6,20);
  ctx.fillStyle=shadeCol;
  ctx.fillRect(cx-24,by+6,6,10);
  ctx.fillRect(cx+18,by+6,6,10);

  // Tousled top — a row of pointed tufts of varying height
  const spikes=[
    {x:cx-22, w:11, h:9},
    {x:cx-13, w:12, h:17},
    {x:cx-3,  w:12, h:12},
    {x:cx+7,  w:12, h:19},
    {x:cx+16, w:9,  h:11},
  ];
  ctx.fillStyle=hairCol;
  for(const s of spikes){
    ctx.beginPath();
    ctx.moveTo(s.x, by+6);
    ctx.lineTo(s.x+s.w/2, by+6-s.h);
    ctx.lineTo(s.x+s.w, by+6);
    ctx.closePath();
    ctx.fill();
  }
  // Shadow sliver down the trailing edge of each spike for depth
  ctx.fillStyle=shadeCol;
  for(const s of spikes){
    ctx.beginPath();
    ctx.moveTo(s.x+s.w*0.55, by+6-s.h*0.9);
    ctx.lineTo(s.x+s.w, by+6);
    ctx.lineTo(s.x+s.w*0.75, by+6);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawBoss(tick){
  if(S.phase>=8){ drawBossPhase8(tick); return; }
  if(S.phase>=7){ drawBossPhase7(tick); return; }
  if(S.phase>=6){ drawBossPhase6(tick); return; }
  if(S.phase>=5 || S.bossBandaged){ drawBossPhase5(tick); return; }
  if(S.phase>=3){ drawBossPhase3(tick); return; }
  const ctx=bCtx,W=bossCanvas.width,H=bossCanvas.height;
  ctx.clearRect(0,0,W,H);
  const flash=S.bossHitFlash>0,ph2=S.phase===2;
  const bob=Math.sin(tick*0.035)*(ph2?5:3);
  const ls=Math.sin(tick*0.04)*10;
  const rs=-ls;
  const cx=W/2+(S.bossOffsetX||0),by=28+bob;

  const skin  =flash?'#fff':(ph2?'#c07050':'#c8845a');
  const dSkin =flash?'#fff':(ph2?'#904030':'#a06030');
  const vest  =flash?'#fff':'#e8e2d2';   // white lab coat
  const dVest =flash?'#fff':'#c4bda8';   // coat fold shading
  const collar=flash?'#fff':'#6a4d8a';   // purple shirt collar peeking above the coat
  const pants =flash?'#fff':'#c8a870';   // khaki slacks
  const dPants=flash?'#fff':'#a3865a';   // khaki shading
  const belt  =flash?'#fff':'#5c4a30';   // leather belt
  const hair  =flash?'#fff':'#b8ac98';   // warm silver hair
  const dHair =flash?'#fff':'#8c8270';

  // SHADOW
  if(!flash){ctx.fillStyle='rgba(0,0,0,0.4)';ctx.beginPath();ctx.ellipse(cx,by+268,62,10,0,0,Math.PI*2);ctx.fill();}

  // LEGS — narrow dark
  ctx.fillStyle=pants;
  ctx.fillRect(cx-20,by+156,26,100);
  ctx.fillRect(cx+2, by+156,26,100);
  if(!flash){ctx.fillStyle=dPants;ctx.fillRect(cx-3,by+156,4,100);}

  // TORSO — boxy striped vest
  ctx.fillStyle=vest;
  ctx.fillRect(cx-36,by+64,72,96);
  if(!flash){
    ctx.fillStyle=dVest;
    for(let i=0;i<6;i++) ctx.fillRect(cx-30+i*11,by+64,4,96);
    ctx.fillStyle='#555';ctx.fillRect(cx-1,by+64,2,96); // zip
  }
  ctx.fillStyle=belt;ctx.fillRect(cx-36,by+153,72,10);
  if(!flash){ctx.fillStyle='#b89860';ctx.fillRect(cx-5,by+155,10,6);}

  // LEFT ARM — big oval like reference
  ctx.fillStyle=skin;
  ctx.beginPath();ctx.ellipse(cx-92,by+106+ls,36,56,0,0,Math.PI*2);ctx.fill();
  if(!flash){
    ctx.fillStyle=dSkin;
    for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(cx-92,by+76+ls+i*22,28,5,0,0,Math.PI*2);ctx.fill();}
  }
  // left forearm + fist block
  ctx.fillStyle=skin;
  ctx.fillRect(cx-124,by+150+ls,56,46);
  ctx.fillRect(cx-128,by+190+ls,64,34);
  if(!flash){
    ctx.fillStyle=dSkin;
    for(let i=0;i<4;i++) ctx.fillRect(cx-124+i*15,by+218+ls,10,7);
    ctx.fillStyle='rgba(220,170,120,0.25)';ctx.fillRect(cx-126,by+191+ls,60,5);
  }
  // red wrist accent like reference
  if(!flash){ctx.fillStyle=ph2?'#bb0000':'#882200';ctx.fillRect(cx-126,by+188+ls,62,5);}

  // RIGHT ARM
  ctx.fillStyle=skin;
  ctx.beginPath();ctx.ellipse(cx+92,by+106+rs,36,56,0,0,Math.PI*2);ctx.fill();
  if(!flash){
    ctx.fillStyle=dSkin;
    for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(cx+92,by+76+rs+i*22,28,5,0,0,Math.PI*2);ctx.fill();}
  }
  ctx.fillStyle=skin;
  ctx.fillRect(cx+68,by+150+rs,56,46);
  ctx.fillRect(cx+64,by+190+rs,64,34);
  if(!flash){
    ctx.fillStyle=dSkin;
    for(let i=0;i<4;i++) ctx.fillRect(cx+68+i*15,by+218+rs,10,7);
    ctx.fillStyle='rgba(220,170,120,0.25)';ctx.fillRect(cx+66,by+191+rs,60,5);
  }
  if(!flash){ctx.fillStyle=ph2?'#bb0000':'#882200';ctx.fillRect(cx+64,by+188+rs,62,5);}

  // NECK — thick
  ctx.fillStyle=skin;
  ctx.fillRect(cx-14,by+52,28,18);
  if(!flash){ctx.fillStyle=dSkin;ctx.fillRect(cx-14,by+63,28,5);}

  // SHIRT — purple, visible down the coat's open front all the way to the belt
  if(!flash){ctx.fillStyle=collar;ctx.fillRect(cx-16,by+60,32,93);}

  // HEAD — small rectangle, proportionally compact like reference
  ctx.fillStyle=skin;
  ctx.fillRect(cx-20,by+4,40,52);
  if(!flash){ctx.fillStyle=dSkin;ctx.fillRect(cx-20,by+46,40,8);}

  // GREY HAIR — flat top military cut
  if(!flash){
    ctx.fillStyle=hair;
    ctx.fillRect(cx-22,by-8,44,14);  // top flat block
    ctx.fillRect(cx-24,by-4,6,20);   // left side
    ctx.fillRect(cx+18,by-4,6,20);   // right side
    ctx.fillStyle=dHair;
    ctx.fillRect(cx-24,by+6,6,10);   // side shading
    ctx.fillRect(cx+18,by+6,6,10);
    ctx.fillRect(cx-22,by-8,44,3);   // top edge shadow
  }

  // EYES — two small dark rectangles like reference
  const eyeBase=ph2?(flash?'#fff':'#990000'):'#223355';
  ctx.fillStyle=eyeBase;
  ctx.fillRect(cx-14,by+18,10,8);
  ctx.fillRect(cx+4, by+18,10,8);
  if(ph2&&!flash){
    ctx.fillStyle='rgba(255,10,0,0.85)';
    ctx.fillRect(cx-14,by+18,10,8);ctx.fillRect(cx+4,by+18,10,8);
    ctx.fillStyle='rgba(255,0,0,0.09)';
    ctx.fillRect(cx-18,by+13,18,18);ctx.fillRect(cx+2,by+13,18,18);
    // subtle bruise under right eye
    ctx.fillStyle='rgba(60,0,0,0.28)';ctx.fillRect(cx+4,by+26,10,4);
  }

  // VIGNETTE
  if(!flash) drawVignette(ctx,W,H,0.12,0.78,0.68,0.6);
  // S.bossHitFlash decrements once per tick in core/loop.js's updateOnce(),
  // not here — see that file for why (this used to decrement once per
  // rendered frame instead, which drifted from gamespeed once ticks and
  // frames stopped being 1:1).
}
