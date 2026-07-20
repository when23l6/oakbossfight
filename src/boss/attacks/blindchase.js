// Extracted verbatim (logic only) from "iron_fist_battle_v8 (2).html" lines 2321-2446.
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { say, updateHP, highlightMain, buildSub } from '../../ui/menu.js';
import { loseGame } from '../../ui/overlay.js';
import { elMenu } from '../../core/canvasRefs.js';
import { beginCompulsion } from './compulsion.js';

// ── BLIND CHASE ATTACK ───────────────────────────
// Screen is completely black the whole time.
// Every 60 frames (1 sec): brief 8-frame flash reveals player + all bullets.
// Every 60 frames: a new homing bullet spawns aimed at player.
// Bullets slowly nudge their velocity toward player each frame (homing).
// 12 bullets total, then attack ends once all clear.

const BC_SPAWN_INTERVAL = 30;  // frames between spawns
const BC_TOTAL          = 10;  // total bullets
const BC_SPEED          = 2.2; // base bullet speed
// Phase 8 uses slower speed
const BC_SPEED_P8       = 1.4;
const BC_HOME_STRENGTH  = 0.06;// how fast bullet steers toward player
const BC_FLASH_DUR      = 16;   // frames of reveal every second
const BC_BULLET_R       = 5;

function beginBlindchase(){
  if(S.blindchasePhase) return;
  S.blindchasePhase=true;
  S.blindchaseTimer=0;
  S.blindchaseBullets=[];
  S.blindchaseFlash=0;
  S._bcSpawnCount=0;
  S._bcInverted=false;
  S._bcInvertFlash=20; // shine blue immediately before attacks start
  S.gravity=false; S.vy=0;
  S.px=ARENA_W/2; S.py=ARENA_H/2;
  say('Darkness.');
  elMenu.style.display='none';
}
function updateBlindchase(){
  if(!S.blindchasePhase) return;
  S.blindchaseTimer++;
  const t=S.blindchaseTimer;

  // ── Invert cycling: every 180 frames toggle invert with a blue flash, after 1 sec delay ──
  const BC_INVERT_CYCLE = 180;
  const BC_INVERT_FLASH_DUR = 20;
  const BC_INVERT_DELAY = 120;
  if(t > BC_INVERT_DELAY && (t - BC_INVERT_DELAY) % BC_INVERT_CYCLE === 1){
    S._bcInverted = !S._bcInverted;
    S._bcInvertFlash = BC_INVERT_FLASH_DUR;
  }
  if(S._bcInvertFlash > 0) S._bcInvertFlash--;

  // Player movement (inverted when _bcInverted)
  const inv = S._bcInverted ? -1 : 1;
  if(!S.gameOver){
    if(S.keys['ArrowLeft']||S.keys['a'])  S.px=Math.max(AM+9, Math.min(ARENA_W-AM-9, S.px - 3.2*inv));
    if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.max(AM+9, Math.min(ARENA_W-AM-9, S.px + 3.2*inv));
    if(S.keys['ArrowUp']||S.keys['w'])    S.py=Math.max(AM+9, Math.min(ARENA_H-AM-9, S.py - 3.2*inv));
    if(S.keys['ArrowDown']||S.keys['s'])  S.py=Math.max(AM+9, Math.min(ARENA_H-AM-9, S.py + 3.2*inv));
  }

  // Every BC_SPAWN_INTERVAL: spawn bullet + trigger flash
  if(t % BC_SPAWN_INTERVAL === 1 && t > 60 && S._bcSpawnCount < BC_TOTAL){
    // Spawn from random arena edge
    const sides=[[ARENA_W/2,AM],[ARENA_W/2,ARENA_H-AM],[AM,ARENA_H/2],[ARENA_W-AM,ARENA_H/2]];
    const [sx,sy]=sides[Math.floor(Math.random()*sides.length)];
    const dx=S.px-sx, dy=S.py-sy;
    const len=Math.sqrt(dx*dx+dy*dy)||1;
    const spawnSpd=S.corBCPullPhase?BC_SPEED_P8:BC_SPEED;
    S.blindchaseBullets.push({
      x:sx, y:sy,
      vx:(dx/len)*spawnSpd,
      vy:(dy/len)*spawnSpd,
      done:false,
      life:0,
    });
    S._bcSpawnCount++;
    S.blindchaseFlash=BC_FLASH_DUR; // flash on spawn
    S.shakeFrames=3;
  }

  // Tick flash
  if(S.blindchaseFlash>0) S.blindchaseFlash--;

  // Move + home bullets
  for(const b of S.blindchaseBullets){
    if(b.done) continue;
    // Nudge velocity toward player
    const dx=S.px-b.x, dy=S.py-b.y;
    const len=Math.sqrt(dx*dx+dy*dy)||1;
    b.vx+=( dx/len)*BC_HOME_STRENGTH;
    b.vy+=(dy/len)*BC_HOME_STRENGTH;
    // Cap speed
    const spd=Math.sqrt(b.vx*b.vx+b.vy*b.vy);
    const capSpd=S.corBCPullPhase?BC_SPEED_P8:BC_SPEED;
    if(spd>capSpd*1.8){ b.vx=b.vx/spd*capSpd*1.8; b.vy=b.vy/spd*capSpd*1.8; }
    b.x+=b.vx; b.y+=b.vy;
    b.life++;
    // Expire after 180 frames or off-screen
    if(b.life>180||b.x<AM-20||b.x>ARENA_W-AM+20||b.y<AM-20||b.y>ARENA_H-AM+20){ b.done=true; continue; }
    // Hit player
    if(S.pHitFlash<=0&&S.pSilentFlash<=0){
      const hdx=S.px-b.x, hdy=S.py-b.y;
      if(Math.sqrt(hdx*hdx+hdy*hdy)<BC_BULLET_R+6){
        b.done=true;
        S.playerHP=Math.max(0,S.playerHP-2);
        S.pHitFlash=30; updateHP();
        S.blindchaseFlash=BC_FLASH_DUR; // flash on hit
        if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.blindchasePhase=false;setTimeout(loseGame,500);}
      }
    }
  }
  S.blindchaseBullets=S.blindchaseBullets.filter(b=>!b.done);

  // End when all spawned and all gone
  if(S._bcSpawnCount>=BC_TOTAL && S.blindchaseBullets.length===0){
    S.blindchasePhase=false;
    S.blindchaseBullets=[];
    S.blindchaseFlash=0;
    S._bcInverted=false;
    S._bcInvertFlash=0;
    S.zones=[];
    if(S.corBCPullPhase){
      S.px=ARENA_W/2; S.py=ARENA_H/2;
      beginCompulsion();
    } else {
      S.turn='player';
      S.actionLocked=false;
      elMenu.style.display='';
      say('What will you do?');
      S.inSub=false;S.subIdx=0;highlightMain();buildSub(S.selAction);
    }
  }
}

export { BC_SPAWN_INTERVAL, BC_TOTAL, BC_SPEED, BC_SPEED_P8, BC_HOME_STRENGTH, BC_FLASH_DUR, BC_BULLET_R, beginBlindchase, updateBlindchase };
