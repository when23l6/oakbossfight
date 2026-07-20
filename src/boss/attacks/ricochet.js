import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { elMenu } from '../../core/canvasRefs.js';
import { say, updateHP, highlightMain, buildSub } from '../../ui/menu.js';
import { loseGame } from '../../ui/overlay.js';

// ── RICOCHET ATTACK ────────────────────────────────
// A bullet spawns from a random wall corner and travels toward the player.
// On each bounce off a wall it re-aims directly at the player's current position.
// 5 bounces total. No cover — pure dodge.
// Between bounces: brief AIM pause (laser shows new direction) then bullet fires.

export const RICOCHET_BOUNCES = 5;
export const RICOCHET_SPEED   = 5;   // px per frame

export function beginRicochet(){
  if(S.ricochetPhase) return;
  S.ricochetPhase=true;
  S.gravity=false; S.vy=0;
  S.px=ARENA_W/2; S.py=ARENA_H-AM-9;

  // Always spawn at top middle, wait 0.75sec before first shot
  S.ricochetBullet={
    x: ARENA_W/2, y: AM+2,
    vx: 0, vy: 0,
    bouncesLeft: RICOCHET_BOUNCES,
    state: 'wait',
    waitTimer: 0,
    trail: [],
  };
  say('Dodge the ricochet!');
  elMenu.style.display='none';
}

export function _ricochetAimAt(bx, by, tx, ty){
  const dx=tx-bx, dy=ty-by;
  const len=Math.sqrt(dx*dx+dy*dy)||1;
  return { vx:(dx/len)*RICOCHET_SPEED, vy:(dy/len)*RICOCHET_SPEED };
}

export function updateRicochet(){
  if(!S.ricochetPhase) return;
  const b=S.ricochetBullet;
  if(!b) return;

  // Player free movement
  if(!S.gameOver){
    if(S.keys['ArrowLeft']||S.keys['a'])  S.px=Math.max(AM+9, S.px-3.2);
    if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(ARENA_W-AM-9, S.px+3.2);
    if(S.keys['ArrowUp']||S.keys['w'])    S.py=Math.max(AM+9, S.py-3.2);
    if(S.keys['ArrowDown']||S.keys['s'])  S.py=Math.min(ARENA_H-AM-9, S.py+3.2);
  }

  // Wait state: 0.75 sec (45 frames) before first shot
  if(b.state==='wait'){
    b.waitTimer++;
    if(b.waitTimer>=45){
      const dir=_ricochetAimAt(b.x, b.y, S.px, S.py);
      b.vx=dir.vx; b.vy=dir.vy;
      b.state='travel';
    }
    return;
  }

  // Move bullet
  b.x+=b.vx; b.y+=b.vy;

  // Trail
  b.trail.push({x:b.x, y:b.y});
  if(b.trail.length>20) b.trail.shift();

  // Hit player
  if(S.pHitFlash<=0&&S.pSilentFlash<=0){
    const dx=S.px-b.x, dy=S.py-b.y;
    if(Math.sqrt(dx*dx+dy*dy)<12){
      S.playerHP=Math.max(0,S.playerHP-5);
      S.pHitFlash=40; updateHP();
      if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.ricochetPhase=false;setTimeout(loseGame,500);}
    }
  }

  // Bounce off arena walls — reflect velocity per axis, re-aim at player on each bounce
  let hitX=false, hitY=false;
  if(b.x<=AM+2){ b.x=AM+2; hitX=true; }
  else if(b.x>=ARENA_W-AM-2){ b.x=ARENA_W-AM-2; hitX=true; }
  if(b.y<=AM+2){ b.y=AM+2; hitY=true; }
  else if(b.y>=ARENA_H-AM-2){ b.y=ARENA_H-AM-2; hitY=true; }

  if(hitX||hitY){
    // Reflect velocity so bullet leaves the wall before re-aiming
    if(hitX) b.vx=-b.vx;
    if(hitY) b.vy=-b.vy;
    b.bouncesLeft--;
    b.trail=[];
    S.shakeFrames=4;
    if(b.bouncesLeft<=0){
      S.ricochetPhase=false;
      S.ricochetBullet=null;
      S.zones=[];
      S.turn='player';
      S.actionLocked=false;
      elMenu.style.display='';
      say('What will you do?');
      S.inSub=false;S.subIdx=0;highlightMain();buildSub(S.selAction);
    } else {
      // Re-aim directly at player current position
      const dir=_ricochetAimAt(b.x, b.y, S.px, S.py);
      b.vx=dir.vx; b.vy=dir.vy;
    }
  }
}
