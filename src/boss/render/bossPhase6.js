import { S } from '../../state/gameState.js';
import { bossCanvas, bCtx } from '../../core/canvasRefs.js';
import { drawBossHair, drawVignette } from './bossCommon.js';

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 6037-6240.

// ── PHASE 6 BOSS MODEL ──────────────────────────
// Same as phase 5 (bandaged, bare torso) but:
//  - Blood stains on bandages
//  - Right arm raised, holding a rifle pointed sideways
export function drawBossPhase6(tick){
  const ctx=bCtx,W=bossCanvas.width,H=bossCanvas.height;
  ctx.clearRect(0,0,W,H);
  const flash=S.bossHitFlash>0;
  const bob=Math.sin(tick*0.028)*2; // slight bob, more tense
  const ls=Math.sin(tick*0.035)*6;  // left arm still swings slightly
  const cx=W/2+(S.bossOffsetX||0),by=22+bob;

  const skin         =flash?'#fff':'#b06040';
  const dSkin        =flash?'#fff':'#7a3820';
  const pants        =flash?'#fff':'#1a0a1a';
  const dPants       =flash?'#fff':'#0a0010';
  const belt         =flash?'#fff':'#332200';
  const bandage      =flash?'#fff':'#c49088'; // more reddish bandage
  const bandageShadow=flash?'#fff':'#a09070';
  const blood        =flash?'#fff':'#880000';
  const rifle        =flash?'#fff':'#2a2a2a';
  const rifleAccent  =flash?'#fff':'#555';

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

  // RIFLE ON BACK — drawn behind the torso at 45° diagonal (only after drawn)
  if(!flash && S.bossBandaged){
    ctx.save();
    ctx.translate(cx+10, by+80);
    ctx.rotate(-Math.PI/4); // \ diagonal, barrel top-left, stock bottom-right

    // Strap across back (thin diagonal line)
    ctx.fillStyle='rgba(80,60,40,0.7)';
    ctx.fillRect(-70,-2,200,5);

    // Stock (bottom-right end)
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

    // Barrel (extends to the left = up-left on screen)
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

  // BARE TORSO
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
  }

  // TORSO BANDAGE diagonal with blood stain — soaked look
  if(!flash){
    ctx.save();
    ctx.beginPath();ctx.rect(cx-38,by+60,76,94);ctx.clip();
    ctx.translate(cx-38,by+60);ctx.rotate(Math.PI/4);

    // Bandage base — slightly darker/dirtier than phase 5
    ctx.fillStyle=bandage;ctx.fillRect(-10,20,180,18);
    ctx.fillStyle=bandageShadow;ctx.fillRect(-10,20,180,3);ctx.fillRect(-10,35,180,3);

    // Blood soaking through — large dark wet area in the center
    ctx.fillStyle='rgba(90,0,0,0.55)';
    ctx.beginPath();ctx.ellipse(58,28,22,8,0,0,Math.PI*2);ctx.fill();
    // Darker core (fully soaked)
    ctx.fillStyle='rgba(60,0,0,0.7)';
    ctx.beginPath();ctx.ellipse(60,27,12,5,0,0,Math.PI*2);ctx.fill();
    // Wet spread — irregular bleed edges
    ctx.fillStyle='rgba(110,0,0,0.4)';
    ctx.beginPath();ctx.ellipse(48,29,9,4,0.3,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(72,26,7,3,-0.2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(130,0,0,0.25)';
    ctx.beginPath();ctx.ellipse(55,32,14,4,0.5,0,Math.PI*2);ctx.fill();
    // Blood seeping through edge of bandage — small drip streaks
    ctx.fillStyle='rgba(100,0,0,0.45)';
    ctx.fillRect(56,33,3,8); // drip down edge
    ctx.fillRect(64,33,2,5);
    ctx.fillStyle='rgba(80,0,0,0.3)';
    ctx.fillRect(58,38,2,4);

    ctx.restore();
  }

  // LEFT ARM (slightly raised — supporting rifle from below)
  ctx.fillStyle=skin;
  ctx.beginPath();ctx.ellipse(cx-94,by+100+ls,38,58,0,0,Math.PI*2);ctx.fill();
  if(!flash){ctx.fillStyle=dSkin;for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(cx-94,by+70+ls+i*22,30,5,0,0,Math.PI*2);ctx.fill();}}
  ctx.fillStyle=skin;
  ctx.fillRect(cx-128,by+146+ls,60,48);
  ctx.fillRect(cx-132,by+188+ls,68,36);
  if(!flash){ctx.fillStyle=dSkin;for(let i=0;i<4;i++) ctx.fillRect(cx-128+i*16,by+218+ls,12,8);}
  // Left wrist bandage with blood drip
  if(!flash){
    ctx.fillStyle=bandage;
    ctx.fillRect(cx-132,by+184+ls,68,10);
    ctx.fillRect(cx-132,by+196+ls,68,6);
    ctx.fillStyle=bandageShadow;
    ctx.fillRect(cx-132,by+184+ls,68,2);ctx.fillRect(cx-132,by+193+ls,68,1);ctx.fillRect(cx-132,by+201+ls,68,1);
    ctx.fillStyle=bandage;ctx.fillRect(cx-132,by+214+ls,68,8);
    ctx.fillStyle=bandageShadow;for(let i=0;i<4;i++) ctx.fillRect(cx-130+i*16,by+214+ls,2,8);
    // Blood drip on left knuckles
    ctx.fillStyle='rgba(140,0,0,0.5)';
    ctx.fillRect(cx-120,by+220+ls,6,10);
    ctx.fillRect(cx-104,by+222+ls,4,8);
  }

  // RIGHT ARM — same as left arm, mirrored
  ctx.fillStyle=skin;
  ctx.beginPath();ctx.ellipse(cx+94,by+100,38,58,0,0,Math.PI*2);ctx.fill();
  if(!flash){ctx.fillStyle=dSkin;for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(cx+94,by+70+i*22,30,5,0,0,Math.PI*2);ctx.fill();}}
  ctx.fillStyle=skin;
  ctx.fillRect(cx+68,by+146,60,48);
  ctx.fillRect(cx+64,by+188,68,36);
  if(!flash){ctx.fillStyle=dSkin;for(let i=0;i<4;i++) ctx.fillRect(cx+64+i*16,by+218,12,8);}
  if(!flash){
    ctx.fillStyle=bandage;
    ctx.fillRect(cx+64,by+184,68,10);
    ctx.fillRect(cx+64,by+196,68,6);
    ctx.fillStyle=bandageShadow;
    ctx.fillRect(cx+64,by+184,68,2);ctx.fillRect(cx+64,by+193,68,1);ctx.fillRect(cx+64,by+201,68,1);
    ctx.fillStyle=bandage;ctx.fillRect(cx+64,by+214,68,8);
    ctx.fillStyle=bandageShadow;for(let i=0;i<4;i++) ctx.fillRect(cx+66+i*16,by+214,2,8);
    ctx.fillStyle='rgba(140,0,0,0.5)';
    ctx.fillRect(cx+76,by+220,6,10);
    ctx.fillRect(cx+92,by+222,4,8);
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

  // EYES — cold, narrowed
  if(!flash){ctx.fillStyle='#000';ctx.fillRect(cx-16,by+14,20,14);ctx.fillRect(cx-4,by+14,20,14);}
  ctx.fillStyle=flash?'#fff':`rgba(255,${15+Math.floor(Math.sin(tick*0.05)*8)},0,0.92)`;
  ctx.fillRect(cx-15,by+16,18,9);ctx.fillRect(cx-3,by+16,18,9);
  if(!flash){
    ctx.fillStyle=`rgba(255,0,0,${0.06+0.03*Math.sin(tick*0.05)})`;
    ctx.fillRect(cx-22,by+8,28,26);ctx.fillRect(cx-6,by+8,28,26);
  }

  // VIGNETTE
  if(!flash) drawVignette(ctx,W,H,0.10,0.80,0.78,0.55);

  if(S.bossHitFlash>0) S.bossHitFlash--;
}
