// Hidden dev tool: opens a popup that jumps straight to the start of any
// phase. Deliberately has no visible trigger anywhere in the UI — the only
// way in is a URL with the correct secret code as a query param, e.g.
// index.html?k=<the token>. The token itself is never stored in this
// source — only its SHA-256 hash (SECRET_HASH below) is. On load, whatever
// value (if any) is in ?k= gets hashed the same way and compared; nothing
// short of the exact original token produces a matching hash, and reading
// this file doesn't reveal what that token is. Using the popup sets
// S._usedTestGui=true (state/gameState.js), which is silently carried into
// every save code generated for the rest of the playthrough (see
// state/saveCode.js) — never shown anywhere in this game's own UI, only
// recoverable by decoding a code.
import { S } from '../state/gameState.js';
import { say, updateHP } from './menu.js';
import { jumpToPhase } from './phaseJump.js';
import { elMenu, elBossBg } from '../core/canvasRefs.js';
import { beginCorridor } from '../boss/attacks/corridor.js';
import { beginCorMultiRic } from '../boss/attacks/corMultiRic.js';
import { beginCorBlocks } from '../boss/attacks/corBlocks.js';
import { beginCorRifleGrenade } from '../boss/attacks/corRifleGrenade.js';
import { beginCorSpinRapid } from '../boss/attacks/corSpinRapid.js';
import { beginCorStompSwipe } from '../boss/attacks/corStompSwipe.js';
import { beginBlindchase } from '../boss/attacks/blindchase.js';
import { beginCompulsion } from '../boss/attacks/compulsion.js';
import { beginHealOrbs } from '../boss/attacks/healOrbs.js';
import { beginCorQuad } from '../boss/attacks/corQuad.js';
import { beginCor10 } from '../boss/attacks/cor10.js';
import { beginCorMRS } from '../boss/attacks/corMRS.js';
import { beginMeditate } from '../boss/attacks/meditate.js';

const SECRET_HASH = '3004598cf911ec759e33abbe6b97c0a095a9f8c37f51f6c8a946bb38a32f8d17';

// The full phase-8 "corridor gauntlet" chain (see docs/architecture.md /
// this session's investigation into it): corridor -> corMultiRic ->
// corBlocks -> corRifleGrenade -> corSpinRapid -> corStompSwipe ->
// blindchase(pull) -> compulsion(pull) -> healOrbs -> corQuad -> cor10 ->
// the frenzy quad ending. blindchase/compulsion need S.corBCPullPhase=true
// to run their P8-chain variant instead of their standalone phase-7 one.
// corMRS has no caller anywhere in the chain (dead code in normal play) but
// is still a real P8 attack module, so it's included for testing too.
// meditate is reached naturally only via a frenzy-quad death at the very
// end of that chain (ui/overlay.js's loseGame()) — it's not itself part of
// the corridor sequence, but needs the exact same phase-8/S.turn='boss'
// setup as everything else here, so it fits the same calling convention.
const P8_ATTACKS = {
  corridor:        () => beginCorridor(),
  corMultiRic:      () => beginCorMultiRic(),
  corBlocks:        () => beginCorBlocks(),
  corRifleGrenade:  () => beginCorRifleGrenade(),
  corSpinRapid:     () => beginCorSpinRapid(),
  corStompSwipe:    () => beginCorStompSwipe(),
  blindchase:       () => { S.corBCPullPhase=true; beginBlindchase(); },
  compulsion:       () => { S.corBCPullPhase=true; beginCompulsion(); },
  healOrbs:         () => beginHealOrbs(),
  corQuad:          () => beginCorQuad(),
  cor10:            () => beginCor10(),
  corMRS:           () => beginCorMRS(),
  meditate:         () => beginMeditate(),
};

const popup = document.getElementById('secret-test-popup');

// Same reasoning as ui/phaseSavePopup.js's popup click-stop: without this,
// dismissing the popup (or picking a phase) while a cutscene happens to be
// starting underneath would simultaneously advance that cutscene's dialogue.
popup.addEventListener('click', e=>{ e.stopPropagation(); });

async function sha256Hex(str){
  const data = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function checkSecretLink(){
  // crypto.subtle requires a secure context (HTTPS, or localhost during
  // dev) — silently no-ops elsewhere rather than throwing.
  if(!(window.crypto && window.crypto.subtle)) return;
  const provided = new URLSearchParams(window.location.search).get('k');
  if(!provided) return;
  const hash = await sha256Hex(provided);
  if(hash === SECRET_HASH) popup.style.display = 'flex';
}
checkSecretLink();

function closeSecretTestGui(){
  popup.style.display = 'none';
}

function secretJumpToPhase(phase){
  // Must be set AFTER jumpToPhase(), not before — jumpToPhase() calls
  // initState() internally, which reassigns S to a brand new object
  // (S._usedTestGui defaults to false there), silently discarding this
  // flag if it were set first.
  jumpToPhase(phase, phase>=5 ? 0 : 3);
  S._usedTestGui = true;
  say(`...`);
  closeSecretTestGui();
}

// Jumps to phase 8 (same baseline jumpToPhase(8,...) already sets up: boss
// visuals, bossHP=1, etc.) then launches one specific attack from the
// corridor chain directly, overriding S.turn to 'boss' since jumpToPhase()
// always hands control back to the player — attacks need the boss's turn
// active to run their update loop in core/loop.js.
function secretTestP8Attack(name){
  const begin = P8_ATTACKS[name];
  if(!begin) return;
  // Same ordering fix as secretJumpToPhase() above — jumpToPhase() calls
  // initState() internally, which would wipe this flag out if set first.
  jumpToPhase(8, 0);
  S._usedTestGui = true;
  S.turn = 'boss';
  elMenu.style.display = 'none';
  elBossBg.style.background = 'radial-gradient(ellipse at 50% 90%, #0a0010 0%, #000 55%)';
  updateHP();
  begin();
  closeSecretTestGui();
}

export { closeSecretTestGui, secretJumpToPhase, secretTestP8Attack };
window.closeSecretTestGui = closeSecretTestGui;
window.secretJumpToPhase = secretJumpToPhase;
window.secretTestP8Attack = secretTestP8Attack;
