// SETTINGS menu: currently just a launcher for the GAMESPEED panel, but
// exists as its own popup — not squeezed into the SAVE/LOAD menu — so
// future settings have a natural home separate from save/progress concerns.
// Same small centered .popup-modal + shared #popup-backdrop pattern as
// ui/saveLoad.js's #save-menu / #summary-view-modal, reusing that same
// setBackdrop() rather than duplicating the lookup.
import { setBackdrop } from './saveLoad.js';
import { toggleGameSpeedPanel } from './gameSpeedPanel.js';

function toggleSettingsMenu(){
  const m = document.getElementById('settings-menu');
  if(!m.classList.contains('show')){
    m.classList.add('show');
    setBackdrop(true);
  } else {
    m.classList.remove('show');
    setBackdrop(false);
  }
}

// Closes this menu first, then opens the GAMESPEED panel — that function
// refuses to open "underneath another popup" (isInputBlocked()), and the
// GAMESPEED button lives INSIDE #settings-menu, which is by definition
// still .show-ing at the moment it's clicked (the exact bug this menu's
// GAMESPEED button previously had while it lived inside #save-menu).
function openGameSpeedFromSettings(){
  toggleSettingsMenu();
  toggleGameSpeedPanel();
}

export { toggleSettingsMenu, openGameSpeedFromSettings };
window.toggleSettingsMenu = toggleSettingsMenu;
window.openGameSpeedFromSettings = openGameSpeedFromSettings;
