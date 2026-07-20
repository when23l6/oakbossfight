// Extracted verbatim (logic only) from "iron_fist_battle_v8 (2).html" lines 2448-2823.
// Original updateCorridor() exceeded the 300-line file limit, so its 'squeeze' and
// 'ricochet' sub-phases were split into corridorVariants.js and are re-exported below
// so `import ... from './corridor.js'` still exposes everything for consumers.
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { say, updateHP } from '../../ui/menu.js';
import { loseGame } from '../../ui/overlay.js';
import { elMenu } from '../../core/canvasRefs.js';
import { _updateCorridorSqueeze, _updateCorridorRicochet } from './corridorVariants.js';

// ── CORRIDOR ATTACK ───────────────────────────────
// Single 2D world. Player position = (corWorldX, corWorldY). Camera tracks both axes.
// The vertical corridor is at x = ARENA_W/2 (fixed). The horizontal hall branches at
// worldY = COR_WORLD_H/2. No teleporting — same map throughout.
//
// Phases:
//   'up'    — rise to ceiling (dropper clone), corWorldX locked to corridor center
//   'fall'  — fall back down, corWorldX locked
//   'pause' — midair stop at worldY=WORLD_H/2 for ~40 frames, wall opens
//   'right' — gravity pulls right, corWorldY locked at midpoint
//   'left'  — gravity pulls left, corWorldY locked, exit left wall → end

const COR_LANE_W  = 108;
const COR_WORLD_H = 600;
const COR_LANE_H  = 108;
const COR_WORLD_W = 600;
const COR_MID_Y   = COR_WORLD_H / 2; // world Y where hall branches off

function beginCorridor(){
  if(S.corridorPhase) return;
  S.corridorPhase=true;
  S.corridorTimer=0;
  S.corPhase='up';
  S.gravity=false; S.vy=0;

  // Single world position
  S.corWorldX = ARENA_W/2;       // locked to corridor center X during vertical
  S.corWorldY = COR_WORLD_H-9;   // start at bottom
  S.corVx=0; S.corVy=0;
  S.corCamX=0;
  S.corCamY=COR_WORLD_H-(ARENA_H-AM*2);
  S.corCeilingHit=false;
  S.corPurpleGone=false;
  S.corPauseTimer=0;

  const laneL=ARENA_W/2-COR_LANE_W/2;
  S.px=ARENA_W/2;
  S.py=ARENA_H-AM-9;

  // Vertical boxes (world Y positions)
  S.corVBoxes=[];
  const segH=COR_WORLD_H/5;
  for(let i=0;i<4;i++){
    const wy=segH*(i+0.5)+Math.random()*segH*0.4-segH*0.2;
    const onLeft=i%2===0;
    const bx=onLeft?laneL:laneL+COR_LANE_W-55;
    S.corVBoxes.push({x:bx, wy:Math.max(15,Math.min(COR_WORLD_H-15,wy)), w:55, h:10});
  }

  // Horizontal boxes (world X positions, fixed screen Y in hall)
  // Hall Y = screen center (since camera Y will lock to midpoint)
  const hallScreenT=ARENA_H/2-COR_LANE_H/2;
  const hallScreenB=ARENA_H/2+COR_LANE_H/2;
  S.corHBoxes=[];
  const segW=COR_WORLD_W/5;
  for(let i=0;i<4;i++){
    const wx=segW*(i+0.5)+Math.random()*segW*0.4-segW*0.2;
    const onTop=i%2===0;
    const by=onTop?hallScreenT:hallScreenB-50;
    S.corHBoxes.push({wx:Math.max(15,Math.min(COR_WORLD_W-15,wx)), screenY:by, w:10, h:50});
  }

  say('Find a way through.');
  elMenu.style.display='none';
}

function _corDmg(){ if(S.pHitFlash<=0&&S.pSilentFlash<=0){S.playerHP=Math.max(0,S.playerHP-3);S.pHitFlash=30;updateHP();if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.corridorPhase=false;setTimeout(loseGame,500);}}}

function updateCorridor(){
  if(!S.corridorPhase) return;
  S.corridorTimer++;
  const t=S.corridorTimer;
  const IW=ARENA_W-AM*2, IH=ARENA_H-AM*2;
  const laneL=ARENA_W/2-COR_LANE_W/2;
  const laneR=ARENA_W/2+COR_LANE_W/2;
  // Hall screen lane (centered vertically — camera Y will be locked at midpoint)
  const hallScreenT=ARENA_H/2-COR_LANE_H/2;
  const hallScreenB=ARENA_H/2+COR_LANE_H/2;

  // ── Shared camera update ──
  // During vertical phases: camX=0 (corridor fixed on screen), camY follows Y
  // During horizontal phases: camX follows X, camY locked so midpoint = screen center
  if(S.corPhase==='up'||S.corPhase==='fall'||S.corPhase==='pause'){
    S.corCamX=0;
    const camTarget=S.corWorldY-IH/2;
    S.corCamY=Math.max(0,Math.min(COR_WORLD_H-IH,camTarget));
  } else {
    // Horizontal: lock camera Y so COR_MID_Y maps to screen center
    S.corCamY=COR_MID_Y-IH/2;
    const camTargetX=S.corWorldX-IW/2;
    S.corCamX=Math.max(0,Math.min(COR_WORLD_W-IW,camTargetX));
  }
  S.px=(S.corWorldX-S.corCamX)+AM;
  S.py=(S.corWorldY-S.corCamY)+AM;

  // ── PHASE up ──
  if(S.corPhase==='up'){
    if(t===30){ S.corVy=0; say('Up.'); }
    if(t>=30) S.corVy-=0.06;
    if(!S.gameOver){
      if(S.keys['ArrowLeft']||S.keys['a'])  S.corWorldX=Math.max(laneL+6,S.corWorldX-2.8);
      if(S.keys['ArrowRight']||S.keys['d']) S.corWorldX=Math.min(laneR-6,S.corWorldX+2.8);
    }
    S.corWorldX=Math.max(laneL+6,Math.min(laneR-6,S.corWorldX));
    S.corWorldY+=S.corVy;
    if(S.corWorldY<=9){S.corWorldY=9;S.corVy=0;}
    if(S.corWorldY<=10&&t>60&&!S.corCeilingHit){
      S.corCeilingHit=true;S.corVy=0;S.corPhase='fall';say('Now fall.');
    }
    for(const b of S.corVBoxes){
      const bsy=(b.wy-S.corCamY)+AM;
      if(S.px+6>b.x&&S.px-6<b.x+b.w&&S.py+6>bsy&&S.py-6<bsy+b.h) _corDmg();
    }
    if(S.px-6<laneL||S.px+6>laneR) _corDmg();
    return;
  }

  // ── PHASE fall ──
  if(S.corPhase==='fall'){
    S.corVy+=0.07;
    if(!S.gameOver){
      if(S.keys['ArrowLeft']||S.keys['a'])  S.corWorldX=Math.max(laneL+6,S.corWorldX-2.8);
      if(S.keys['ArrowRight']||S.keys['d']) S.corWorldX=Math.min(laneR-6,S.corWorldX+2.8);
    }
    S.corWorldX=Math.max(laneL+6,Math.min(laneR-6,S.corWorldX));
    S.corWorldY+=S.corVy;
    // Hit midpoint → pause mid-air
    if(S.corWorldY>=COR_MID_Y&&!S.corPurpleGone){
      S.corWorldY=COR_MID_Y;
      S.corVy=0;
      S.corPhase='pause';
      S.corPauseTimer=0;
      S.shakeFrames=8;
      say('...');
    }
    if(S.corWorldY>=COR_WORLD_H-9){S.corWorldY=COR_WORLD_H-9;S.corVy=0;}
    for(const b of S.corVBoxes){
      const bsy=(b.wy-S.corCamY)+AM;
      if(S.px+6>b.x&&S.px-6<b.x+b.w&&S.py+6>bsy&&S.py-6<bsy+b.h) _corDmg();
    }
    if(S.px-6<laneL||S.px+6>laneR) _corDmg();
    return;
  }

  // ── PHASE pause — player hangs mid-air, wall opens, then gravity kicks right ──
  if(S.corPhase==='pause'){
    S.corPauseTimer++;
    // After 40 frames: open wall, start rightward gravity
    if(S.corPauseTimer>=40){
      S.corPurpleGone=true;
      S.corPhase='right';
      S.corVx=0;
      say('Now right.');
      S.shakeFrames=5;
    }
    return;
  }

  // ── PHASE right ──
  if(S.corPhase==='right'){
    S.corVx+=0.06;
    if(!S.gameOver){
      if(S.keys['ArrowUp']  ||S.keys['w']) S.corWorldY=Math.max(COR_MID_Y-COR_LANE_H/2+6,S.corWorldY-2.8);
      if(S.keys['ArrowDown']||S.keys['s']) S.corWorldY=Math.min(COR_MID_Y+COR_LANE_H/2-6,S.corWorldY+2.8);
    }
    S.corWorldY=Math.max(COR_MID_Y-COR_LANE_H/2+6,Math.min(COR_MID_Y+COR_LANE_H/2-6,S.corWorldY));
    S.corWorldX+=S.corVx;
    if(S.corWorldX>=COR_WORLD_W-9){S.corWorldX=COR_WORLD_W-9;S.corVx=0;S.corPhase='left';say('Back.');S.shakeFrames=4;}
    for(const b of S.corHBoxes){
      const bsx=(b.wx-S.corCamX)+AM;
      if(S.px+6>bsx&&S.px-6<bsx+b.w&&S.py+6>b.screenY&&S.py-6<b.screenY+b.h) _corDmg();
    }
    if(S.py-6<hallScreenT||S.py+6>hallScreenB) _corDmg();
    return;
  }

  // ── PHASE left — gravity pulls left, hits left wall → chase phase ──
  if(S.corPhase==='left'){
    S.corVx-=0.06;
    if(!S.gameOver){
      if(S.keys['ArrowUp']  ||S.keys['w']) S.corWorldY=Math.max(COR_MID_Y-COR_LANE_H/2+6,S.corWorldY-2.8);
      if(S.keys['ArrowDown']||S.keys['s']) S.corWorldY=Math.min(COR_MID_Y+COR_LANE_H/2-6,S.corWorldY+2.8);
    }
    S.corWorldY=Math.max(COR_MID_Y-COR_LANE_H/2+6,Math.min(COR_MID_Y+COR_LANE_H/2-6,S.corWorldY));
    S.corWorldX+=S.corVx;
    if(S.corWorldX<=9){
      S.corWorldX=9; S.corVx=0;
      S.corPhase='chase';
      S.corChaseWallX=9;
      S.corChaseDelay=60; // 1 second delay before wall moves
      say('Go back.');
      S.shakeFrames=6;
    }
    for(const b of S.corHBoxes){
      const bsx=(b.wx-S.corCamX)+AM;
      if(S.px+6>bsx&&S.px-6<bsx+b.w&&S.py+6>b.screenY&&S.py-6<b.screenY+b.h) _corDmg();
    }
    if(S.py-6<hallScreenT||S.py+6>hallScreenB) _corDmg();
    return;
  }

  // ── PHASE chase — free movement, left wall chases player rightward ──
  if(S.corPhase==='chase'){
    // Chase wall accelerates rightward after delay
    if(S.corChaseDelay>0){ S.corChaseDelay--; }
    else { S.corChaseWallX=(S.corChaseWallX||9)+3.5; }

    if(!S.gameOver){
      if(S.keys['ArrowLeft'] ||S.keys['a']) S.corWorldX=Math.max(S.corChaseDelay?9:S.corChaseWallX+6, S.corWorldX-3.2);
      if(S.keys['ArrowRight']||S.keys['d']) S.corWorldX=Math.min(COR_WORLD_W-9, S.corWorldX+3.2);
      if(S.keys['ArrowUp']   ||S.keys['w']) S.corWorldY=Math.max(COR_MID_Y-COR_LANE_H/2+6, S.corWorldY-3.2);
      if(S.keys['ArrowDown'] ||S.keys['s']) S.corWorldY=Math.min(COR_MID_Y+COR_LANE_H/2-6, S.corWorldY+3.2);
    }
    S.corWorldY=Math.max(COR_MID_Y-COR_LANE_H/2+6,Math.min(COR_MID_Y+COR_LANE_H/2-6,S.corWorldY));

    // Camera follows player X
    const camTargetX=S.corWorldX-IW/2;
    S.corCamX=Math.max(0,Math.min(COR_WORLD_W-IW,camTargetX));
    S.corCamY=COR_MID_Y-IH/2;
    S.px=(S.corWorldX-S.corCamX)+AM;
    S.py=(S.corWorldY-S.corCamY)+AM;

    // Chase wall hits player (only after delay)
    if(!S.corChaseDelay){
      const chaseScreenX=(S.corChaseWallX-S.corCamX)+AM;
      if(S.px-6<=chaseScreenX && S.pHitFlash<=0&&S.pSilentFlash<=0) _corDmg();
    }

    // Hall wall damage
    if((S.py-6<hallScreenT||S.py+6>hallScreenB)&&S.pHitFlash<=0&&S.pSilentFlash<=0) _corDmg();

    // Box collision
    for(const b of S.corHBoxes){
      const bsx=(b.wx-S.corCamX)+AM;
      if(S.px+6>bsx&&S.px-6<bsx+b.w&&S.py+6>b.screenY&&S.py-6<b.screenY+b.h) _corDmg();
    }

    // End: player touches right wall → all 4 walls close to center box
    if(S.corWorldX>=COR_WORLD_W-9){
      S.corWorldX=COR_WORLD_W-9;
      S.corPhase='squeeze';
      S.corSqueezeDelay=50;
      S.corSqueezeCamX=S.corCamX;
      const hallCY=(hallScreenT+hallScreenB)/2;
      const half=18; // 3x player (player=12px diameter)
      // Left wall target in world coords → screen = corSqueezeCamX + (ARENA_W/2-half) - AM + AM = ...
      // screen position of left wall = (worldX - corSqueezeCamX) + AM = ARENA_W/2-half
      // so worldX = corSqueezeCamX + ARENA_W/2 - half
      S.corSqLWorldX=S.corSqueezeCamX+(ARENA_W/2-half);
      S.corSqTgt={ L:ARENA_W/2-half, R:ARENA_W/2+half, T:hallCY-half, B:hallCY+half };
      S.corSqR=ARENA_W-AM;
      S.corSqT=AM;
      S.corSqB=ARENA_H-AM;
      S.corHBoxes=[];
      S.shakeFrames=8;
      say('...');
    }
    return;
  }

  // ── PHASE squeeze / ricochet — see corridorVariants.js ──
  if(S.corPhase==='squeeze') return _updateCorridorSqueeze(IH, hallScreenT, hallScreenB);
  if(S.corPhase==='ricochet') return _updateCorridorRicochet(hallScreenT, hallScreenB);
}

export { COR_LANE_W, COR_WORLD_H, COR_LANE_H, COR_WORLD_W, COR_MID_Y, beginCorridor, _corDmg, updateCorridor, _updateCorridorSqueeze, _updateCorridorRicochet };
