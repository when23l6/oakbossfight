// Extracted verbatim (logic only) from "iron_fist_battle_v8 (2).html" lines 2708-2823.
// Split out of corridor.js's updateCorridor() (phases 'squeeze' and 'ricochet') to keep
// corridor.js under the 300-line limit. Called directly from updateCorridor() in corridor.js;
// hoisted setup values (IH, hallScreenT, hallScreenB) computed there are passed in as args.
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { say } from '../../ui/menu.js';
import { COR_MID_Y, _corDmg } from './corridor.js';
import { beginCorMultiRic } from './corMultiRic.js';

// ── PHASE squeeze — 4 walls close to 3x3 player box at hall center ──
function _updateCorridorSqueeze(IH, hallScreenT, hallScreenB){
  if(S.corSqueezeDelay>0){ S.corSqueezeDelay--; return; }
  const spd=0.6;
  const tgt=S.corSqTgt;

  // Left wall slides back to target (world → screen consistent)
  S.corChaseWallX=S.corChaseWallX>S.corSqLWorldX
    ? Math.max(S.corSqLWorldX, S.corChaseWallX-spd)
    : Math.min(S.corSqLWorldX, S.corChaseWallX+spd);

  // Top/Bottom/Right walls close in (screen coords)
  if(S.corSqT < tgt.T) S.corSqT=Math.min(tgt.T, S.corSqT+spd);
  if(S.corSqB > tgt.B) S.corSqB=Math.max(tgt.B, S.corSqB-spd);
  if(S.corSqR > tgt.R) S.corSqR=Math.max(tgt.R, S.corSqR-spd*2);

  // Camera locked
  S.corCamX=S.corSqueezeCamX;
  S.corCamY=COR_MID_Y-IH/2;
  S.px=(S.corWorldX-S.corCamX)+AM;
  S.py=(S.corWorldY-S.corCamY)+AM;

  const sqT=S.corSqT, sqB=S.corSqB, sqR=S.corSqR;
  const sqL=(S.corChaseWallX-S.corCamX)+AM;

  // Player movement
  if(!S.gameOver){
    if(S.keys['ArrowLeft'] ||S.keys['a']) S.px=S.px-3.2;
    if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(sqR-6, S.px+3.2);
    if(S.keys['ArrowUp']   ||S.keys['w']) S.py=Math.max(sqT+6, S.py-3.2);
    if(S.keys['ArrowDown'] ||S.keys['s']) S.py=Math.min(sqB-6, S.py+3.2);
  }
  S.px=Math.min(sqR-6, S.px);
  S.py=Math.max(sqT+6, Math.min(sqB-6, S.py));
  S.corWorldX=S.corCamX+(S.px-AM);
  S.corWorldY=S.corCamY+(S.py-AM);

  // Damage from all walls
  if(S.pHitFlash<=0&&S.pSilentFlash<=0){
    if(S.px-6<=sqL||S.px+6>=sqR||S.py-6<=sqT||S.py+6>=sqB) _corDmg();
  }

  // End: all walls reached targets → ricochet
  if(Math.abs(S.corSqR-tgt.R)<1&&Math.abs(S.corSqT-tgt.T)<1&&Math.abs(S.corSqB-tgt.B)<1){
    S.corPhase='ricochet';
    S.corRicTimer=0;
    const newHalf=36;
    const cx=ARENA_W/2, hallCY=(hallScreenT+hallScreenB)/2;
    S.corRicBCX=cx;
    S.corRicBCY=hallCY;
    S.corRicHalf=newHalf;
    const spd=1.1;
    const ang=Math.random()*Math.PI*2;
    S.corRicVX=Math.cos(ang)*spd;
    S.corRicVY=Math.sin(ang)*spd;
    say('...');
  }
  return;
}

// ── PHASE ricochet — box bounces around hall for 10 sec ──
function _updateCorridorRicochet(hallScreenT, hallScreenB){
  S.corRicTimer++;
  const DURATION=600; // 10 sec at 60fps
  const IW2=ARENA_W-AM*2, IH2=ARENA_H-AM*2;
  const half=S.corRicHalf;

  // Camera locked
  S.corCamX=S.corSqueezeCamX;
  S.corCamY=COR_MID_Y-IH2/2;

  // Move box
  S.corRicBCX+=S.corRicVX;
  S.corRicBCY+=S.corRicVY;

  // Bounce off hall top/bottom
  if(S.corRicBCY-half<=hallScreenT){ S.corRicBCY=hallScreenT+half; S.corRicVY=Math.abs(S.corRicVY); }
  if(S.corRicBCY+half>=hallScreenB){ S.corRicBCY=hallScreenB-half; S.corRicVY=-Math.abs(S.corRicVY); }
  // Bounce off arena left/right
  if(S.corRicBCX-half<=AM){ S.corRicBCX=AM+half; S.corRicVX=Math.abs(S.corRicVX); S.shakeFrames=3; }
  if(S.corRicBCX+half>=ARENA_W-AM){ S.corRicBCX=ARENA_W-AM-half; S.corRicVX=-Math.abs(S.corRicVX); S.shakeFrames=3; }

  // Player position follows box center (trapped inside)
  S.px=(S.corWorldX-S.corCamX)+AM;
  S.py=(S.corWorldY-S.corCamY)+AM;
  if(!S.gameOver){
    if(S.keys['ArrowLeft'] ||S.keys['a']) S.px=S.px-3.2;
    if(S.keys['ArrowRight']||S.keys['d']) S.px=S.px+3.2;
    if(S.keys['ArrowUp']   ||S.keys['w']) S.py=S.py-3.2;
    if(S.keys['ArrowDown'] ||S.keys['s']) S.py=S.py+3.2;
  }
  // Keep player inside box
  S.px=Math.max(S.corRicBCX-half+6, Math.min(S.corRicBCX+half-6, S.px));
  S.py=Math.max(S.corRicBCY-half+6, Math.min(S.corRicBCY+half-6, S.py));
  S.corWorldX=S.corCamX+(S.px-AM);
  S.corWorldY=S.corCamY+(S.py-AM);

  // Damage if touching box walls
  if(S.pHitFlash<=0&&S.pSilentFlash<=0){
    if(S.px-6<=S.corRicBCX-half||S.px+6>=S.corRicBCX+half||
       S.py-6<=S.corRicBCY-half||S.py+6>=S.corRicBCY+half) _corDmg();
  }

  // End: 10 seconds done → launch 5-ball multi-ricochet
  if(S.corRicTimer>=DURATION){
    S.shakeFrames=8;
    S.corridorPhase=false;
    S.corVBoxes=[];S.corHBoxes=[];S.zones=[];
    S.gravity=false;S.vy=0;
    // Reset player to center
    S.px=ARENA_W/2; S.py=ARENA_H/2;
    beginCorMultiRic();
  }
  return;
}

export { _updateCorridorSqueeze, _updateCorridorRicochet };
