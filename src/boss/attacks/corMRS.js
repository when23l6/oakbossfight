// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 3823-3966
// (── CORRIDOR MULTI-RIC + SHOCKWAVE ── header comment through the end of
// function updateCorMRS()). Logic only — rendering is handled separately.
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { say, updateHP } from '../../ui/menu.js';
import { loseGame } from '../../ui/overlay.js';
import { elMenu } from '../../core/canvasRefs.js';

// ── CORRIDOR MULTI-RIC + SHOCKWAVE ──────────────────────────────────────
// 3 ricochet balls bounce around the arena.
// Each time a ball hits the top or bottom wall, a shockwave fires:
//   bottom hit → wave sweeps right→left (wave_lr)
//   top hit    → wave sweeps left→right (wave_rl)
// Player has full free movement (no gravity).
// Ends when all balls exhaust their bounces.

export const CMRS_SPEED    = 3.2;
export const CMRS_LIFETIME = 480; // frames alive (8 sec)
export const CMRS_R        = 10;
export const CMRS_HOME    = 0.04; // homing strength per frame

export const CMRS_AM = 2; // smaller arena margin = bigger playable box

export function beginCorMRS(){
  if(S.corMRSPhase) return;
  S.corMRSPhase=true;
  S.corMRSTimer=0;
  S.corMRSBalls=[];
  S.corMRSCircles=[]; // expanding wall-hit circles
  S.zones=[];
  S.gravity=false; S.vy=0;

  const spawnPoints=[
    {x:ARENA_W/2,    y:AM+2},
    {x:ARENA_W/4,    y:AM+2},
    {x:ARENA_W*3/4,  y:AM+2},
  ];

  for(let i=0;i<3;i++){
    const sp=spawnPoints[i];
    const spread=(i-1)*0.3;
    const dx=S.px-sp.x, dy=S.py-sp.y;
    const len=Math.sqrt(dx*dx+dy*dy)||1;
    const angle=Math.atan2(dy,dx)+spread;
    S.corMRSBalls.push({
      x:sp.x, y:sp.y,
      vx:Math.cos(angle)*CMRS_SPEED,
      vy:Math.sin(angle)*CMRS_SPEED,
      lifeTimer:0,
      trail:[],
      waitTimer:i*20,
      state:'wait',
    });
  }
  say('...');
  elMenu.style.display='none';
}

export function updateCorMRS(){
  if(!S.corMRSPhase) return;
  S.corMRSTimer++;

  // Free movement
  if(!S.gameOver){
    if(S.keys['ArrowLeft'] ||S.keys['a']) S.px=Math.max(AM+9,S.px-3.5);
    if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(ARENA_W-AM-9,S.px+3.5);
    if(S.keys['ArrowUp']   ||S.keys['w']) S.py=Math.max(AM+9,S.py-3.5);
    if(S.keys['ArrowDown'] ||S.keys['s']) S.py=Math.min(ARENA_H-AM-9,S.py+3.5);
  }

  // Update expanding circles
  const MAX_R = Math.min(ARENA_W,ARENA_H)/3; // 1/3 map size
  const CIRCLE_DUR = 90; // 1.5 sec
  S.corMRSCircles=S.corMRSCircles.filter(c=>c.age<CIRCLE_DUR);
  for(const c of S.corMRSCircles){
    c.age++;
    c.r = (c.age/CIRCLE_DUR)*MAX_R;
    // Damage player if inside ring (not center — ring width ~8px)
    const dx=S.px-c.x, dy=S.py-c.y;
    const dist=Math.sqrt(dx*dx+dy*dy)||1;
    const ringOuter=c.r+12, ringInner=c.r-12;
    if(dist<ringOuter&&dist>ringInner&&S.pHitFlash<=0&&S.pSilentFlash<=0){
      S.playerHP=Math.max(0,S.playerHP-2); S.pHitFlash=30; updateHP();
      if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.corMRSPhase=false;setTimeout(loseGame,500);}
    }
  }

  let allDone=true;
  for(const b of S.corMRSBalls){
    if(b.state==='done') continue;
    allDone=false;

    if(b.state==='wait'){
      b.waitTimer--;
      if(b.waitTimer<=0) b.state='travel';
      continue;
    }

    // Homing — steer toward player each frame
    const hdx=S.px-b.x, hdy=S.py-b.y;
    const hlen=Math.sqrt(hdx*hdx+hdy*hdy)||1;
    b.vx+=( hdx/hlen)*CMRS_HOME;
    b.vy+=(hdy/hlen)*CMRS_HOME;
    // Cap speed
    const spd=Math.sqrt(b.vx*b.vx+b.vy*b.vy);
    if(spd>CMRS_SPEED*1.5){ b.vx=b.vx/spd*CMRS_SPEED*1.5; b.vy=b.vy/spd*CMRS_SPEED*1.5; }

    b.lifeTimer++;
    if(b.lifeTimer>=CMRS_LIFETIME){ b.state='done'; continue; }

    b.x+=b.vx; b.y+=b.vy;
    b.trail.push({x:b.x,y:b.y});
    if(b.trail.length>18) b.trail.shift();

    // Hit player
    if(S.pHitFlash<=0&&S.pSilentFlash<=0){
      const dx=S.px-b.x, dy=S.py-b.y;
      if(Math.sqrt(dx*dx+dy*dy)<CMRS_R+6){
        S.playerHP=Math.max(0,S.playerHP-2); S.pHitFlash=30; updateHP();
        if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.corMRSPhase=false;setTimeout(loseGame,500);}
      }
    }

    // Bounce off walls — re-aim at player + spawn expanding circle
    let hitX=false, hitY=false;
    if(b.x<=AM+CMRS_R){              b.x=AM+CMRS_R;              hitX=true; }
    else if(b.x>=ARENA_W-AM-CMRS_R){ b.x=ARENA_W-AM-CMRS_R;     hitX=true; }
    if(b.y<=AM+CMRS_R){              b.y=AM+CMRS_R;              hitY=true; }
    else if(b.y>=ARENA_H-AM-CMRS_R){ b.y=ARENA_H-AM-CMRS_R;     hitY=true; }

    if(hitX||hitY){
      if(hitX) b.vx=-b.vx;
      if(hitY) b.vy=-b.vy;
      b.trail=[];
      S.shakeFrames=3;
      // Re-aim at player after bounce
      const dx=S.px-b.x, dy=S.py-b.y;
      const len=Math.sqrt(dx*dx+dy*dy)||1;
      const angle=Math.atan2(dy,dx)+(Math.random()-0.5)*0.5;
      b.vx=Math.cos(angle)*CMRS_SPEED;
      b.vy=Math.sin(angle)*CMRS_SPEED;
      // Spawn expanding circle at bounce point
      S.corMRSCircles.push({x:b.x, y:b.y, r:0, age:0});
    }
  }

  if(allDone && S.corMRSCircles.length===0){
    S.corMRSPhase=false;
    S.corMRSBalls=[];
    // Softlock — next attack TBD
  }
}
