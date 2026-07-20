// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 698-745
// (csAdvance, endCutscene, csEnd). CS itself lives in state/cutsceneState.js
// (lines 686-696, extracted in an earlier subtask) — not re-declared here.
import { S } from '../state/gameState.js';
import { CS } from '../state/cutsceneState.js';
import { say, highlightMain, buildSub } from '../ui/menu.js';
import { elBossBg, elCsSkip, elSpeaker, elArena, elMenu, elStats } from '../core/canvasRefs.js';

export function csAdvance(){
  if(!CS.active) return;
  CS.animTick=0;
  if(CS.idx>=CS.lines.length){ csEnd(); return; }
  say(CS.lines[CS.idx]);
  CS.pose=CS.poses[CS.idx]||'idle';
  const spk=CS.speakers[CS.idx]||'narrator';
  const lbl=elSpeaker;
  if(spk==='professor'){
    lbl.style.display='block';
    lbl.style.color='#cc4422';
    lbl.textContent='Professor Oak';
  } else if(spk==='player'){
    lbl.style.display='block';
    lbl.style.color='#88bbff';
    lbl.textContent='You';
  } else {
    lbl.style.display='block';
    lbl.style.color='#666';
    lbl.textContent='* * *';
  }
  if(CS.events && CS.events[CS.idx]) CS.events[CS.idx]();
  CS.idx++;
}

// Shared teardown for all cutscene endings
export function endCutscene(){
  CS.active=false;
  elCsSkip.style.display='none';
  elSpeaker.style.display='none';
  elArena.style.display='';
  elMenu.style.display='';
  elStats.style.display='';
  S.gameOver=false;
}

export function csEnd(){
  if(CS.onEnd){ const fn=CS.onEnd; CS.onEnd=null; CS.events={}; fn(); return; }
  // Guard: if phase is already 8+, don't fall through to the phase-3 default
  if(S.phase>=8){ endCutscene(); CS.events={}; return; }
  endCutscene();
  CS.events={};
  S.phase=3;
  S.items=3;
  // S.turn was already 'player' throughout this cutscene (phase3() is
  // triggered from inside doFight(), before bossAttack() ever runs), so
  // there's no turn flip for loop.js's edge-detection to catch — but
  // doFight() still locked actions at the top, and nothing since has
  // unlocked them. Reset directly, same as every other hand-back point.
  S.actionLocked=false;
  elBossBg.style.background='radial-gradient(ellipse at 50% 95%, #330000 0%, #000 60%)';
  say('...The air goes still. Then he moves.');
  highlightMain(); buildSub('FIGHT');
}

// index.html wires #cs-skip's onclick="csAdvance()" directly — expose on window.
window.csAdvance = csAdvance;
