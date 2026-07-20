// Extracted verbatim (logic only) from "iron_fist_battle_v8 (2).html" lines 2826-2923.
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { say, updateHP } from '../../ui/menu.js';
import { loseGame } from '../../ui/overlay.js';
import { elMenu } from '../../core/canvasRefs.js';
import { beginCorBlocks } from './corBlocks.js';

// ── CORRIDOR MULTI-RICOCHET — 5 balls after corridor ricochet ──
const CMR_BOUNCES = 8;
const CMR_SPEED   = 3.5;
const CMR_R       = 5;

function beginCorMultiRic(){
  if(S.corMultiRicPhase) return;
  S.corMultiRicPhase=true;
  S.corMultiRicTimer=0;
  S.corMultiRicBalls=[];

  // 5 spawn points spread around arena edges
  const spawnPoints=[
    {x:ARENA_W/2,       y:AM+2},
    {x:ARENA_W/4,       y:AM+2},
    {x:ARENA_W*3/4,     y:AM+2},
  ];

  for(let i=0;i<3;i++){
    const sp=spawnPoints[i];
    // Aim toward player with slight angle spread
    const spread=(i-2)*0.25;
    const dx=(S.px-sp.x), dy=(S.py-sp.y);
    const len=Math.sqrt(dx*dx+dy*dy)||1;
    const angle=Math.atan2(dy,dx)+spread;
    S.corMultiRicBalls.push({
      x:sp.x, y:sp.y,
      vx:Math.cos(angle)*CMR_SPEED,
      vy:Math.sin(angle)*CMR_SPEED,
      bouncesLeft:CMR_BOUNCES,
      trail:[],
      waitTimer: i*18, // stagger spawn
      state:'wait',
    });
  }
  say('...');
  elMenu.style.display='none';
}

function updateCorMultiRic(){
  if(!S.corMultiRicPhase) return;
  S.corMultiRicTimer++;

  // Free player movement
  if(!S.gameOver){
    if(S.keys['ArrowLeft'] ||S.keys['a']) S.px=Math.max(AM+9,S.px-3.5);
    if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(ARENA_W-AM-9,S.px+3.5);
    if(S.keys['ArrowUp']   ||S.keys['w']) S.py=Math.max(AM+9,S.py-3.5);
    if(S.keys['ArrowDown'] ||S.keys['s']) S.py=Math.min(ARENA_H-AM-9,S.py+3.5);
  }

  let allDone=true;
  for(const b of S.corMultiRicBalls){
    if(b.state==='done') continue;
    allDone=false;

    // Staggered wait
    if(b.state==='wait'){
      b.waitTimer--;
      if(b.waitTimer<=0) b.state='travel';
      continue;
    }

    // Move
    b.x+=b.vx; b.y+=b.vy;
    b.trail.push({x:b.x,y:b.y});
    if(b.trail.length>18) b.trail.shift();

    // Hit player
    if(S.pHitFlash<=0&&S.pSilentFlash<=0){
      const dx=S.px-b.x, dy=S.py-b.y;
      if(Math.sqrt(dx*dx+dy*dy)<CMR_R+6){
        S.playerHP=Math.max(0,S.playerHP-3);
        S.pHitFlash=30; updateHP();
        if(S.playerHP<=0&&!S.gameOver){
          S.gameOver=true; S.corMultiRicPhase=false;
          setTimeout(loseGame,500);
        }
      }
    }

    // Bounce
    let hitX=false,hitY=false;
    if(b.x<=AM+CMR_R){b.x=AM+CMR_R;hitX=true;}
    else if(b.x>=ARENA_W-AM-CMR_R){b.x=ARENA_W-AM-CMR_R;hitX=true;}
    if(b.y<=AM+CMR_R){b.y=AM+CMR_R;hitY=true;}
    else if(b.y>=ARENA_H-AM-CMR_R){b.y=ARENA_H-AM-CMR_R;hitY=true;}
    if(hitX){b.vx=-b.vx;b.bouncesLeft--;b.trail=[];S.shakeFrames=3;}
    if(hitY){b.vy=-b.vy;if(!hitX){b.bouncesLeft--;b.trail=[];}S.shakeFrames=3;}
    if(b.bouncesLeft<=0) b.state='done';
  }

  if(allDone){
    S.corMultiRicPhase=false;
    S.corMultiRicBalls=[];
    beginCorBlocks();
  }
}

export { CMR_BOUNCES, CMR_SPEED, CMR_R, beginCorMultiRic, updateCorMultiRic };
