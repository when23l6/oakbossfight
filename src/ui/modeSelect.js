// Mode-select gate: shown every time the page loads, before the player can
// interact with anything else, asking Computer vs Phone. The choice adds a
// body class that drives the responsive CSS and the on-screen D-pad
// (see styles/responsive.css and ./touchControls.js) — nothing about the
// actual game/attack logic needs to know which mode is active.
import { elMenu } from '../core/canvasRefs.js';
import { checkAutoSave } from './autoSavePopup.js';

const gameWrapper = document.getElementById('game-wrapper');
const subActions = document.getElementById('sub-actions');
const dialogue = document.getElementById('dialogue');

function applyMode(mode){
  document.body.classList.remove('computer-mode', 'phone-mode');
  document.body.classList.add(mode === 'phone' ? 'phone-mode' : 'computer-mode');
}

// #game-wrapper is a fixed 720px-wide desktop layout. On phone, instead of
// shrinking just its width (which left fixed-size elements like the menu
// taller than the viewport — clipped and untappable, since body has
// overflow:hidden), scale the WHOLE wrapper uniformly to fit inside
// whatever viewport the phone has, both dimensions.
function fitPhoneLayoutNow(){
  if(!document.body.classList.contains('phone-mode')) return;
  gameWrapper.style.transform = 'none';
  const rect = gameWrapper.getBoundingClientRect();
  // visualViewport tracks the actual visible area on mobile (accounts for
  // browser chrome show/hide), which plain window.innerWidth/Height can lag.
  const vv = window.visualViewport;
  const vw = vv ? vv.width : window.innerWidth;
  const vh = vv ? vv.height : window.innerHeight;
  const scale = Math.min(vw / rect.width, vh / rect.height, 1);
  gameWrapper.style.transform = scale < 1 ? `scale(${scale})` : 'none';
}

// Coalesce bursts of DOM changes (a sub-menu re-render fires several
// mutations at once) into a single recompute per frame.
let fitScheduled = false;
function fitPhoneLayout(){
  if(fitScheduled) return;
  fitScheduled = true;
  requestAnimationFrame(()=>{ fitScheduled=false; fitPhoneLayoutNow(); });
}

function chooseMode(mode){
  applyMode(mode);
  document.getElementById('mode-select').style.display = 'none';
  fitPhoneLayout();
  // Runs after the gate above is actually hidden, not before — see
  // ui/autoSavePopup.js's top comment for why checkAutoSave() lives here
  // instead of running itself at module load time.
  checkAutoSave();
}

document.getElementById('mode-select').style.display = 'flex';
window.addEventListener('resize', fitPhoneLayout);
window.addEventListener('orientationchange', fitPhoneLayout);
if(window.visualViewport) window.visualViewport.addEventListener('resize', fitPhoneLayout);

// VT323 (used for every piece of text) loads from Google Fonts with
// display=swap — the mode-select gate is the very first thing tapped, often
// before that webfont has finished downloading, so an initial fit can be
// measured against the shorter fallback-font layout. Once the real font
// swaps in, text grows and pushes content past the already-locked scale.
// Re-fit once fonts are confirmed loaded to correct for that.
if(document.fonts && document.fonts.ready) document.fonts.ready.then(fitPhoneLayout);

// The wrapper's content height isn't constant — switching from FIGHT's
// 1-line submenu to ACT's 3-line submenu, dialogue text wrapping, or the
// action menu showing/hiding around an attack all change how tall the
// layout actually is. A scale computed for a shorter state left taller
// content sitting below the fitted/visible area (buttons "in range" of the
// eye but not of a tap). Re-fit on any such change instead of only once at
// mode-select time.
//
// Deliberately narrow to these 3 specific targets rather than watching all
// of #game-wrapper's subtree: several elements inside it get rewritten
// every single animation frame during normal gameplay (the arena's
// rotate/shake transform in core/loop.js, HP bar widths, and — worst of
// all — the meditate minigame's HP readout text, all 60x/sec) — a
// subtree-wide watch would re-run the (expensive, forced-reflow) scale
// recompute every frame for the entire time phone mode is active, not just
// when a menu/dialogue change actually needs it. None of these 3 targets
// are touched anywhere near that often. (Popups are position:fixed
// overlays — see styles/ui.css .popup-modal — so opening one doesn't
// change #game-wrapper's own layout height and doesn't need watching.)
const observer = new MutationObserver(fitPhoneLayout);
observer.observe(subActions, { childList: true });
observer.observe(dialogue, { childList: true, characterData: true, subtree: true });
observer.observe(elMenu, { attributes: true, attributeFilter: ['style'] });

export { chooseMode };
window.chooseMode = chooseMode;
