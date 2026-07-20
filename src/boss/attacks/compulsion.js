// Extracted verbatim (logic only) from "iron_fist_battle_v8 (2).html" lines 2197-2319.
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { say, updateHP, highlightMain, buildSub } from '../../ui/menu.js';
import { loseGame } from '../../ui/overlay.js';
import { elMenu } from '../../core/canvasRefs.js';
import { beginHealOrbs } from './healOrbs.js';

// ── COMPULSION ────────────────────────────────────
// A glowing danger zone appears. Player is magnetically pulled toward it.
// 3 pulses — each pulse builds pull strength, then briefly releases.
// Player must hold against the pull to stay out of the kill zone.

const CMP_PULSE_COUNT = 10;
const CMP_PULL_DUR    = 36;  // frames of pull per pulse (3x)
const CMP_RELEASE_DUR = 40;  // brief release between pulses
const CMP_ZONE_R      = 28;  // danger zone radius

function _cmpPickBorder(noBottom){
  // Pick a random point along a random arena wall edge
  const IW=ARENA_W-AM*2, IH=ARENA_H-AM*2;
  let side;
  do { side=Math.floor(Math.random()*4); } while(noBottom && side===1);
  let bx,by;
  if(side===0){ bx=AM+Math.random()*IW; by=AM; }
  else if(side===1){ bx=AM+Math.random()*IW; by=ARENA_H-AM; }
  else if(side===2){ bx=AM; by=AM+Math.random()*IH; }
  else             { bx=ARENA_W-AM; by=AM+Math.random()*IH; }
  S.compulsionZoneX=bx;
  S.compulsionZoneY=by;
  S.compulsionZoneSide=side;
}

function beginCompulsion(){
  if(S.compulsionPhase) return;
  S.compulsionPhase=true;
  S.compulsionTimer=-60;
  S.compulsionPulse=0;
  S.compulsionZoneR=CMP_ZONE_R;
  S._cmpState='release';
  S._cmpLastPulse=0;
  S.pSilentFlash=70; // iframes during entry delay
  say('Something pulls at you...');
  elMenu.style.display='none';
}

function updateCompulsion(){
  if(!S.compulsionPhase) return;
  S.compulsionTimer++;

  if(!S.gameOver){
  if(S.keys['ArrowLeft']||S.keys['a'])  S.px=Math.max(AM+9, S.px-3.2);
  if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(ARENA_W-AM-9, S.px+3.2);
  if(S.keys['ArrowUp']||S.keys['w'])    S.py=Math.max(AM+9, S.py-3.2);
  if(S.keys['ArrowDown']||S.keys['s'])  S.py=Math.min(ARENA_H-AM-9, S.py+3.2);
  }

  const PULL_DUR=CMP_PULL_DUR, REL_DUR=CMP_RELEASE_DUR;
  const cycleLen=PULL_DUR+REL_DUR;

  // Don't do anything during the initial delay (negative timer)
  if(S.compulsionTimer <= 0) return;

  // End check: after 3 full pull phases (skip last release)
  // Pull 3 ends at cycleLen*2 + CMP_PULL_DUR
  const endTimer = cycleLen*(CMP_PULSE_COUNT-1) + CMP_PULL_DUR;
  if(S.compulsionTimer >= endTimer){
    S.compulsionPhase=false;
    S._cmpStun=0;
    S._cmpGlitchFlash=0;
    if(S.corBCPullPhase){
      S.corBCPullPhase=false;
      beginHealOrbs();
    } else {
      S.turn='player';
      S.actionLocked=false;
      elMenu.style.display='';
      say('What will you do?');
      S.inSub=false;S.subIdx=0;highlightMain();buildSub(S.selAction);
    }
    return;
  }

  const cycleT=S.compulsionTimer % cycleLen;
  const prevState=S._cmpState;
  S._cmpState = cycleT < PULL_DUR ? 'pull' : 'release';

  // New pull cycle started — pick a new random border
  if(S._cmpState==='pull' && prevState==='release'){
    _cmpPickBorder();
    S.shakeFrames=6;
    say('It shifts...');
  }

  // (round end moved above)

  // Pull force — increases each pulse
  if(S._cmpState==='pull' && !S.gameOver){
    const pulse=Math.floor(S.compulsionTimer/cycleLen)+1;
    const dx=S.compulsionZoneX-S.px, dy=S.compulsionZoneY-S.py;
    const dist=Math.sqrt(dx*dx+dy*dy)||1;

    // Stun: touched core — pause pull, deal damage, glitch
    if(S._cmpStun>0){
      S._cmpStun--;
      // No pull during stun
    } else {
      const baseStrength=[2.688,3.024,4.032][Math.min(pulse-1,2)];
      const strength=baseStrength*(S.corBCPullPhase?0.75:1);
      if(isFinite(strength) && isFinite(dist)){
        S.px+=(dx/dist)*strength;
        S.py+=(dy/dist)*strength;
        S.px=Math.max(AM+9,Math.min(ARENA_W-AM-9,S.px));
        S.py=Math.max(AM+9,Math.min(ARENA_H-AM-9,S.py));
      }

      // Touch border wall — trigger stun
      const side=S.compulsionZoneSide||0;
      const IW2=ARENA_W-AM*2;
      const touchWall=(side===0&&S.py<=AM+18)||(side===1&&S.py>=ARENA_H-AM-18)||
                      (side===2&&S.px<=AM+18)||(side===3&&S.px>=ARENA_W-AM-18);
      if(touchWall && S.pHitFlash<=0&&S.pSilentFlash<=0){
        S._cmpStun=20; // brief stun, shorter than pull cycle
        S.shakeFrames=14;
        S._cmpGlitchFlash=20;
        S.playerHP=Math.max(0,S.playerHP-3);
        S.pHitFlash=60; updateHP();
        if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.compulsionPhase=false;setTimeout(loseGame,500);}
      }
    }
  }
}

export { CMP_PULSE_COUNT, CMP_PULL_DUR, CMP_RELEASE_DUR, CMP_ZONE_R, _cmpPickBorder, beginCompulsion, updateCompulsion };
