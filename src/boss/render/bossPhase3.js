import { S } from '../../state/gameState.js';
import { bossCanvas, bCtx } from '../../core/canvasRefs.js';
import { drawVignette } from './bossCommon.js';

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 6678-6822.

// ── PHASE 3 BOSS MODEL ──────────────────────────
export function drawBossPhase3(tick){
  const ctx=bCtx,W=bossCanvas.width,H=bossCanvas.height;
  ctx.clearRect(0,0,W,H);
  const flash=S.bossHitFlash>0;
  const bob=Math.sin(tick*0.045)*4; // more agitated bob
  const ls=Math.sin(tick*0.05)*14;  // wider arm swing
  const rs=-ls;
  const cx=W/2+(S.bossOffsetX||0),by=22+bob;

  // Phase 3 color palette — darker, more raw, vest torn off
  const skin  =flash?'#fff':'#b06040';
  const dSkin =flash?'#fff':'#7a3820';
  const vein  =flash?'#fff':'#8b1a00'; // visible vein color
  const pants =flash?'#fff':'#1a0a1a'; // darker pants
  const dPants=flash?'#fff':'#0a0010';
  const belt  =flash?'#fff':'#332200';

  // SHADOW — bigger, more threatening
  if(!flash){ctx.fillStyle='rgba(0,0,0,0.5)';ctx.beginPath();ctx.ellipse(cx,by+272,72,12,0,0,Math.PI*2);ctx.fill();}

  // LEGS
  ctx.fillStyle=pants;
  ctx.fillRect(cx-22,by+156,28,106);
  ctx.fillRect(cx+2, by+156,28,106);
  if(!flash){ctx.fillStyle=dPants;ctx.fillRect(cx-4,by+156,5,106);}
  // torn pants bottom edges
  if(!flash){
    ctx.fillStyle=dPants;
    for(let i=0;i<5;i++) ctx.fillRect(cx-22+i*6,by+258,4,4+Math.sin(i*1.3)*3);
    for(let i=0;i<5;i++) ctx.fillRect(cx+2+i*6,by+258,4,4+Math.sin(i*1.7)*3);
  }

  // BELT — bare, no vest
  ctx.fillStyle=belt;ctx.fillRect(cx-38,by+150,76,10);
  if(!flash){ctx.fillStyle='#664400';ctx.fillRect(cx-5,by+152,10,6);}

  // BARE TORSO — no vest, just skin with vein/muscle detail
  ctx.fillStyle=skin;
  ctx.fillRect(cx-38,by+60,76,94);
  if(!flash){
    // muscle shading lines down torso
    ctx.fillStyle=dSkin;
    ctx.fillRect(cx-2,by+60,4,94);       // center line
    ctx.fillRect(cx-22,by+75,6,60);      // left pec shadow
    ctx.fillRect(cx+16,by+75,6,60);      // right pec shadow
    // vein traces on torso
    ctx.fillStyle=vein;
    ctx.fillRect(cx-18,by+80,2,30);
    ctx.fillRect(cx-16,by+95,2,15);
    ctx.fillRect(cx+14,by+82,2,28);
    ctx.fillRect(cx+12,by+100,2,12);
    // torn shirt remnants on shoulders
    ctx.fillStyle='#555';
    ctx.fillRect(cx-38,by+60,12,8);
    ctx.fillRect(cx+26,by+60,12,8);
  }

  // LEFT ARM — same oval shape but darker, veins
  ctx.fillStyle=skin;
  ctx.beginPath();ctx.ellipse(cx-94,by+104+ls,38,58,0,0,Math.PI*2);ctx.fill();
  if(!flash){
    ctx.fillStyle=dSkin;
    for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(cx-94,by+74+ls+i*22,30,5,0,0,Math.PI*2);ctx.fill();}
    // veins on arm
    ctx.fillStyle=vein;
    ctx.fillRect(cx-100,by+90+ls,2,35);
    ctx.fillRect(cx-96,by+105+ls,2,25);
    ctx.fillRect(cx-88,by+98+ls,2,20);
  }
  ctx.fillStyle=skin;
  ctx.fillRect(cx-128,by+150+ls,60,48);
  ctx.fillRect(cx-132,by+192+ls,68,36);
  if(!flash){
    ctx.fillStyle=dSkin;
    for(let i=0;i<4;i++) ctx.fillRect(cx-128+i*16,by+222+ls,12,8);
    ctx.fillStyle=vein;
    ctx.fillRect(cx-122,by+158+ls,2,30);
    ctx.fillRect(cx-114,by+170+ls,2,20);
  }
  // no wristband — bare knuckles
  if(!flash){ctx.fillStyle=dSkin;ctx.fillRect(cx-130,by+190+ls,66,4);}

  // RIGHT ARM
  ctx.fillStyle=skin;
  ctx.beginPath();ctx.ellipse(cx+94,by+104+rs,38,58,0,0,Math.PI*2);ctx.fill();
  if(!flash){
    ctx.fillStyle=dSkin;
    for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(cx+94,by+74+rs+i*22,30,5,0,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle=vein;
    ctx.fillRect(cx+98,by+90+rs,2,35);
    ctx.fillRect(cx+94,by+105+rs,2,25);
    ctx.fillRect(cx+86,by+98+rs,2,20);
  }
  ctx.fillStyle=skin;
  ctx.fillRect(cx+68,by+150+rs,60,48);
  ctx.fillRect(cx+64,by+192+rs,68,36);
  if(!flash){
    ctx.fillStyle=dSkin;
    for(let i=0;i<4;i++) ctx.fillRect(cx+68+i*16,by+222+rs,12,8);
    ctx.fillStyle=vein;
    ctx.fillRect(cx+118,by+158+rs,2,30);
    ctx.fillRect(cx+110,by+170+rs,2,20);
  }
  if(!flash){ctx.fillStyle=dSkin;ctx.fillRect(cx+62,by+190+rs,66,4);}

  // NECK
  ctx.fillStyle=skin;
  ctx.fillRect(cx-16,by+48,32,18);
  if(!flash){
    ctx.fillStyle=dSkin;ctx.fillRect(cx-16,by+60,32,6);
    ctx.fillStyle=vein;ctx.fillRect(cx-10,by+50,2,16);ctx.fillRect(cx+8,by+52,2,14);
  }

  // HEAD — same compact shape
  ctx.fillStyle=skin;
  ctx.fillRect(cx-20,by+2,40,52);
  if(!flash){ctx.fillStyle=dSkin;ctx.fillRect(cx-20,by+44,40,8);}

  // HAIR — still grey but slightly disheveled (wider, slightly uneven)
  if(!flash){
    ctx.fillStyle='#999';
    ctx.fillRect(cx-24,by-10,48,14);
    ctx.fillRect(cx-26,by-6,7,22);
    ctx.fillRect(cx+19,by-6,7,22);
    ctx.fillStyle='#666';
    ctx.fillRect(cx-26,by+4,7,12);
    ctx.fillRect(cx+19,by+4,7,12);
    ctx.fillRect(cx-24,by-10,48,3);
  }

  // EYES — full blazing red, no pupils, pure rage
  if(!flash){ctx.fillStyle='#000';ctx.fillRect(cx-16,by+14,20,14);ctx.fillRect(cx-4,by+14,20,14);}
  ctx.fillStyle=flash?'#fff':`rgba(255,${20+Math.floor(Math.sin(tick*0.1)*15)},0,0.95)`;
  ctx.fillRect(cx-15,by+15,18,12);ctx.fillRect(cx-3,by+15,18,12);
  if(!flash){
    // large red glow
    ctx.fillStyle=`rgba(255,0,0,${0.12+0.08*Math.sin(tick*0.08)})`;
    ctx.fillRect(cx-22,by+8,28,26);ctx.fillRect(cx-6,by+8,28,26);
  }

  // VIGNETTE
  if(!flash) drawVignette(ctx,W,H,0.10,0.80,0.75,0.55);
  // S.bossHitFlash decrements once per tick in core/loop.js's updateOnce(),
  // not here — see that file for why.
}
