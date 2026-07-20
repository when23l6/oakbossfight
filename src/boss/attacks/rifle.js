import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { elMenu } from '../../core/canvasRefs.js';
import { say, updateHP, highlightMain, buildSub } from '../../ui/menu.js';
import { loseGame } from '../../ui/overlay.js';

// ── RIFLE ATTACK ──────────────────────────────────
// 3 shots. Each shot:
//   AIM phase (90f): two diagonal red aim lines converge on player from top.
//                    Player must hide behind one of 3 horizontal walls.
//   FIRE phase (8f):  bullet streaks along aim line. Wall in path shatters.
//   RELOAD (40f):    brief pause, shattered wall debris fades.
// Walls are drawn as thick horizontal bars at fixed Y positions.
// Player moves freely (gravity off). If bullet's Y band hits player → damage.

export const RIFLE_WALL_COUNT = 3;
export const RIFLE_WALL_H = 10;
export const RIFLE_WALL_W = 68;

export function _rifleWallYs(){
  // 3 walls at evenly spaced Y positions inside arena
  const IH = ARENA_H - AM*2;
  return [
    AM + Math.floor(IH * 0.28),
    AM + Math.floor(IH * 0.54),
    AM + Math.floor(IH * 0.78),
  ];
}

export function beginRifle(){
  if(S.riflePhase) return;
  S.riflePhase=true;
  S.rifleTimer=0;
  S.rifleShot=0;
  S.rifleState='aim';
  S.gravity=false; S.vy=0;
  S.px=ARENA_W/2; S.py=ARENA_H-AM-9;

  // Build 3 walls: {x, y, w, h, alive, shatterTimer, vx}
  // Each wall moves horizontally at different speeds, bouncing off arena edges
  const ys=_rifleWallYs();
  S.rifleWalls=[
    {x: AM+14,                        y:ys[0], w:RIFLE_WALL_W, h:RIFLE_WALL_H, alive:true, shatterTimer:0, vx:  1.2},
    {x: ARENA_W-AM-14-RIFLE_WALL_W,   y:ys[1], w:RIFLE_WALL_W, h:RIFLE_WALL_H, alive:true, shatterTimer:0, vx: -1.6},
    {x: AM+14,                        y:ys[2], w:RIFLE_WALL_W, h:RIFLE_WALL_H, alive:true, shatterTimer:0, vx:  1.0},
  ];
  S.rifleBullet=null;
  S.rifleAimAngle=0;

  say('He raises the rifle. Get behind cover!');
  elMenu.style.display='none';
}

export function _rifleAimOrigin(){
  // Bullet fires from top-center of arena
  return { x: ARENA_W/2, y: AM };
}

export function _rifleAngleToPlayer(){
  const o=_rifleAimOrigin();
  return Math.atan2(S.py - o.y, S.px - o.x);
}

export function updateRifle(){
  if(!S.riflePhase) return;
  S.rifleTimer++;
  const t=S.rifleTimer;

  // Player free movement (no gravity)
  if(!S.gameOver){
    if(S.keys['ArrowLeft']||S.keys['a'])  S.px=Math.max(AM+9, S.px-3.0);
    if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(ARENA_W-AM-9, S.px+3.0);
    if(S.keys['ArrowUp']||S.keys['w'])    S.py=Math.max(AM+9, S.py-3.0);
    if(S.keys['ArrowDown']||S.keys['s'])  S.py=Math.min(ARENA_H-AM-9, S.py+3.0);
  }

  // Keep player out of alive walls (solid cover)
  for(const w of S.rifleWalls){
    if(!w.alive) continue;
    const px=S.px, py=S.py, r=6;
    if(px+r>w.x && px-r<w.x+w.w && py+r>w.y && py-r<w.y+w.h){
      // push player out of wall (vertical preference)
      const overlapTop=Math.abs((py+r)-w.y);
      const overlapBot=Math.abs(w.y+w.h-(py-r));
      if(overlapTop<overlapBot) S.py=w.y-r;
      else S.py=w.y+w.h+r;
    }
  }

  // Tick shatter timers + move alive walls
  for(const w of S.rifleWalls){
    if(!w.alive){ if(w.shatterTimer>0) w.shatterTimer--; continue; }
    w.x+=w.vx;
    if(w.x<=AM){ w.x=AM; w.vx=Math.abs(w.vx); }
    if(w.x+w.w>=ARENA_W-AM){ w.x=ARENA_W-AM-w.w; w.vx=-Math.abs(w.vx); }
  }

  const AIM_DUR    = 90;   // frames of aiming (tracks player the whole time)
  const BULLET_SPX = 80;   // pixels per frame — purely visual, just fast
  const RELOAD     = 50;   // pause between shots

  if(S.rifleState==='aim'){
    // Track player angle the whole time — snap-fires the instant AIM_DUR hits
    const target=_rifleAngleToPlayer();
    let diff=target-S.rifleAimAngle;
    while(diff>Math.PI) diff-=Math.PI*2;
    while(diff<-Math.PI) diff+=Math.PI*2;
    S.rifleAimAngle+=diff*0.18;

    if(S.rifleTimer>=AIM_DUR){
      // Fire — snapshot player position and shielding RIGHT NOW
      S.rifleState='fire';
      S.rifleTimer=0;
      const o=_rifleAimOrigin();
      const angle=S.rifleAimAngle;
      const len=Math.sqrt(ARENA_W*ARENA_W+ARENA_H*ARENA_H);
      const cos=Math.cos(angle), sin=Math.sin(angle);

      // Find which wall (if any) the bullet hits first
      let hitWall=null, hitDist=Infinity;
      for(const w of S.rifleWalls){
        if(!w.alive) continue;
        const tX1=(w.x - o.x)/cos, tX2=(w.x+w.w - o.x)/cos;
        const tY1=(w.y - o.y)/sin, tY2=(w.y+w.h - o.y)/sin;
        const tXmin=Math.min(tX1,tX2), tXmax=Math.max(tX1,tX2);
        const tYmin=Math.min(tY1,tY2), tYmax=Math.max(tY1,tY2);
        const tEnter=Math.max(tXmin,tYmin), tExit=Math.min(tXmax,tYmax);
        if(tEnter<tExit && tEnter>0 && tEnter<hitDist){
          hitDist=tEnter; hitWall=w;
        }
      }
      if(hitDist===Infinity) hitDist=len;

      // Player distance along bullet ray
      const playerDist=(S.px - o.x)*cos + (S.py - o.y)*sin;
      // Shielded = wall is closer to origin than the player along the ray
      const playerShielded = hitWall && hitDist < playerDist - 6;

      // If no wall shields the player → damage, full stop
      if(!playerShielded && S.pHitFlash<=0&&S.pSilentFlash<=0){
        const dmg=6;
        S.playerHP=Math.max(0, S.playerHP-dmg);
        S.pHitFlash=40; updateHP();
        if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.riflePhase=false;setTimeout(loseGame,500);}
      }

      S.rifleBullet={
        ox:o.x, oy:o.y,
        bx:o.x, by:o.y,
        angle, cos, sin,
        dist:0,
        hitDist,
        hitWall,
        done:false,
      };
    }
  } else if(S.rifleState==='fire'){
    const b=S.rifleBullet;
    if(!b.done){
      b.dist=Math.min(b.dist+BULLET_SPX, b.hitDist);
      b.bx=b.ox+b.cos*b.dist;
      b.by=b.oy+b.sin*b.dist;
      if(b.dist>=b.hitDist){
        b.done=true;
        if(b.hitWall){ b.hitWall.alive=false; b.hitWall.shatterTimer=40; }
        S.shakeFrames=5;
      }
    }
    // End fire phase 4 frames after bullet stops
    if(b.done && S.rifleTimer>=4){
      S.rifleState='reload';
      S.rifleTimer=0;
      S.rifleShot++;
    }
  } else if(S.rifleState==='reload'){
    if(S.rifleTimer>=RELOAD){
      if(S.rifleShot>=3){
        // Done — back to player turn
        S.riflePhase=false;
        S.rifleBullet=null;
        S.rifleWalls=[];
        S.gravity=false; S.vy=0;
        S.zones=[];
        S.turn='player';
        S.actionLocked=false;
        elMenu.style.display='';
        say('What will you do?');
        S.inSub=false;S.subIdx=0;highlightMain();buildSub(S.selAction);
      } else {
        // Next shot
        S.rifleState='aim';
        S.rifleTimer=0;
        S.rifleAimAngle=_rifleAngleToPlayer();
        const msgs=['Shot 2 incoming. Move!','Last shot. Stay covered!'];
        say(msgs[S.rifleShot-1]||'');
      }
    }
  }
}
