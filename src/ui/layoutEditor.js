// Phone-mode layout editor: lets the player drag-reposition and resize the
// D-pad, arena, and dialogue box to their liking. Settings persist to
// localStorage (state/phoneLayout.js) independent of the save key — this is
// a device/UI preference, not game progress, so it isn't touched by CLEAR
// KEY or the every-join stats reset (main.js).
//
// The arena's own #arena-section has its .style.transform written every
// frame by core/loopDraw.js (slash-rotate, screenshake, quad rotation —
// reset to '' when none apply), and #dialogue has its content replaced
// wholesale on every line (ui/menu.js's say() sets .textContent, which
// would silently delete a resize handle living inside it as a child) — so
// this editor can't target either element directly. index.html wraps both
// in a dedicated #arena-layout-wrap / #dialogue-layout-wrap that ONLY this
// module ever touches. #dpad has no such conflict (nothing else sets its
// transform or replaces its children), so it's targeted directly.
import { getLayout, setElementLayout, resetLayout } from '../state/phoneLayout.js';
import { getPhoneScale } from './modeSelect.js';

const dpad = document.getElementById('dpad');
const arenaWrap = document.getElementById('arena-layout-wrap');
const dialogueWrap = document.getElementById('dialogue-layout-wrap');
const editBar = document.getElementById('layout-edit-bar');
const dpadHandle = document.getElementById('dpad-resize-handle');
const arenaHandle = document.getElementById('arena-resize-handle');
const dialogueHandle = document.getElementById('dialogue-resize-handle');

const MIN_SCALE = 0.5, MAX_SCALE = 1.8;
function clamp(v, lo, hi){ return Math.max(lo, Math.min(hi, v)); }

let editActive = false;
// Checked by ui/inputBlock.js so normal game input (D-pad movement, menu
// taps) pauses while the player is mid-edit, same as every other popup.
export function isLayoutEditActive(){ return editActive; }

function applyToElement(el, l){
  el.style.transform = `translate(${l.x}px, ${l.y}px) scale(${l.scale})`;
}

// Called once phone mode is actually chosen (ui/modeSelect.js's
// chooseMode()) — applying this in computer mode would be harmless but
// meaningless (#dpad is hidden there, and the arena should keep its normal
// untouched layout), so that caller gates it, not this function.
export function applyPhoneLayout(){
  const l = getLayout();
  applyToElement(dpad, l.dpad);
  applyToElement(arenaWrap, l.arena);
  applyToElement(dialogueWrap, l.dialogue);
}

function setEditActive(on){
  editActive = on;
  editBar.style.display = on ? 'flex' : 'none';
  dpadHandle.style.display = on ? 'flex' : 'none';
  arenaHandle.style.display = on ? 'flex' : 'none';
  dialogueHandle.style.display = on ? 'flex' : 'none';
  dpad.classList.toggle('layout-editing', on);
  arenaWrap.classList.toggle('layout-editing', on);
  dialogueWrap.classList.toggle('layout-editing', on);
}

function toggleLayoutEdit(){
  setEditActive(!editActive);
}
function doneLayoutEdit(){
  setEditActive(false);
}
function resetLayoutEdit(){
  resetLayout();
  applyPhoneLayout();
}

// Drag-to-move: touchstart/move/end directly on the element being
// repositioned, active only while editActive (touchControls.js's own D-pad
// listeners on the same element still fire too, but do nothing — they're
// gated behind isInputBlocked(), which is true while editActive is true).
// Delta is divided by the OUTER fit-to-screen scale (modeSelect.js's
// fitPhoneLayoutNow()) since these elements sit inside that already-scaled
// #game-wrapper — without this, a screen-pixel drag would move the element
// faster or slower than the finger depending on how much the device's
// viewport had to shrink the whole layout to fit.
function makeDraggable(el, key){
  let dragging = false, startX = 0, startY = 0, baseX = 0, baseY = 0;
  function start(e){
    if(!editActive) return;
    e.preventDefault();
    const t = e.touches[0];
    dragging = true;
    startX = t.clientX; startY = t.clientY;
    const l = getLayout()[key];
    baseX = l.x; baseY = l.y;
  }
  function move(e){
    if(!dragging) return;
    e.preventDefault();
    const t = e.touches[0];
    const s = getPhoneScale() || 1;
    const x = baseX + (t.clientX - startX) / s;
    const y = baseY + (t.clientY - startY) / s;
    setElementLayout(key, { x, y });
    applyToElement(el, getLayout()[key]);
  }
  function end(){ dragging = false; }
  el.addEventListener('touchstart', start, {passive:false});
  el.addEventListener('touchmove', move, {passive:false});
  el.addEventListener('touchend', end);
  el.addEventListener('touchcancel', end);
}

// Resize handle: drag horizontally to shrink/grow. stopPropagation() keeps
// a handle touch from also bubbling into its parent's makeDraggable()
// listener above (the handle is a child of the element it resizes).
function makeResizable(handle, el, key){
  let dragging = false, startX = 0, baseScale = 1;
  function start(e){
    if(!editActive) return;
    e.preventDefault(); e.stopPropagation();
    const t = e.touches[0];
    dragging = true;
    startX = t.clientX;
    baseScale = getLayout()[key].scale;
  }
  function move(e){
    if(!dragging) return;
    e.preventDefault(); e.stopPropagation();
    const t = e.touches[0];
    const s = getPhoneScale() || 1;
    const dx = (t.clientX - startX) / s;
    // 160 local px of drag = a full 1.0x change in scale, clamped to a
    // sane range so the element can't be dragged down to invisible or up
    // to absurdly huge.
    const scale = clamp(baseScale + dx / 160, MIN_SCALE, MAX_SCALE);
    setElementLayout(key, { scale });
    applyToElement(el, getLayout()[key]);
  }
  function end(e){
    if(!dragging) return;
    e.stopPropagation();
    dragging = false;
  }
  handle.addEventListener('touchstart', start, {passive:false});
  handle.addEventListener('touchmove', move, {passive:false});
  handle.addEventListener('touchend', end);
  handle.addEventListener('touchcancel', end);
}

makeDraggable(dpad, 'dpad');
makeDraggable(arenaWrap, 'arena');
makeDraggable(dialogueWrap, 'dialogue');
makeResizable(dpadHandle, dpad, 'dpad');
makeResizable(arenaHandle, arenaWrap, 'arena');
makeResizable(dialogueHandle, dialogueWrap, 'dialogue');

export { toggleLayoutEdit, doneLayoutEdit, resetLayoutEdit };
window.toggleLayoutEdit = toggleLayoutEdit;
window.doneLayoutEdit = doneLayoutEdit;
window.resetLayoutEdit = resetLayoutEdit;
