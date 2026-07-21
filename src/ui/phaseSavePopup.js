// Shows a save-code reminder popup every time S.phase changes, so there's
// always a natural checkpoint to save progress. Detected centrally here
// (rather than hooking each of the ~7 individual phase-transition functions
// scattered across cutscenes/*.js and boss/attacks/meditate.js — a
// scattered per-call-site approach is exactly the bug class that's bitten
// this project twice already: a forgotten call site silently missing a
// needed reset) by exporting checkPhaseChange() for core/loop.js to call
// directly at the end of its own per-frame work, rather than this module
// scheduling its own independent requestAnimationFrame loop. That distinction
// matters: an independent rAF loop registered before loop() always checks
// the PREVIOUS frame's S.phase (phase transitions happen deep inside
// loop()'s call chain, in the same synchronous call that also unlocks
// S.turn/actionLocked) — leaving up to a full frame where the player is
// already unlocked but isInputBlocked() still returns false, long enough
// for a spammed keydown/click to slip through. Calling this from inside
// loop() itself makes detection part of the exact same synchronous
// execution as the transition, closing that gap entirely.
import { S } from '../state/gameState.js';
import { encodeSaveCode, AUTOSAVE_KEY } from '../state/saveCode.js';
import { getTotalPlayTimeMs, getDeathCount, getPhaseDeathCounts } from '../state/stats.js';

// Every code generated here is also persisted to localStorage under
// AUTOSAVE_KEY, so ui/autoSavePopup.js can offer it back to the player on
// their next join if they never copied it out manually. Read/write wrapped
// in try/catch — localStorage can throw in private browsing (same
// defensive pattern as state/stats.js).

const popup = document.getElementById('phase-save-popup');
const codeInput = document.getElementById('phase-save-code');
const msg = document.getElementById('phase-save-msg');

// Stop any click inside the popup (backdrop or content) from also bubbling
// to document's cutscene-advance listener (core/input.js) — otherwise
// dismissing this while a cutscene is starting underneath would
// simultaneously advance that cutscene's dialogue.
popup.addEventListener('click', e=>{ e.stopPropagation(); });

function showPhaseSavePopup(){
  codeInput.value = encodeSaveCode({
    phase: Math.min(S.phase, 8),
    items: S.items,
    deathCount: getDeathCount(),
    totalPlayTimeMs: getTotalPlayTimeMs(),
    usedTestGui: S._usedTestGui,
    madMode: S._madMode,
    usedGameSpeed: S._usedGameSpeed,
    phaseDeathCounts: getPhaseDeathCounts(),
  });
  try{ localStorage.setItem(AUTOSAVE_KEY, codeInput.value); }catch(e){}
  msg.textContent = '';
  popup.style.display = 'flex';
}

function closePhaseSavePopup(){
  popup.style.display = 'none';
}

// Same copy pattern/feedback as ui/saveLoad.js's copySaveCode().
function copyPhaseSaveCode(){
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(codeInput.value).then(()=>{
      msg.textContent = 'Copied!'; msg.style.color = '#88ff88';
    }).catch(()=>{
      codeInput.select();
      msg.textContent = 'Select the code above and copy manually.'; msg.style.color = '#ffcc66';
    });
  } else {
    codeInput.select();
    msg.textContent = 'Select the code above and copy manually.'; msg.style.color = '#ffcc66';
  }
}

// Phase 1 is the starting state, not a transition into anything — only pop
// up from phase 2 onward. Re-triggers correctly after resetGame() too,
// since that calls initState() and brings S.phase back to 1.
//
// lastPhase starts null and is only baselined on the first animation frame
// rather than here at module-load time — main.js imports this module's
// side effects BEFORE it calls initState() (see main.js's import order),
// so S.phase would still be undefined this early; baselining against that
// would make the very first frame after initState() runs look like a
// "change" (undefined -> 1) and pop the reminder up before the player has
// done anything.
//
// Phase 9 (reached right after the meditate phase succeeds) is excluded on
// purpose — it's the point of no return straight into the ending cutscene,
// and was already unresumable through the normal save/load flow anyway
// (loadSaveCode() rejects phase>8, encodeSaveCode always clamps to 8 here
// too), so there's nothing meaningful for a code to check-point there.
let lastPhase = null;
export function checkPhaseChange(){
  if(lastPhase===null){
    lastPhase = S.phase;
  } else if(S.phase !== lastPhase){
    lastPhase = S.phase;
    if(S.phase !== 9) showPhaseSavePopup();
  }
}

export { closePhaseSavePopup, copyPhaseSaveCode };
window.closePhaseSavePopup = closePhaseSavePopup;
window.copyPhaseSaveCode = copyPhaseSaveCode;
