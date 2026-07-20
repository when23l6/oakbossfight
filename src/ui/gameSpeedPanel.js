// GAMESPEED panel: lets the player set a custom simulation tick rate,
// overriding core/loop.js's default fps-adaptive floor — see that file's
// loop(), which uses state/gameSpeed.js's `enabled` flag to switch from
// "floor at 15/sec, otherwise match render fps" to "hard-target `rate`
// ticks/sec regardless of render fps" once this is turned on.
//
// Opened via a custom, player-assignable keybind on computer (SET below).
// There's no keyboard on phone, so #gamespeed-btn (index.html, phone-mode
// only, same pattern as the layout editor's gear button) opens it there
// instead. Either way it's also reachable from the SAVE menu as a GAMESPEED
// button, so the feature is discoverable before any keybind is ever set.
import { getGameSpeed, setRate, setEnabled, setKeybind, RATE_STEP } from '../state/gameSpeed.js';
import { isInputBlocked } from './inputBlock.js';

const panel = document.getElementById('gamespeed-panel');
const rateText = document.getElementById('gamespeed-rate');
const enabledText = document.getElementById('gamespeed-enabled');
const keybindText = document.getElementById('gamespeed-keybind');

panel.addEventListener('click', e=>{ e.stopPropagation(); });

let panelOpen = false;
// Checked by ui/inputBlock.js so normal game input pauses while the panel
// (including mid-rebind) is open, same as every other popup.
export function isGameSpeedPanelOpen(){ return panelOpen; }

function refresh(){
  const s = getGameSpeed();
  rateText.textContent = String(s.rate);
  enabledText.textContent = s.enabled ? 'ON' : 'OFF';
  if(!rebindWaiting) keybindText.textContent = s.keybind ? s.keybind.toUpperCase() : '(none)';
}

function openPanel(){
  panelOpen = true;
  refresh();
  panel.style.display = 'flex';
}
function closeGameSpeedPanel(){
  panelOpen = false;
  rebindWaiting = false;
  panel.style.display = 'none';
}
function toggleGameSpeedPanel(){
  if(panelOpen){ closeGameSpeedPanel(); return; }
  if(isInputBlocked()) return; // don't open underneath another popup
  openPanel();
}

function incRate(){ setRate(getGameSpeed().rate + RATE_STEP); refresh(); }
function decRate(){ setRate(getGameSpeed().rate - RATE_STEP); refresh(); }
function toggleGameSpeedEnabled(){ setEnabled(!getGameSpeed().enabled); refresh(); }

let rebindWaiting = false;
function startGameSpeedRebind(){
  rebindWaiting = true;
  keybindText.textContent = 'press any key…';
}

// Own dedicated keydown listener rather than folding into core/input.js's
// existing handler — isInputBlocked() (which this panel is now part of)
// already makes that handler bail out entirely whenever this panel is
// open, so there's no conflict during rebind capture. Once the panel is
// closed and a keybind is set, though, that key still does whatever it
// normally does elsewhere too (e.g. picking 'z' would both confirm a menu
// AND toggle this panel) — an accepted tradeoff of giving the player a
// fully unrestricted choice of key; nothing here steers them away from it.
window.addEventListener('keydown', e=>{
  if(document.body.classList.contains('phone-mode')) return;
  if(rebindWaiting){
    setKeybind(e.key);
    rebindWaiting = false;
    refresh();
    return;
  }
  const s = getGameSpeed();
  if(!s.keybind || e.key !== s.keybind) return;
  toggleGameSpeedPanel();
});

export { toggleGameSpeedPanel, closeGameSpeedPanel, incRate, decRate, toggleGameSpeedEnabled, startGameSpeedRebind };
window.toggleGameSpeedPanel = toggleGameSpeedPanel;
window.closeGameSpeedPanel = closeGameSpeedPanel;
window.incRate = incRate;
window.decRate = decRate;
window.toggleGameSpeedEnabled = toggleGameSpeedEnabled;
window.startGameSpeedRebind = startGameSpeedRebind;
