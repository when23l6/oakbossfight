import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { elMenu } from '../../core/canvasRefs.js';
import { say, updateHP, highlightMain, buildSub } from '../../ui/menu.js';
import { loseGame } from '../../ui/overlay.js';

// ── POSSESSION ATTACK ─────────────────────────────
// Phase 7 only. Antenna charges (40f) → beam hits player → controls invert.
// 3 rounds: each round fires 6 beams from arena center (4 random + 1 aimed at player).
// Beams have warn phase then active phase. Player must dodge with INVERTED controls.
// After all 3 rounds, possession lifts and turn returns to player.

export const POS_CHARGE_DUR = 40;   // antenna charge-up before possession locks in
export const POS_WARN_DUR   = 30;   // beam warn (danger preview)
export const POS_ACTIVE_DUR = 20;   // beam active (damage)
export const POS_BETWEEN    = 50;   // gap between rounds
export const POS_BEAM_LEN   = Math.sqrt(ARENA_W*ARENA_W+ARENA_H*ARENA_H);
export const POS_BEAM_THICK = 14;   // beam hitbox half-width

export function beginPossession(){
  if(S.possessionPhase) return;
  S.possessionPhase=true;
  S.possessionTimer=0;
  S.possessionRound=0;
  S.possessionBeams=[];
  S.possessionInverted=false;
  S.possessionChargeTimer=0;
  S.gravity=false; S.vy=0;
  say('Something seeps into your mind...');
  elMenu.style.display='none';
}

export function _spawnPossessionBeams(){
  // 4 random angles + 1 aimed at player, all from arena center
  const cx=ARENA_W/2, cy=ARENA_H/2;
  const beams=[];
  const angles=[];
  // 4 random
  for(let i=0;i<4;i++){
    let a;
    do { a=Math.random()*Math.PI*2; }
    while(angles.some(x=>Math.abs(x-a)<0.4));
    angles.push(a);
    beams.push({cx,cy,angle:a,warn:true,active:false,done:false,timer:0});
  }
  // 1 aimed at player
  const aimed=Math.atan2(S.py-cy,S.px-cx);
  beams.push({cx,cy,angle:aimed,warn:true,active:false,done:false,timer:0,isAimed:true});
  S.possessionBeams=beams;
}

export function updatePossession(){
  if(!S.possessionPhase) return;
  S.possessionTimer++;

  // Inverted movement
  if(S.gameOver){ return; }
  const left =S.keys['ArrowLeft'] ||S.keys['a'];
  const right=S.keys['ArrowRight']||S.keys['d'];
  const up   =S.keys['ArrowUp']   ||S.keys['w'];
  const down =S.keys['ArrowDown'] ||S.keys['s'];
  const spd=3.2;
  if(S.possessionInverted){
    if(left)  S.px=Math.min(ARENA_W-AM-9, S.px+spd);
    if(right) S.px=Math.max(AM+9,         S.px-spd);
    if(up)    S.py=Math.min(ARENA_H-AM-9, S.py+spd);
    if(down)  S.py=Math.max(AM+9,         S.py-spd);
  } else {
    if(left)  S.px=Math.max(AM+9,         S.px-spd);
    if(right) S.px=Math.min(ARENA_W-AM-9, S.px+spd);
    if(up)    S.py=Math.max(AM+9,         S.py-spd);
    if(down)  S.py=Math.min(ARENA_H-AM-9, S.py+spd);
  }

  // Charge phase before round 1
  if(!S.possessionInverted && S.possessionRound===0 && S.possessionTimer<=POS_CHARGE_DUR){
    if(S.possessionTimer===POS_CHARGE_DUR){
      S.possessionFlash=20; // 20 frames of blue flash before invert
      say('Your mind... is not your own.');
    }
    return;
  }

  // Blue flash — plays out before invert activates
  if(S.possessionFlash>0){
    S.possessionFlash--;
    if(S.possessionFlash<=0){
      S.possessionInverted=true;
      S.shakeFrames=8;
      _spawnPossessionBeams();
    }
    return;
  }

  // Update beams
  let allDone=S.possessionBeams.length>0;
  for(const b of S.possessionBeams){
    if(b.done) continue;
    allDone=false;
    b.timer++;
    if(b.warn && b.timer>=POS_WARN_DUR){
      b.warn=false; b.active=true; b.timer=0;
      S.shakeFrames=5;
    } else if(b.active){
      // Collision: perpendicular dist from player to ray
      if(S.pHitFlash<=0&&S.pSilentFlash<=0){
        const cos=Math.cos(b.angle), sin=Math.sin(b.angle);
        const dx=S.px-b.cx, dy=S.py-b.cy;
        const proj=dx*cos+dy*sin;
        const perp=Math.abs(dx*sin-dy*cos);
        if(proj>0 && perp<POS_BEAM_THICK/2+6){
          S.playerHP=Math.max(0,S.playerHP-2);
          S.pHitFlash=30; updateHP();
          if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.possessionPhase=false;S.possessionInverted=false;setTimeout(loseGame,500);}
        }
      }
      if(b.timer>=POS_ACTIVE_DUR){ b.active=false; b.done=true; }
    }
  }

  // Round over when all beams done
  if(allDone && S.possessionBeams.length>0){
    S.possessionRound++;
    S.possessionBeams=[];
    if(S.possessionRound>=3){
      // All done — lift possession
      S.possessionPhase=false;
      S.possessionInverted=false;
      S.zones=[];
      S.turn='player';
      S.actionLocked=false;
      elMenu.style.display='';
      say('Your mind is your own again.');
      S.inSub=false;S.subIdx=0;highlightMain();buildSub(S.selAction);
    } else {
      // Next round after brief gap
      setTimeout(()=>{
        if(S.possessionPhase) _spawnPossessionBeams();
      }, Math.floor(POS_BETWEEN*1000/60));
    }
  }
}
