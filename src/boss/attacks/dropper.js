// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 4864-4983
// (── DROPPER ATTACK ── header comment through the end of function
// updateDropper()). Logic only.
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { say, updateHP, highlightMain, buildSub } from '../../ui/menu.js';
import { loseGame } from '../../ui/overlay.js';
import { elMenu } from '../../core/canvasRefs.js';

// ── DROPPER ATTACK ────────────────────────────────
// A narrow vertical lane in the center (3x player wide).
// Two solid wall hitboxes flank it. Gravity inverts — player floats UP.
// Hitboxes spawn at the top and fall down through the lane.
// Player dodges left/right within the lane only.
// After reaching ceiling, gravity flips back, player falls out.

export const LANE_W = 108; // 3x the original 36 (itself 3x player width)

export const DROPPER_TOTAL_H = 600; // total world height of the lane (3x arena)

export function beginDropper(){
  if(!S.dropperPhase && S.attack==='dropper'){
    S.dropperPhase=true;
    S.dropperTimer=0;
    S.dropperBoxes=[];
    S.dropperSpawnCount=0;
    S.dropperFlipped=false;
    S.dropperDone=false;
    // World coords: player starts at bottom (worldY = DROPPER_TOTAL_H - 9)
    S.px=ARENA_W/2;
    S.dropperWorldY=DROPPER_TOTAL_H-9; // player world y position
    S.dropperCamY=DROPPER_TOTAL_H-(ARENA_H-AM*2); // camera top in world coords
    S.py=ARENA_H-AM-9; // screen y (derived from world each frame)
    S.vy=0;
    S.gravity=false;
    // Spawn 4 boxes spread across the world height
    const lL=ARENA_W/2-LANE_W/2;
    const sboxW=55, sboxH=10;
    const segH=DROPPER_TOTAL_H/5;
    for(let i=0;i<4;i++){
      const wy=segH*(i+0.5)+Math.random()*segH*0.4-segH*0.2;
      // Alternate left/right wall
      const onLeft=i%2===0;
      const bx=onLeft ? lL : lL+LANE_W-sboxW;
      S.dropperBoxes.push({
        x:bx,
        wy:Math.max(sboxH+5, Math.min(DROPPER_TOTAL_H-sboxH-5, wy)),
        w:sboxW, h:sboxH,
        active:true, done:false
      });
    }
  }
}

export function updateDropper(){
  if(!S.dropperPhase) return;
  S.dropperTimer++;
  const t=S.dropperTimer;
  const IW=ARENA_W-AM*2, IH=ARENA_H-AM*2;
  const laneL=ARENA_W/2-LANE_W/2;
  const laneR=ARENA_W/2+LANE_W/2;

  // Invert gravity after brief pause
  if(t===30){ S.dropperFlipped=true; S.vy=0; say('Up.'); }

  // Gravity (world coords — positive = downward)
  const grav = S.dropperFlipped ? -0.06 : 0.07;
  S.vy = (S.vy||0) + grav;

  // Left/right clamped to lane
  if(!S.gameOver){
    if(S.keys['ArrowLeft']||S.keys['a'])  S.px=Math.max(laneL+6, S.px-2.8);
    if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(laneR-6, S.px+2.8);
  }
  S.px=Math.max(laneL+6, Math.min(laneR-6, S.px));

  // Move player in world coords
  S.dropperWorldY = (S.dropperWorldY||0) + S.vy;

  if(S.dropperFlipped){
    // Ceiling = world y 0
    if(S.dropperWorldY<=9){ S.dropperWorldY=9; S.vy=0; }
    if(S.dropperWorldY<=10 && t>60 && !S.dropperDone){
      S.dropperDone=true; S.dropperFlipped=false; S.vy=0;
      say('Now fall.');
    }
  } else {
    // Floor = DROPPER_TOTAL_H - 9
    const floor=DROPPER_TOTAL_H-9;
    if(S.dropperWorldY>=floor){ S.dropperWorldY=floor; S.vy=0; }
    if(S.dropperDone && S.dropperWorldY>=floor-2){
      S.dropperPhase=false; S.dropperBoxes=[]; S.zones=[];
      S.gravity=false; S.vy=0;
      S.turn='player';
      S.actionLocked=false;
      elMenu.style.display='';
      say('What will you do?');
      S.inSub=false;S.subIdx=0;highlightMain();buildSub(S.selAction);
      return;
    }
  }

  // Camera: center on player world y, clamped so it doesn't go beyond lane
  const camTarget = S.dropperWorldY - IH/2;
  S.dropperCamY = Math.max(0, Math.min(DROPPER_TOTAL_H-IH, camTarget));

  // Screen y = world y - camY (then offset by AM)
  S.py = (S.dropperWorldY - S.dropperCamY) + AM;

  // Damage: boxes (world coords → screen for collision)
  for(const b of S.dropperBoxes){
    const bScreenY = (b.wy - S.dropperCamY) + AM;
    if(S.px+6>b.x && S.px-6<b.x+b.w && S.py+6>bScreenY && S.py-6<bScreenY+b.h){
      if(S.pHitFlash<=0&&S.pSilentFlash<=0){
        S.playerHP=Math.max(0,S.playerHP-3);
        S.pHitFlash=30; updateHP();
        if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;setTimeout(loseGame,500);}
      }
    }
  }

  // Wall damage
  const inLeftWall  = S.px-6 < laneL;
  const inRightWall = S.px+6 > laneR;
  if((inLeftWall||inRightWall) && S.pHitFlash<=0&&S.pSilentFlash<=0){
    S.playerHP=Math.max(0,S.playerHP-3);
    S.pHitFlash=30; updateHP();
    if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;setTimeout(loseGame,500);}
  }
}
