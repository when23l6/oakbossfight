// Whether a blocking popup (SAVE menu, summary key viewer, the automatic
// phase-save reminder, the auto-save-detected offer, the hidden dev
// phase-jump GUI, the phone-mode layout editor, or the gamespeed panel) is
// currently open.
// #popup-backdrop (index.html) already blocks mouse/touch clicks from
// reaching the game spatially — see ui/saveLoad.js, which shows/hides it
// alongside its popups — but keyboard events aren't spatial and would
// otherwise still drive the game underneath an open popup. core/input.js's
// keydown/click handlers and ui/touchControls.js's D-pad handlers all
// check this.
import { isLayoutEditActive } from './layoutEditor.js';
import { isGameSpeedPanelOpen } from './gameSpeedPanel.js';

export function isInputBlocked(){
  return document.getElementById('save-menu').classList.contains('show')
    || document.getElementById('summary-view-modal').classList.contains('show')
    || document.getElementById('phase-save-popup').style.display === 'flex'
    || document.getElementById('secret-test-popup').style.display === 'flex'
    || document.getElementById('auto-save-popup').style.display === 'flex'
    || isLayoutEditActive()
    || isGameSpeedPanelOpen();
}
