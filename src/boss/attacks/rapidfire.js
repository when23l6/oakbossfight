import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { elMenu } from '../../core/canvasRefs.js';
import { say, updateHP, highlightMain, buildSub } from '../../ui/menu.js';
import { loseGame } from '../../ui/overlay.js';

// ── RAPID FIRE ATTACK ─────────────────────────────
// 20 bullets fired one at a time from the top-center.
// Each bullet aims at the player's position at the moment it fires.
// Interval between shots: 8 frames. Bullet speed: 4px/frame.
// Player must keep moving — each bullet locks on independently.

export const RF_TOTAL       = 20;
export const RF_INTERVAL    = 8;   // frames between shots
export const RF_SPEED       = 4;   // px per frame
export const RF_BULLET_R    = 4;   // hitbox radius

export function beginRapidfireAttack(){
  if(S.rapidfirePhase) return;
  S.rapidfirePhase=true;
  S.rapidfireTimer=0;
  S.rapidfireShotCount=0;
  S.rapidfireBullets=[];
  S.gravity=false; S.vy=0;
  say('No cover. Just run.');
  elMenu.style.display='none';
}

export function updateRapidfireAttack(){
  if(!S.rapidfirePhase) return;
  S.rapidfireTimer++;

  // Player free movement
  if(!S.gameOver){
    if(S.keys['ArrowLeft']||S.keys['a'])  S.px=Math.max(AM+9, S.px-3.2);
    if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(ARENA_W-AM-9, S.px+3.2);
    if(S.keys['ArrowUp']||S.keys['w'])    S.py=Math.max(AM+9, S.py-3.2);
    if(S.keys['ArrowDown']||S.keys['s'])  S.py=Math.min(ARENA_H-AM-9, S.py+3.2);
  }

  // Spawn a new bullet every RF_INTERVAL frames, after 45f initial wait
  if(S.rapidfireShotCount < RF_TOTAL && S.rapidfireTimer > 45 && (S.rapidfireTimer - 45) % RF_INTERVAL === 1){
    const ox=ARENA_W/2, oy=AM;
    const dx=S.px-ox, dy=S.py-oy;
    const len=Math.sqrt(dx*dx+dy*dy)||1;
    S.rapidfireBullets.push({
      x:ox, y:oy,
      vx:(dx/len)*RF_SPEED,
      vy:(dy/len)*RF_SPEED,
      trail:[],
      done:false,
    });
    S.rapidfireShotCount++;
    S.shakeFrames=2;
  }

  // Move all bullets, check hits, remove off-screen
  for(const b of S.rapidfireBullets){
    if(b.done) continue;
    b.x+=b.vx; b.y+=b.vy;
    b.trail.push({x:b.x,y:b.y});
    if(b.trail.length>10) b.trail.shift();

    // Off-screen → done
    if(b.x<AM||b.x>ARENA_W-AM||b.y<AM||b.y>ARENA_H-AM){ b.done=true; continue; }

    // Hit player
    if(S.pHitFlash<=0&&S.pSilentFlash<=0){
      const dx=S.px-b.x, dy=S.py-b.y;
      if(Math.sqrt(dx*dx+dy*dy)<RF_BULLET_R+6){
        b.done=true;
        S.playerHP=Math.max(0,S.playerHP-3);
        S.pHitFlash=30; updateHP();
        if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.rapidfirePhase=false;setTimeout(loseGame,500);}
      }
    }
  }

  // Cull done bullets
  S.rapidfireBullets=S.rapidfireBullets.filter(b=>!b.done);

  // End when all fired and all cleared
  if(S.rapidfireShotCount>=RF_TOTAL && S.rapidfireBullets.length===0){
    S.rapidfirePhase=false;
    S.turn='player';
    S.actionLocked=false;
    elMenu.style.display='';
    say('What will you do?');
    S.inSub=false;S.subIdx=0;highlightMain();buildSub(S.selAction);
  }
}
