import { S } from '../../state/gameState.js';
import { bossCanvas, bCtx } from '../../core/canvasRefs.js';
import { drawBossHair, drawVignette } from './bossCommon.js';

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 6406-6675.

// ── PHASE 7 BOSS MODEL ──────────────────────────
// Same as phase 6 but torso is open, showing a glowing antenna inside.
export function drawBossPhase7(tick){
  const ctx=bCtx,W=bossCanvas.width,H=bossCanvas.height;
  ctx.clearRect(0,0,W,H);
  const flash=S.bossHitFlash>0;
  const coilOpen=S.bossCoilOpen;
  const bob=Math.sin(tick*0.02)*3;
  const ls=Math.sin(tick*0.022)*4;
  const rs=-ls;
  const cx=W/2+(S.bossOffsetX||0),by=22+bob;

  const skin  =flash?'#fff':'#b06040';
  const dSkin =flash?'#fff':'#7a3820';
  const pants =flash?'#fff':'#1a0a1a';
  const dPants=flash?'#fff':'#0a0010';
  const belt  =flash?'#fff':'#332200';
  const bandage=flash?'#fff':'#e8dcc8';
  const bandageShadow=flash?'#fff':'#b8a898';

  // SHADOW
  if(!flash){ctx.fillStyle='rgba(0,0,0,0.5)';ctx.beginPath();ctx.ellipse(cx,by+272,72,12,0,0,Math.PI*2);ctx.fill();}

  // LEGS
  ctx.fillStyle=pants;
  ctx.fillRect(cx-22,by+156,28,106);
  ctx.fillRect(cx+2,by+156,28,106);
  if(!flash){ctx.fillStyle=dPants;ctx.fillRect(cx-4,by+156,5,106);}

  // BELT
  ctx.fillStyle=belt;ctx.fillRect(cx-38,by+150,76,10);
  if(!flash){ctx.fillStyle='#664400';ctx.fillRect(cx-5,by+152,10,6);}

  // RIFLE ON BACK — same as phase 6
  if(!flash){
    ctx.save();
    ctx.translate(cx+10, by+80);
    ctx.rotate(-Math.PI/4);
    // Strap
    ctx.fillStyle='rgba(80,60,40,0.7)';
    ctx.fillRect(-70,-2,200,5);
    // Stock
    ctx.fillStyle='#1e1e1e';
    ctx.fillRect(60,-6,44,13);
    ctx.fillStyle='#111';
    ctx.fillRect(102,-7,5,15);
    ctx.fillStyle='#2a2a2a';
    ctx.fillRect(62,-4,40,3);
    // Receiver
    ctx.fillStyle='#252525';
    ctx.fillRect(14,-8,50,17);
    ctx.fillStyle='#333';
    ctx.fillRect(16,-6,46,4);
    // Pistol grip
    ctx.fillStyle='#1a1a1a';
    ctx.fillRect(30,9,12,20);
    ctx.fillStyle='#2a2a2a';
    ctx.fillRect(32,11,8,16);
    // Magazine
    ctx.fillStyle='#222';
    ctx.fillRect(44,9,10,24);
    ctx.fillStyle='#333';
    ctx.fillRect(46,11,6,20);
    // Barrel
    ctx.fillStyle='#1c1c1c';
    ctx.fillRect(-70,-5,88,11);
    ctx.fillStyle='#2a2a2a';
    ctx.fillRect(-68,-3,84,3);
    // Muzzle
    ctx.fillStyle='#111';
    ctx.fillRect(-74,-6,7,13);
    ctx.fillStyle='#000';
    ctx.fillRect(-72,-3,3,7);
    // Scope
    ctx.fillStyle='#1a1a1a';
    ctx.fillRect(-20,-17,44,10);
    ctx.fillStyle='rgba(60,140,220,0.38)';
    ctx.fillRect(-18,-15,40,6);
    ctx.restore();
  }

  // TORSO base
  ctx.fillStyle=skin;
  ctx.fillRect(cx-38,by+60,76,94);
  if(!flash){
    ctx.fillStyle=dSkin;
    ctx.fillRect(cx-2,by+60,4,94);
    ctx.fillRect(cx-22,by+75,6,60);
    ctx.fillRect(cx+16,by+75,6,60);
    ctx.fillStyle='#444';
    ctx.fillRect(cx-38,by+60,12,6);
    ctx.fillRect(cx+26,by+60,12,6);

    // Wounds on torso flesh (sides, away from cavity)
    // Left side — two cuts
    ctx.fillStyle='#6a1010';
    ctx.fillRect(cx-36,by+82,10,2); // long horizontal gash
    ctx.fillRect(cx-33,by+82,4,4); // depth
    ctx.fillRect(cx-35,by+100,7,2); // shorter one below
    ctx.fillStyle='#3a0808';
    ctx.fillRect(cx-36,by+82,10,1);
    ctx.fillRect(cx-35,by+100,7,1);
    // Right side — two cuts
    ctx.fillStyle='#6a1010';
    ctx.fillRect(cx+26,by+88,10,2);
    ctx.fillRect(cx+28,by+88,4,4);
    ctx.fillRect(cx+27,by+106,8,2);
    ctx.fillStyle='#3a0808';
    ctx.fillRect(cx+26,by+88,10,1);
    ctx.fillRect(cx+27,by+106,8,1);
  }

  // OPEN TORSO CAVITY — the antenna
  if(coilOpen && !flash){
    // Dark cavity opening
    const cavX=cx-20, cavY=by+72, cavW=40, cavH=60;
    ctx.fillStyle='#050510';
    ctx.fillRect(cavX,cavY,cavW,cavH);
    // Cavity border — ribs/metal
    ctx.strokeStyle='#555';ctx.lineWidth=2;ctx.strokeRect(cavX,cavY,cavW,cavH);
    ctx.fillStyle='#333';
    ctx.fillRect(cavX,cavY,cavW,4);
    ctx.fillRect(cavX,cavY+cavH-4,cavW,4);

    // Antenna — vertical column with arcing electricity
    const coilX=cx, coilY=by+76, coilH=50;
    // Coil base
    ctx.fillStyle='#888';
    ctx.fillRect(coilX-3,coilY+coilH-6,6,6);
    // Coil column
    for(let i=0;i<5;i++){
      const cy2=coilY+i*9;
      ctx.fillStyle=`rgba(160,160,180,${0.7+0.1*(i%2)})`;
      ctx.fillRect(coilX-4,cy2,8,6);
    }
    // Coil top cap
    ctx.fillStyle='#aaa';
    ctx.fillRect(coilX-5,coilY,10,4);

    // Electric arcs — animated
    const arcAlpha=0.6+0.4*Math.sin(tick*0.4);
    ctx.strokeStyle=`rgba(120,180,255,${arcAlpha})`;
    ctx.lineWidth=1.5;
    // Left arc
    ctx.beginPath();
    ctx.moveTo(coilX,coilY);
    ctx.lineTo(coilX-8+Math.sin(tick*0.7)*4,coilY+8+Math.cos(tick*0.5)*3);
    ctx.lineTo(cavX+2,coilY+12+Math.sin(tick*0.3)*5);
    ctx.stroke();
    // Right arc
    ctx.beginPath();
    ctx.moveTo(coilX,coilY);
    ctx.lineTo(coilX+8+Math.sin(tick*0.9)*4,coilY+6+Math.cos(tick*0.6)*3);
    ctx.lineTo(cavX+cavW-2,coilY+16+Math.sin(tick*0.4)*4);
    ctx.stroke();
    // Top spark
    ctx.beginPath();
    ctx.moveTo(coilX,coilY-2);
    ctx.lineTo(coilX+Math.sin(tick*1.1)*6,coilY-8+Math.cos(tick*0.8)*4);
    ctx.stroke();

    // Blue glow inside cavity
    const glow=ctx.createRadialGradient(coilX,coilY+coilH/2,2,coilX,coilY+coilH/2,25);
    glow.addColorStop(0,`rgba(80,140,255,${0.35+0.15*Math.sin(tick*0.4)})`);
    glow.addColorStop(1,'rgba(0,20,80,0)');
    ctx.fillStyle=glow;
    ctx.fillRect(cavX,cavY,cavW,cavH);

    // Skin panels open to sides (flaps)
    ctx.fillStyle=skin;
    ctx.fillRect(cx-38,by+72,18,60); // left skin flap
    ctx.fillRect(cx+20,by+72,18,60); // right skin flap
    if(!flash){
      ctx.fillStyle=dSkin;
      ctx.fillRect(cx-38,by+72,2,60);
      ctx.fillRect(cx+36,by+72,2,60);
    }

    // Redraw wounds on top of flaps so they stay visible
    ctx.fillStyle='#6a1010';
    ctx.fillRect(cx-36,by+82,10,2);
    ctx.fillRect(cx-33,by+82,4,4);
    ctx.fillRect(cx-35,by+100,7,2);
    ctx.fillRect(cx+26,by+88,10,2);
    ctx.fillRect(cx+28,by+88,4,4);
    ctx.fillRect(cx+27,by+106,8,2);
    ctx.fillStyle='#3a0808';
    ctx.fillRect(cx-36,by+82,10,1);
    ctx.fillRect(cx-35,by+100,7,1);
    ctx.fillRect(cx+26,by+88,10,1);
    ctx.fillRect(cx+27,by+106,8,1);
  }

  // WRIST + KNUCKLE BANDAGES — drawn after arms so they appear on top
  // (moved below arm drawing)

  // LEFT ARM
  ctx.fillStyle=skin;
  ctx.beginPath();ctx.ellipse(cx-94,by+104+ls,38,58,0,0,Math.PI*2);ctx.fill();
  if(!flash){ctx.fillStyle=dSkin;for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(cx-94,by+74+ls+i*22,30,5,0,0,Math.PI*2);ctx.fill();}}
  ctx.fillStyle=skin;
  ctx.fillRect(cx-128,by+150+ls,60,48);ctx.fillRect(cx-132,by+192+ls,68,36);
  if(!flash){
    ctx.fillStyle=dSkin;for(let i=0;i<4;i++) ctx.fillRect(cx-128+i*16,by+222+ls,12,8);
    // Wounds on left forearm
    ctx.fillStyle='#6a1010';
    ctx.fillRect(cx-122,by+162+ls,14,2);
    ctx.fillRect(cx-118,by+172+ls,9,2);
    ctx.fillStyle='#3a0808';
    ctx.fillRect(cx-122,by+162+ls,14,1);
    ctx.fillRect(cx-118,by+172+ls,9,1);
  }

  // RIGHT ARM
  ctx.fillStyle=skin;
  ctx.beginPath();ctx.ellipse(cx+94,by+104+rs,38,58,0,0,Math.PI*2);ctx.fill();
  if(!flash){ctx.fillStyle=dSkin;for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(cx+94,by+74+rs+i*22,30,5,0,0,Math.PI*2);ctx.fill();}}
  ctx.fillStyle=skin;
  ctx.fillRect(cx+68,by+150+rs,60,48);ctx.fillRect(cx+64,by+192+rs,68,36);
  if(!flash){
    ctx.fillStyle=dSkin;for(let i=0;i<4;i++) ctx.fillRect(cx+68+i*16,by+222+rs,12,8);
    // Wounds on right forearm
    ctx.fillStyle='#6a1010';
    ctx.fillRect(cx+106,by+158+rs,14,2);
    ctx.fillRect(cx+110,by+170+rs,9,2);
    ctx.fillStyle='#3a0808';
    ctx.fillRect(cx+106,by+158+rs,14,1);
    ctx.fillRect(cx+110,by+170+rs,9,1);
  }

  // WRIST + KNUCKLE BANDAGES (on top of arms/fists)
  ctx.fillStyle=bandage;
  ctx.fillRect(cx-132,by+188+ls,68,10);ctx.fillRect(cx-132,by+200+ls,68,6);
  ctx.fillRect(cx+64,by+188+rs,68,10);ctx.fillRect(cx+64,by+200+rs,68,6);
  if(!flash){
    ctx.fillStyle=bandageShadow;
    ctx.fillRect(cx-132,by+188+ls,68,2);ctx.fillRect(cx-132,by+197+ls,68,1);ctx.fillRect(cx-132,by+205+ls,68,1);
    ctx.fillRect(cx+64,by+188+rs,68,2);ctx.fillRect(cx+64,by+197+rs,68,1);ctx.fillRect(cx+64,by+205+rs,68,1);
    // Knuckles
    ctx.fillStyle=bandage;
    ctx.fillRect(cx-132,by+218+ls,68,8);ctx.fillRect(cx+64,by+218+rs,68,8);
    ctx.fillStyle=bandageShadow;
    for(let i=0;i<4;i++){ctx.fillRect(cx-130+i*16,by+218+ls,2,8);ctx.fillRect(cx+66+i*16,by+218+rs,2,8);}
  }

  // NECK
  ctx.fillStyle=skin;ctx.fillRect(cx-16,by+48,32,18);
  if(!flash){ctx.fillStyle=dSkin;ctx.fillRect(cx-16,by+60,32,6);}

  // HEAD
  ctx.fillStyle=skin;ctx.fillRect(cx-20,by+2,40,52);
  if(!flash){ctx.fillStyle=dSkin;ctx.fillRect(cx-20,by+44,40,8);}
  if(!flash) drawBossHair(ctx,cx,by);

  // EYES — electric blue tinge in phase 7
  if(!flash){ctx.fillStyle='#000';ctx.fillRect(cx-16,by+14,20,14);ctx.fillRect(cx-4,by+14,20,14);}
  const eyeCol=flash?'#fff':`rgba(30,80,180,${0.9+0.05*Math.sin(tick*0.12)})`;
  ctx.fillStyle=eyeCol;
  ctx.fillRect(cx-15,by+15,18,12);ctx.fillRect(cx-3,by+15,18,12);
  if(!flash){
    ctx.fillStyle=`rgba(30,80,180,${0.08+0.04*Math.sin(tick*0.08)})`;
    ctx.fillRect(cx-22,by+8,28,26);ctx.fillRect(cx-6,by+8,28,26);
    // Blue ambient glow from the coil on the face
    if(coilOpen){
      ctx.fillStyle=`rgba(20,60,180,${0.06+0.04*Math.sin(tick*0.4)})`;
      ctx.fillRect(cx-20,by+2,40,52);
    }
  }

  if(!flash) drawVignette(ctx,W,H,0.10,0.80,0.72,0.55);
  // S.bossHitFlash decrements once per tick in core/loop.js's updateOnce(),
  // not here — see that file for why.
}
