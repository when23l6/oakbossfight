// On-screen D-pad for phone mode. Simulates the same S.keys['ArrowUp'/
// 'Down'/'Left'/'Right'] states a keyboard press would set, so no attack/
// movement logic needs to know it exists — every movement path already
// reads S.keys, the same ones the keyboard sets (see core/input.js). This
// also covers jump (S.keys['ArrowUp'] is one of the keys every jump check
// accepts), so there's no separate jump button. Corner buttons carry two
// keys (data-keys="ArrowUp,ArrowLeft" etc.) for one-tap diagonals — held
// simultaneously, that's exactly what two keyboard arrow keys held at once
// already does, so no movement code needed to change for this. Only ever
// visible in phone mode (display toggled by core/loop.js), but wiring it
// up unconditionally is harmless.
import { S } from '../state/gameState.js';
import { isInputBlocked } from './inputBlock.js';
import { meditateHeal } from '../boss/attacks/meditate.js';

const dpad = document.getElementById('dpad');

// touchId -> currently-held key array, tracked per-touch. Listeners are on
// the #dpad container, not individual buttons: once a touch starts on one
// button, the browser keeps delivering that same touch's further events to
// that original element even if the finger slides onto a different button
// — a plain per-button touchstart/touchend pair can't detect the finger
// having moved to a neighboring button. Tracking by identifier and
// re-checking the element under each touch on every move lets the held
// direction(s) switch without lifting, and keeps simultaneous touches
// (two fingers, or one finger on a corner button) independent of each
// other.
const touchKeys = new Map();

// How many active presses (touches, plus the mouse) are currently holding
// each key. A key stays held (S.keys[k]=true) as long as this is >0 — with
// multi-touch, more than one finger can easily end up pressing the same
// button (or two buttons that share a key, e.g. a corner + its cardinal
// neighbor), and lifting just one of them must not clear the key while
// another is still down. Direct S.keys[k]=true/false per touch couldn't
// tell those cases apart.
const keyPressCount = {};
function addKeyPress(k){
  keyPressCount[k] = (keyPressCount[k]||0) + 1;
  S.keys[k] = true;
}
function removeKeyPress(k){
  keyPressCount[k] = Math.max(0, (keyPressCount[k]||0) - 1);
  if(keyPressCount[k]===0) S.keys[k] = false;
}

function keysAt(x, y){
  const el = document.elementFromPoint(x, y);
  const btn = el && el.closest && el.closest('.dpad-btn');
  return btn ? btn.dataset.keys.split(',') : [];
}

function updateTouch(touch){
  // Never start/switch keys while a popup is blocking input. releaseTouch()
  // below is deliberately NOT guarded the same way — a touch that was
  // already pressing a key when a popup opens must still be able to clear
  // that key on release, or it'd stay stuck true forever.
  if(isInputBlocked()) return;
  const newKeys = keysAt(touch.clientX, touch.clientY);
  const oldKeys = touchKeys.get(touch.identifier) || [];
  for(const k of oldKeys) if(!newKeys.includes(k)) removeKeyPress(k);
  for(const k of newKeys) if(!oldKeys.includes(k)) addKeyPress(k);
  touchKeys.set(touch.identifier, newKeys);
}

function releaseTouch(touch){
  const oldKeys = touchKeys.get(touch.identifier) || [];
  for(const k of oldKeys) removeKeyPress(k);
  touchKeys.delete(touch.identifier);
}

function onStartOrMove(e){
  e.preventDefault();
  for(let i=0;i<e.changedTouches.length;i++){
    const touch = e.changedTouches[i];
    // A tap landing on the D-pad still shouldn't be a "wasted" touch during
    // meditate (see boss/attacks/meditate.js) — heal same as any other tap
    // on screen, on top of whatever movement it also sets. Checked BEFORE
    // updateTouch() populates touchKeys for this id, so this only fires
    // once per fresh press (touchstart), not on every touchmove while held.
    if(S.meditatePhase && !isInputBlocked() && !touchKeys.has(touch.identifier)) meditateHeal();
    updateTouch(touch);
  }
}
function onEndOrCancel(e){
  e.preventDefault();
  for(let i=0;i<e.changedTouches.length;i++) releaseTouch(e.changedTouches[i]);
}

dpad.addEventListener('touchstart', onStartOrMove, {passive:false});
dpad.addEventListener('touchmove', onStartOrMove, {passive:false});
dpad.addEventListener('touchend', onEndOrCancel, {passive:false});
dpad.addEventListener('touchcancel', onEndOrCancel, {passive:false});

// Mouse stays per-button (desktop testing convenience only — a mouse drag
// across buttons without releasing isn't a real usage pattern worth the
// same handling as touch).
document.querySelectorAll('.dpad-btn').forEach(btn=>{
  const keys = btn.dataset.keys.split(',');
  // mouseleave fires on hover-then-leave even without a mousedown ever
  // happening — this flag stops that from decrementing keyPressCount for a
  // press that was never actually added, which would wrongly zero out a
  // count a touch is still holding.
  let pressed = false;
  btn.addEventListener('mousedown', ()=>{
    // No explicit meditateHeal() call here, unlike the touch path below —
    // a real mouse click naturally fires a 'click' event after this, which
    // already bubbles to core/input.js's document click handler and heals
    // there. touchstart's preventDefault() (below) suppresses that
    // synthetic click for touch, which is why touch needs the explicit call
    // and mouse would double-heal if it also had one.
    if(isInputBlocked()) return;
    pressed = true;
    for(const k of keys) addKeyPress(k);
  });
  function release(){
    if(!pressed) return;
    pressed = false;
    for(const k of keys) removeKeyPress(k);
  }
  btn.addEventListener('mouseup', release);
  btn.addEventListener('mouseleave', release);
});
