// Extracted verbatim (logic only) from "iron_fist_battle_v8 (2).html" lines 2926-3029.
// rendered by boss/render/zoneEngine.js, no dedicated draw needed
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { say, updateHP } from '../../ui/menu.js';
import { loseGame } from '../../ui/overlay.js';
import { elMenu } from '../../core/canvasRefs.js';
import { makeZone, updateZones } from '../zones.js';
import { beginCorRifleGrenade } from './corRifleGrenade.js';

// ── CORRIDOR BLOCKS + LINE360 + CIRCLE sequence ──
function _scheduleCorBlocks(T0, withCircle){
  const IW2=ARENA_W-AM*2, IH2=ARENA_H-AM*2;
  const bw=Math.floor(IW2/2), bh=Math.floor(IH2/2);
  const corners=[[AM,AM],[AM+bw,AM],[AM+bw,AM+bh],[AM,AM+bh]];
  const sc=Math.floor(Math.random()*4), cw=Math.random()<0.5;
  const BWARN=22, BACT=28, BGAP=5, bstep=BWARN+BACT+BGAP;
  for(let i=0;i<5;i++){
    const ci=cw?(sc+i)%4:(sc-i+4)%4;
    const [cx2,cy2]=corners[ci];
    S.zones.push(makeZone({x:cx2,y:cy2,w:bw,h:bh,color:'#ff4400',warnDur:BWARN,activeDur:BACT+bstep,startTick:T0+i*bstep,blockIdx:i}));
  }
  // line_360: fires from edges during the block sequence
  const LWARN=30, LACT=18, LGAP=12;
  for(let i=0;i<6;i++){
    const edge=Math.floor(Math.random()*4);
    let ox,oy;
    if(edge===0){ ox=AM+Math.random()*IW2; oy=AM; }
    else if(edge===1){ ox=AM+Math.random()*IW2; oy=ARENA_H-AM; }
    else if(edge===2){ ox=AM; oy=AM+Math.random()*IH2; }
    else             { ox=ARENA_W-AM; oy=AM+Math.random()*IH2; }
    S.zones.push(makeZone({type:'line_360',cx:ox,cy:oy,angle:0,warnDur:LWARN,activeDur:LACT,startTick:T0+i*(LWARN+LACT+LGAP),color:'#ff0088',thickness:16,trackPlayer:true}));
  }
  // After 1 block spin (bstep*1), add circles
  if(withCircle){
    const circStart=T0+bstep;
    const margin=30;
    for(let i=0;i<4;i++){
      const cx=AM+margin+Math.random()*(ARENA_W-AM*2-margin*2);
      const cy=AM+margin+Math.random()*(ARENA_H-AM*2-margin*2);
      S.zones.push(makeZone({type:'circle_expand',cx,cy,startTick:circStart+i*75,warnDur:45,activeDur:60,passThruDur:15,fullBox:true,color:'#ff2200',passThru:false,r:0,thickness:8}));
    }
  }
}

function beginCorBlocks(){
  if(S.corBlocksPhase) return;
  S.corBlocksPhase=true;
  S.corBlocksTimer=0;
  S.zones=[];
  S.gravity=false; S.vy=0;
  // No teleport — player stays where they are

  const BWARN=22, BACT=28, BGAP=5, bstep=BWARN+BACT+BGAP;
  // Round 1: blocks + line_360, no circle
  _scheduleCorBlocks(0, false);
  // Round 2: starts after round 1 (5 blocks = 5*bstep), with circles
  const round2Start=5*bstep+40;
  _scheduleCorBlocks(round2Start, true);

  // Total duration: round2 blocks end + buffer
  S._corBlocksDur=round2Start+5*bstep+200;
  say('...');
  elMenu.style.display='none';
}

function updateCorBlocks(){
  if(!S.corBlocksPhase) return;
  S.corBlocksTimer++;

  // Drive zone system with our local timer
  S.atkTimer=S.corBlocksTimer;

  // Free player movement
  if(!S.gameOver){
    if(S.keys['ArrowLeft'] ||S.keys['a']) S.px=Math.max(AM+9,S.px-3.5);
    if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(ARENA_W-AM-9,S.px+3.5);
    if(S.keys['ArrowUp']   ||S.keys['w']) S.py=Math.max(AM+9,S.py-3.5);
    if(S.keys['ArrowDown'] ||S.keys['s']) S.py=Math.min(ARENA_H-AM-9,S.py+3.5);
  }

  // Update all zones
  updateZones();

  // Collision — reuse main loop hit detection logic
  const hit=S.zones.some(z=>{
    if(z.type==='circle_expand'&&z.passThru) return false;
    if(!z.active) return false;
    if(z.type==='circle_expand'){
      const dx=S.px-z.cx,dy=S.py-z.cy;
      const dist=Math.sqrt(dx*dx+dy*dy);
      const thick=(z.thickness||20)/2;
      return dist>z.r-thick-6&&dist<z.r+thick+6;
    }
    if(z.type==='line_360'){
      const cos=Math.cos(z.angle),sin=Math.sin(z.angle);
      const dx=S.px-z.cx,dy=S.py-z.cy;
      const proj=dx*cos+dy*sin;
      if(proj<0) return false;
      return Math.abs(dx*sin-dy*cos)<(z.thickness||8)/2+6;
    }
    return S.px+6>z.x&&S.px-6<z.x+z.w&&S.py+6>z.y&&S.py-6<z.y+z.h;
  });
  if(hit&&S.pHitFlash<=0&&S.pSilentFlash<=0){
    S.playerHP=Math.max(0,S.playerHP-2); S.pHitFlash=30; updateHP();
    if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.corBlocksPhase=false;setTimeout(loseGame,500);}
  }

  if(S.corBlocksTimer>=S._corBlocksDur){
    S.corBlocksPhase=false;
    S.zones=[];
    beginCorRifleGrenade();
  }
}

export { _scheduleCorBlocks, beginCorBlocks, updateCorBlocks };
