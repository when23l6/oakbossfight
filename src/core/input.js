// Extracted verbatim from "iron_fist_battle_v8 (2).html":
//   - lines 242-264: document click handler (dialogue/cutscene advance)
//   - lines 5504-5590: keydown/keyup/blur listeners
// (the original's arenaCanvas touchmove drag-to-move listener has been
// replaced by the on-screen D-pad — see ui/touchControls.js)
// These are top-level addEventListener calls in the original (not wrapped in a
// function) — preserved here as module-load side effects, matching the original.
import { S } from '../state/gameState.js';
import { CS } from '../state/cutsceneState.js';
import { ACTIONS } from '../state/constants.js';
import { elArena } from './canvasRefs.js';
import { _startMeditateForReal, meditateHeal } from '../boss/attacks/meditate.js';
import { csAdvance } from '../cutscenes/engine.js';
import { highlightMain, buildSub, renderSub, fireSub } from '../ui/menu.js';
import { loseGame } from '../ui/overlay.js';
import { isInputBlocked } from '../ui/inputBlock.js';

// Shared by both the 'click' listener (mouse) and the 'touchstart' listener
// below (touch) — csTarget is only meaningful for the CS.active branch
// (checking it isn't the cs-skip button itself), null is fine otherwise.
function handleTap(csTarget){
  if(S.preMeditatePhase && S.preMeditateTimer > 60){
    if(!S.preMeditateKeyHeld){
      S.preMeditateKeyHeld=true;
      S.preMeditatePresses++;
      S.preMeditateShineTimer=30;
      if(S.preMeditatePresses>=3){
        setTimeout(_startMeditateForReal, 500);
        S.preMeditatePhase=false;
      }
      setTimeout(()=>{ S.preMeditateKeyHeld=false; }, 150);
    }
    return;
  }
  if(S.meditatePhase){
    meditateHeal();
    return;
  }
  if(CS.active && (!csTarget || csTarget.id !== 'cs-skip')) csAdvance();
}

// Click anywhere on page advances cutscene. This only reliably fires ONCE
// per gesture on touch devices even when several fingers tap at once —
// mobile browsers generally synthesize a single click for a multi-touch
// tap (or none at all), not one per finger. That's fine for a single mouse
// pointer, but it means a phone player spam-tapping with multiple fingers
// during meditate only ever got 1 heal counted instead of one per finger.
// The 'touchstart' listener below handles touch directly instead, so this
// stays for real mouse clicks only.
document.addEventListener('click', function(e){
  if(isInputBlocked()) return;
  handleTap(e.target);
});

// Multi-touch-safe version of the above, for touch devices — iterates every
// touch that just started instead of relying on the browser's single
// synthesized click. Only takes over during pre-meditate/meditate
// specifically — everywhere else, normal button taps rely on the ordinary
// synthetic click + onclick="" flow, which this must not interfere with.
//
// If ANY touch in this batch landed on a real <button> (the D-pad's own
// buttons, or e.g. the SAVE button, which stays reachable during meditate),
// bail out of the whole event without calling preventDefault() — letting
// the browser's normal synthetic click reach that button as usual (D-pad
// touches are separately handled by touchControls.js's own listener, which
// already calls meditateHeal() itself; processing them here too would
// double-count). This only matters for touches landing in the exact same
// batch as a button press, which in practice means holding the D-pad from
// before and tapping elsewhere afterward — a separate, later touchstart
// event — still gets the multi-touch-safe handling below.
document.addEventListener('touchstart', function(e){
  if(isInputBlocked()) return;
  if(!S.preMeditatePhase && !S.meditatePhase) return;
  const touches = Array.from(e.changedTouches);
  const targets = touches.map(t => document.elementFromPoint(t.clientX, t.clientY));
  if(targets.some(t => t && t.closest && t.closest('button'))) return;
  e.preventDefault();
  targets.forEach(t => handleTap(t));
}, {passive:false});

// ── KEYBOARD ──────────────────────────────────
window.addEventListener('keydown',e=>{
  // Phone mode is touch/D-pad only — a stray keydown (Bluetooth keyboard,
  // browser quirk, whatever) shouldn't be able to drive the game at all.
  // Losing keyboard mashing as a heal method during meditate is made up
  // for by meditateHeal() itself paying out 3x per tap in phone mode —
  // see boss/attacks/meditate.js.
  if(document.body.classList.contains('phone-mode')) return;
  if(isInputBlocked()) return;
  // Meditate press
  if(S.meditatePhase){
    const medKeys=['z','Z',' ','Enter'];
    if(medKeys.includes(e.key) && !S._medKeyHeld[e.key]){
      S._medKeyHeld[e.key]=true;
      meditateHeal();
    }
    // Don't return — allow quad movement keys to still work
  }
  // R key resets to same phase
  if(e.key==='r'||e.key==='R'){
    if(!S.gameOver){
      S.corridorPhase=false;
      S.corMultiRicPhase=false;
      S.corBlocksPhase=false;
      S.corRGPhase=false;
      S.corSpinRapidPhase=false;
      S.corSSPhase=false;
      S.corBCPullPhase=false;
      S.blindchasePhase=false;
      S.compulsionPhase=false;
      S.corSSRotation=0;
      S.bossOffsetX=0;
      S._bcInverted=false;
      S._bcInvertFlash=0;
      elArena.style.transform='';
      S.playerHP=0;
      loseGame();
    }
    return;
  }
  if(CS.active){
    if(['Enter',' ','z','Z','x','X','ArrowRight','ArrowDown'].includes(e.key)){ e.preventDefault(); csAdvance(); }
    return;
  }
  if(S.turn==='boss'||S.gameOver){ S.keys[e.key.toLowerCase()]=true; S.keys[e.key]=true; return; }

  // During player turn: WASD + arrows = menu nav, z/x/enter/esc = confirm/back
  const nav=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','w','a','s','d','W','A','S','D','z','Z','x','X','Enter','Escape',' '];
  if(!nav.includes(e.key)) return;
  e.preventDefault();

  const right = e.key==='ArrowRight'||e.key==='d'||e.key==='D';
  const left  = e.key==='ArrowLeft' ||e.key==='a'||e.key==='A';
  const down  = e.key==='ArrowDown' ||e.key==='s'||e.key==='S';
  const up    = e.key==='ArrowUp'   ||e.key==='w'||e.key==='W';
  const confirm = e.key==='Enter'||e.key===' '||e.key==='z'||e.key==='Z';
  const back    = e.key==='Escape'||e.key==='x'||e.key==='X';

  if(!S.inSub){
    if(right) S.mainIdx=Math.min(3,S.mainIdx+1);
    if(left||up) S.mainIdx=Math.max(0,S.mainIdx-1);
    S.selAction=ACTIONS[S.mainIdx];
    highlightMain(); buildSub(S.selAction);
    // down or S drops into sub-menu; confirm fires immediately if only 1 option, else enters sub
    if(down && S.subList.length>0){S.inSub=true;S.subIdx=0;renderSub();}
    if(confirm && S.subList.length>0){
      if(S.subList.length===1){fireSub(0);}
      else{S.inSub=true;S.subIdx=0;renderSub();}
    }
  } else {
    if(right||down) S.subIdx=Math.min(S.subList.length-1,S.subIdx+1);
    if(left) S.subIdx=Math.max(0,S.subIdx-1);
    if(back||up){S.inSub=false;renderSub();return;}
    if(confirm){fireSub(S.subIdx);return;}
    renderSub();
  }
});
window.addEventListener('keyup',e=>{
  S.keys[e.key]=false; S.keys[e.key.toLowerCase()]=false;
  if(S._medKeyHeld) S._medKeyHeld[e.key]=false;
});
window.addEventListener('blur',()=>{ S.keys={}; });
