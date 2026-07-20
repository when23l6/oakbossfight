// Shared "jump to the start of phase N" logic — used both when loading a
// resumable save code (ui/saveLoad.js) and by the hidden dev phase-jump GUI
// (ui/secretTestGui.js). Full DOM + state reset, same set resetGame() uses,
// so jumping mid-cutscene or mid-phase-8-horror doesn't leave stale UI
// state behind.
import { S, initState } from '../state/gameState.js';
import { CS } from '../state/cutsceneState.js';
import { elBossBg, elOverlay, elArena, elMenu, elStats, elCsSkip, elSpeaker, elBossMad } from '../core/canvasRefs.js';
import { updateHP, highlightMain, buildSub } from './menu.js';

// Boss HP at the start of each phase — mirrors the values used by the
// phase 2+ respawn checkpoint in ui/overlay.js. Phase 9 has no meaningful
// "starting HP" of its own — doFight()'s phase>=9 branch forces it to 0 the
// moment FIGHT is pressed regardless — so it's handled as a special case
// below instead of belonging in this table.
export const PHASE_START_HP = {1:300, 2:250, 3:200, 4:150, 5:100, 6:50, 7:25, 8:1};

export function jumpToPhase(phase, items){
  elOverlay.classList.remove('show');
  elBossBg.style.background='';
  CS.active=false;
  document.getElementById('battle-box').classList.remove('phase8-horror');
  const dlg=document.getElementById('dialogue');
  dlg.style.cursor=''; dlg.onclick=null;
  elCsSkip.style.display='none';
  elSpeaker.style.display='none';
  elArena.style.display='';
  elMenu.style.display='';
  elStats.style.display='';
  elBossMad.style.display='none';

  initState();
  S.phase = phase;
  S.items = items;
  S.bossHP = phase>=9 ? 0 : PHASE_START_HP[phase];
  if(phase>=5) S.bossBandaged=true;
  if(phase>=7) S.bossCoilOpen=true;
  if(phase>=8){ S.bossHorror=true; S.bossOld=true; S.bossBloodDrip=true; }
  S.turn='player';
  updateHP();
  highlightMain(); buildSub('FIGHT');
}
