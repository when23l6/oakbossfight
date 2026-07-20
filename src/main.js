// Entry point. Loads every module that isn't already reached transitively
// (core/input.js and ui/statsDisplay.js are side-effect-only leaves —
// statsDisplay.js is technically reached via overlay.js too, but is
// imported explicitly here for clarity since its setInterval ticker needs
// to start on load; ui/phaseSavePopup.js is a side-effect leaf too, but
// doesn't need its own explicit import here since core/loop.js already
// imports it for checkPhaseChange()), then runs the original startup
// sequence
// (orig. "iron_fist_battle_v8 (2).html" line 8811):
//   initState(); updateHP(); highlightMain(); buildSub('FIGHT'); loop();
import { initState } from './state/gameState.js';
import { updateHP, highlightMain, buildSub } from './ui/menu.js';
import { loop } from './core/loop.js';
import { resetStats } from './state/stats.js';
import { refreshStatsDisplay } from './ui/statsDisplay.js';
import './core/input.js';
import './ui/saveLoad.js';
import './ui/autoSavePopup.js';
import './ui/modeSelect.js';
import './ui/touchControls.js';
import './ui/secretTestGui.js';

initState();
// The key should start clean on every join, not silently carry over
// whatever deathCount/totalPlayTimeMs/phaseDeathCounts a previous session
// left in localStorage (state/stats.js deliberately survives initState()
// for the "resume later" case, but that's now what ui/autoSavePopup.js's
// offer-and-explicit-Load flow is for — see chooseMode() in
// ui/modeSelect.js). Reset first, so the only way old stats come back is
// the player actually choosing to Load a code.
resetStats();
refreshStatsDisplay();
updateHP();
highlightMain();
buildSub('FIGHT');
loop();
