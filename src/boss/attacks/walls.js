// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 4985-5088
// (── WALLS ATTACK ── header comment through the end of function
// updateWalls()). Logic only.
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { say, updateHP, highlightMain, buildSub } from '../../ui/menu.js';
import { loseGame } from '../../ui/overlay.js';
import { elMenu } from '../../core/canvasRefs.js';

// ── WALLS ATTACK ──────────────────────────────────
// Two red walls close in from both sides, leaving a 3x-player-wide safe lane.
// Once closed, the lane slides left/right — player must stay inside.
// Touching either wall deals damage.

export const WALL_LANE_W = 54; // safe lane width (1.5x original 36)

export function beginWalls(){
  if(S.wallsPhase || S.attack!=='walls') return;
  S.wallsPhase=true;
  S.wallsTimer=0;
  // Walls start at arena edges
  S.wallsLeft=AM;           // right edge of left wall
  S.wallsRight=ARENA_W-AM;  // left edge of right wall
  // Target lane center starts in the middle
  S.wallsLaneCenter=ARENA_W/2;
  S.wallsClosed=false;
  S.wallsMoveDir=0; // direction of lane sliding (-1 left, +1 right)
  S.wallsMoveSpeed=0;
  S.wallsPauseTimer=0;
  // Player starts in center
  S.px=ARENA_W/2;
  S.py=ARENA_H/2;
  S.gravity=false;
  say('Stay in the gap.');
}

export function updateWalls(){
  if(!S.wallsPhase) return;
  S.wallsTimer++;
  const t=S.wallsTimer;
  const IW=ARENA_W-AM*2;
  const IH=ARENA_H-AM*2;

  // Phase 1 (0-90f): walls close in to form the lane
  if(!S.wallsClosed){
    const closeDur=90;
    const prog=Math.min(1, t/closeDur);
    // Target positions: leave WALL_LANE_W gap around center
    const targetLeft = S.wallsLaneCenter - WALL_LANE_W/2;
    const targetRight= S.wallsLaneCenter + WALL_LANE_W/2;
    S.wallsLeft = AM + (targetLeft-AM)*prog;
    S.wallsRight= (ARENA_W-AM) - ((ARENA_W-AM-targetRight)*prog);
    if(t>=closeDur){
      S.wallsClosed=true;
      S.wallsLeft=targetLeft;
      S.wallsRight=targetRight;
      // Pick random initial slide direction
      S.wallsMoveDir=(Math.random()<0.5)?1:-1;
      S.wallsMoveSpeed=0.6;
    }
  } else {
    // Phase 2: lane slides. Track pause between direction changes.
    S.wallsPauseTimer=(S.wallsPauseTimer||0);
    if(S.wallsPauseTimer>0){
      S.wallsPauseTimer--;
      // Paused — don't move
    } else {
      const newCenter=S.wallsLaneCenter + S.wallsMoveDir*S.wallsMoveSpeed;
      const minC=AM+WALL_LANE_W/2, maxC=ARENA_W-AM-WALL_LANE_W/2;
      S.wallsLaneCenter=Math.max(minC, Math.min(maxC, newCenter));
      // Bounce/direction flip with pause (boundary takes priority over scheduled flip)
      if(S.wallsLaneCenter<=minC || S.wallsLaneCenter>=maxC){
        S.wallsMoveDir*=-1;
        S.wallsPauseTimer=30; // 0.5s pause
        S.wallsMoveSpeed=Math.min(2.5, S.wallsMoveSpeed+0.2);
      } else if((t-90)%90===0 && t>90){
        // Scheduled direction flip every 90 frames
        S.wallsMoveDir*=-1;
        S.wallsPauseTimer=30;
        S.wallsMoveSpeed=Math.min(2.5, S.wallsMoveSpeed+0.2);
      }
    }
    S.wallsLeft = S.wallsLaneCenter - WALL_LANE_W/2;
    S.wallsRight= S.wallsLaneCenter + WALL_LANE_W/2;
  }

  // Player movement: free x/y anywhere in arena (no wall collision, just damage)
  if(!S.gameOver){
    if(S.keys['ArrowLeft']||S.keys['a'])  S.px=Math.max(AM+9,  S.px-3.2);
    if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(ARENA_W-AM-9, S.px+3.2);
    if(S.keys['ArrowUp']||S.keys['w'])    S.py=Math.max(AM+9,  S.py-3.2);
    if(S.keys['ArrowDown']||S.keys['s'])  S.py=Math.min(ARENA_H-AM-9, S.py+3.2);
  }

  // Damage if player is outside the safe lane (touching wall)
  const inDanger= S.px-6 < S.wallsLeft || S.px+6 > S.wallsRight;
  if(inDanger && S.pHitFlash<=0&&S.pSilentFlash<=0){
    S.playerHP=Math.max(0,S.playerHP-3);
    S.pHitFlash=45; updateHP();
    if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;setTimeout(loseGame,500);}
  }

  // End after ~600 frames (10 sec of sliding)
  if(t>=90+480){
    S.wallsPhase=false;
    S.gravity=false; S.vy=0;
    S.zones=[];
    S.turn='player';
    S.actionLocked=false;
    elMenu.style.display='';
    say('What will you do?');
    S.inSub=false;S.subIdx=0;highlightMain();buildSub(S.selAction);
  }
}
