// Save/Load popup: encodes the player's current phase/items/deathCount/
// totalPlayTimeMs into a portable code (see ../state/saveCode.js) and lets
// them paste a code back in to restore that state. This exists because the
// game may be hosted somewhere localStorage-only saves feel fragile to players
// (cleared site data, different device) — a code they can copy out is portable.
import { S } from '../state/gameState.js';
import { say, updateHP } from './menu.js';
import { encodeSaveCode, decodeSaveCode, decodeSummaryKey, AUTOSAVE_KEY } from '../state/saveCode.js';
import { getTotalPlayTimeMs, getDeathCount, getPhaseDeathCounts, setStats, resetStats } from '../state/stats.js';
import { refreshStatsDisplay, formatTime } from './statsDisplay.js';
import { jumpToPhase } from './phaseJump.js';
import { elBossMad } from '../core/canvasRefs.js';

const SUMMARY_PHASE_COUNT = 9;

// Shown/hidden alongside #save-menu and #summary-view-modal — see
// ui/inputBlock.js for why the game also needs to check these popups'
// .show state directly for keyboard input, which the backdrop can't block.
function setBackdrop(on){
  document.getElementById('popup-backdrop').style.display = on ? 'block' : 'none';
}

// Regenerates #save-code-output from whatever the current phase/items/stats
// actually are — called when the menu opens, and again after CLEAR KEY
// resets those stats, so the displayed code always matches reality.
function refreshSaveCodeOutput(){
  document.getElementById('save-code-output').value = encodeSaveCode({
    phase: Math.min(S.phase, 8),
    items: S.items,
    deathCount: getDeathCount(),
    totalPlayTimeMs: getTotalPlayTimeMs(),
    usedTestGui: S._usedTestGui,
    madMode: S._madMode,
    phaseDeathCounts: getPhaseDeathCounts(),
  });
}

function toggleSaveMenu(){
  const m=document.getElementById('save-menu');
  if(!m.classList.contains('show')){
    refreshSaveCodeOutput();
    document.getElementById('save-load-msg').textContent = '';
    m.classList.add('show');
    setBackdrop(true);
  } else {
    m.classList.remove('show');
    setBackdrop(false);
  }
}

// Wipes the lifetime stats a save code encodes (total time, deaths,
// per-phase deaths) back to zero and sends the player back to the start of
// phase 1 — a full reset, not just what's displayed in the key. jumpToPhase()
// calls initState() internally, which already zeroes S._usedTestGui/
// S._madMode back to their defaults, so there's no separate flag reset
// needed here (and none should be added before jumpToPhase() runs — see
// applyDecodedSave() above for why setting either flag before a call that
// triggers initState() silently loses it). Also clears the auto-save
// localStorage entry (ui/autoSavePopup.js) — otherwise the next join would
// immediately re-offer the exact progress this button just wiped.
function clearSaveKey(){
  if(!confirm('Are you sure you want to reset your key? This will send you to start')) return;
  resetStats();
  try{ localStorage.removeItem(AUTOSAVE_KEY); }catch(e){}
  jumpToPhase(1, 10);
  say('What will you do?');
  refreshStatsDisplay();
  refreshSaveCodeOutput();
  const msg = document.getElementById('save-load-msg');
  msg.textContent = 'Key reset!';
  msg.style.color = '#88ff88';
}

function copySaveCode(){
  const out = document.getElementById('save-code-output');
  const msg = document.getElementById('save-load-msg');
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(out.value).then(()=>{
      msg.textContent = 'Copied!'; msg.style.color = '#88ff88';
    }).catch(()=>{
      out.select();
      msg.textContent = 'Select the code above and copy manually.'; msg.style.color = '#ffcc66';
    });
  } else {
    out.select();
    msg.textContent = 'Select the code above and copy manually.'; msg.style.color = '#ffcc66';
  }
}

// Fills in the read-only summary-key popup from a decoded
// {phaseTimesMs, totalPlayTimeMs, deathCount} object. Never touches game
// state (S), stats, or the DOM reset that loadSaveCode does below.
function showSummaryPopup(data){
  for(let p=1; p<=SUMMARY_PHASE_COUNT; p++){
    document.getElementById(`summary-phase-${p}`).textContent = formatTime(data.phaseTimesMs[p] || 0);
  }
  document.getElementById('summary-total-time').textContent = formatTime(data.totalPlayTimeMs);
  document.getElementById('summary-deaths').textContent = String(data.deathCount);

  document.getElementById('save-menu').classList.remove('show');
  document.getElementById('summary-view-modal').classList.add('show');
  setBackdrop(true);
}

function toggleSummaryView(){
  const m=document.getElementById('summary-view-modal');
  m.classList.toggle('show');
  setBackdrop(m.classList.contains('show'));
}

// Applies an already-decoded save object (see state/saveCode.js's
// decodeSaveCode — {phase, items, deathCount, totalPlayTimeMs, usedTestGui,
// madMode, phaseDeathCounts}) to the live game: restores lifetime stats,
// jumps gameplay state to the saved phase/items, restores the hidden
// usedTestGui/madMode taint flags (and reapplies the mad-mode HP debuff),
// and prints the "what will you do?" line. Extracted out of loadSaveCode()
// below so ui/autoSavePopup.js's LOAD button can share this exact same
// apply path instead of duplicating it — both are just different UIs for
// getting a decoded save object here.
function applyDecodedSave(data){
  setStats(data.deathCount, data.totalPlayTimeMs, data.phaseDeathCounts);
  refreshStatsDisplay();

  jumpToPhase(data.phase, data.items);
  // jumpToPhase() calls initState(), which resets S._usedTestGui/_madMode to
  // false — restore whatever the loaded code actually carried instead of
  // silently clearing it, so loading a save can't be used to erase that
  // history (or undo the mad-mode HP debuff below).
  S._usedTestGui = data.usedTestGui;
  S._madMode = data.madMode;
  if(data.madMode){
    S.playerMax = 10;
    S.playerHP = Math.min(S.playerHP, 10);
    elBossMad.style.display = 'block';
    updateHP();
  }
  say('Save loaded. What will you do?');
}

function loadSaveCode(){
  const input = document.getElementById('save-code-input');
  const msg = document.getElementById('save-load-msg');
  const data = decodeSaveCode(input.value);
  if(!data || data.phase<1 || data.phase>8 || data.items<0 || data.items>10
     || data.deathCount<0 || data.totalPlayTimeMs<0){
    const summary = decodeSummaryKey(input.value);
    if(summary){
      showSummaryPopup(summary);
      return;
    }
    msg.textContent = 'Invalid code.';
    msg.style.color = '#ff6666';
    return;
  }

  const confirmMsg = `Are you sure? Your current data will be overwrited.\n\n`
    + `Phase: ${data.phase}\n`
    + `Items: ${data.items}\n`
    + `Deaths: ${data.deathCount}\n`
    + `Time: ${formatTime(data.totalPlayTimeMs)}`;
  if(!confirm(confirmMsg)) return;

  applyDecodedSave(data);

  msg.textContent = 'Loaded!';
  msg.style.color = '#88ff88';
  setTimeout(()=>{ document.getElementById('save-menu').classList.remove('show'); setBackdrop(false); }, 900);
}

export { toggleSaveMenu, copySaveCode, clearSaveKey, loadSaveCode, toggleSummaryView, applyDecodedSave };

window.toggleSaveMenu = toggleSaveMenu;
window.copySaveCode = copySaveCode;
window.clearSaveKey = clearSaveKey;
window.loadSaveCode = loadSaveCode;
window.toggleSummaryView = toggleSummaryView;
