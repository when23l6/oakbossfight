// Offers to resume from an auto-persisted save code on page load. Every
// time ui/phaseSavePopup.js's showPhaseSavePopup() generates a save code
// (on every S.phase change), it also writes that same code string to
// localStorage under AUTOSAVE_KEY. checkAutoSave() checks for that and, if
// present, offers it back to the player — useful if they closed the tab
// without copying the code out of the phase-save reminder manually.
//
// checkAutoSave() is exported rather than run immediately at module load —
// it's called from ui/modeSelect.js's chooseMode(), AFTER the player
// dismisses the "COMPUTER/PHONE" gate (#mode-select), not before. That gate
// sits at z-index 1000, above this popup's 650, and shows unconditionally
// on every page load — running the check earlier would show this popup
// correctly but leave it stuck invisible underneath the gate until
// dismissed, entirely dependent on z-index stacking behaving identically
// across every browser/device for a feature where a failed render is
// unrecoverable (the localStorage copy is already deleted by then).
// Triggering it from chooseMode() instead means it always shows into a
// scene that's already clear.
//
// The stored code is deleted from localStorage the instant it's found
// (delete-on-show), regardless of what the player does with it afterward —
// COPY/LOAD/CLOSE below all operate on the in-memory copy captured before
// the delete, per the finalized design.
import { decodeSaveCode } from '../state/saveCode.js';
import { formatTime } from './statsDisplay.js';
import { applyDecodedSave } from './saveLoad.js';

const AUTOSAVE_KEY = 'ironFistBattle_autosave';

const popup = document.getElementById('auto-save-popup');
const codeInput = document.getElementById('auto-save-code');
const msg = document.getElementById('auto-save-msg');

// Same click-swallowing as ui/phaseSavePopup.js's popup — stops a click
// here from also bubbling to document's cutscene-advance listener
// (core/input.js).
popup.addEventListener('click', e=>{ e.stopPropagation(); });

// The decoded save this popup is currently offering, kept in memory since
// the localStorage copy is deleted as soon as it's read. Null once no offer
// is pending (nothing to LOAD).
let pendingData = null;

function checkAutoSave(){
  let raw = null;
  try{
    raw = localStorage.getItem(AUTOSAVE_KEY);
    if(raw != null) localStorage.removeItem(AUTOSAVE_KEY);
  }catch(e){
    return;
  }
  if(!raw) return;

  const data = decodeSaveCode(raw);
  if(!data) return; // corrupted/tampered value — discard silently, no popup

  pendingData = data;
  codeInput.value = raw;
  document.getElementById('auto-save-phase').textContent = String(data.phase);
  document.getElementById('auto-save-items').textContent = String(data.items);
  document.getElementById('auto-save-deaths').textContent = String(data.deathCount);
  document.getElementById('auto-save-time').textContent = formatTime(data.totalPlayTimeMs);
  msg.textContent = '';
  popup.style.display = 'flex';
}

function closeAutoSavePopup(){
  popup.style.display = 'none';
}

// Same copy pattern/feedback as ui/phaseSavePopup.js's copyPhaseSaveCode()
// and ui/saveLoad.js's copySaveCode().
function copyAutoSaveCode(){
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

function loadAutoSave(){
  if(!pendingData) return;
  applyDecodedSave(pendingData);
  closeAutoSavePopup();
}

export { checkAutoSave, closeAutoSavePopup, copyAutoSaveCode, loadAutoSave };
window.closeAutoSavePopup = closeAutoSavePopup;
window.copyAutoSaveCode = copyAutoSaveCode;
window.loadAutoSave = loadAutoSave;
