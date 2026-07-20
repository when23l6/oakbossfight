// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 8602-8809
// (the main requestAnimationFrame loop()). NOTE: original line 8811
// (`updateHP();highlightMain();buildSub('FIGHT');loop();` top-level kickoff)
// is intentionally NOT copied here — per the task spec, main.js is
// responsible for calling that kickoff sequence once during startup.
import { S } from '../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../state/constants.js';
import { elArena, elMenu } from './canvasRefs.js';
import { updateZones } from '../boss/zones.js';
import { say, updateHP, highlightMain, buildSub } from '../ui/menu.js';
import { loseGame } from '../ui/overlay.js';
import { updatePlatforms, updateSplit } from '../boss/attacks/platforms.js';
import { updateQuad } from '../boss/attacks/quadPhase.js';
import { updateDropper } from '../boss/attacks/dropper.js';
import { updateWalls } from '../boss/attacks/walls.js';
import { updateRifle } from '../boss/attacks/rifle.js';
import { updateRicochet } from '../boss/attacks/ricochet.js';
import { updateRapidfireAttack } from '../boss/attacks/rapidfire.js';
import { updateGrenade } from '../boss/attacks/grenade.js';
import { updatePossession } from '../boss/attacks/possession.js';
import { updateCompulsion } from '../boss/attacks/compulsion.js';
import { updateBlindchase } from '../boss/attacks/blindchase.js';
import { updateCorridor } from '../boss/attacks/corridor.js';
import { updateCorMultiRic } from '../boss/attacks/corMultiRic.js';
import { updateCorBlocks } from '../boss/attacks/corBlocks.js';
import { updateCorRifleGrenade } from '../boss/attacks/corRifleGrenade.js';
import { updateCorSpinRapid } from '../boss/attacks/corSpinRapid.js';
import { updateCorStompSwipe } from '../boss/attacks/corStompSwipe.js';
import { updateCorQuad } from '../boss/attacks/corQuad.js';
import { updateHealOrbsPhase, updateHealOrbs } from '../boss/attacks/healOrbs.js';
import { updateCorMRS } from '../boss/attacks/corMRS.js';
import { updateCor10 } from '../boss/attacks/cor10.js';
import { updatePreMeditate, updateMeditate } from '../boss/attacks/meditate.js';
import { checkPhaseChange } from '../ui/phaseSavePopup.js';
import { isInputBlocked } from '../ui/inputBlock.js';
import { drawOnce } from './loopDraw.js';
import { getGameSpeed } from '../state/gameSpeed.js';
import { updatePlayerHitFlash } from '../boss/render/playerRender.js';
import { tickTimers } from './tickTimer.js';

function updateOnce(){
  S.tick++;
  // Phone mode: lock page scroll while an attack is actually in progress —
  // a stray touch near the arena/D-pad shouldn't be able to scroll the game
  // out of view mid-dodge. Scroll stays available the rest of the time
  // (menu, cutscenes, etc.) as a fallback in case the scale-to-fit
  // (ui/modeSelect.js) is ever off on a given device. Cheap classList
  // toggle, not a layout read, so doing this every frame is fine.
  if(document.body.classList.contains('phone-mode')){
    document.body.classList.toggle('attack-active', S.turn==='boss' && !S.gameOver);
  }
  // When turn just switched to player — clear any leftover zones, unlock actions
  if(S.turn==='player' && !S.gameOver && S._prevTurn==='boss'){
    S.zones=[];
    S.actionLocked=false;
  }
  S._prevTurn=S.turn;
  if(S.pSilentFlash>0) S.pSilentFlash--;
  updatePlayerHitFlash();
  if(S.bossHitFlash>0) S.bossHitFlash--;
  if(S.bossHealFlash>0) S.bossHealFlash--;
  // Same pause condition as the rest of active simulation below — an
  // attack windup or the taunt counterattack delay (core/tickTimer.js)
  // shouldn't keep counting down underneath an open popup any more than
  // the attack itself would.
  if(!isInputBlocked()) tickTimers();
  // Pause the entire real-time simulation below (attack movement, hazard
  // timers, damage checks) while a popup is open — not just player input.
  // A phase transition can call bossAttack() to start a brand-new attack
  // sequence in the very same synchronous call that also triggers the
  // phase-save popup (e.g. phase4() ends with bossAttack()), so blocking
  // input alone wasn't enough: the attack just kept running underneath the
  // popup, still able to damage a player who couldn't dodge it.
  if(S.turn==='boss'&&!S.gameOver&&!isInputBlocked()){
    // phase4_all: enable gravity only during stomp sub-attack window
    if(S.attack==='phase4_all'&&S.stompStart>=0&&!S.platPhase){
      const inStomp=S.atkTimer>=S.stompStart&&S.atkTimer<S.stompEnd;
      if(inStomp&&!S.gravity){ S.gravity=true; S.vy=0; S.py=ARENA_H-AM-9; }
      if(!inStomp&&S.gravity){ S.gravity=false; S.vy=0; }
    }
    if(S.platPhase||S.splitPhase||S.quadPhase||S.dropperPhase||S.wallsPhase||S.riflePhase||S.ricochetPhase||S.rapidfirePhase||S.grenadePhase||S.possessionPhase||S.compulsionPhase||S.blindchasePhase||S.corridorPhase||S.corMultiRicPhase||S.corBlocksPhase||S.corRGPhase||S.corSpinRapidPhase||S.corSSPhase||S.corQuadPhase||S.healOrbsPhase||S.corMRSPhase||S.cor10Phase){      // movement handled in updatePlatforms / updateSplit / updateQuad / updateDropper / updateWalls
    } else if(S.gravity){
      // Blue heart: gravity pulls down, jump with up/w/space, move left/right
      S.vy=S.vy+0.28;
      const onGround=S.py>=ARENA_H-AM-9;
      if(!S.gameOver){
      if((S.keys['ArrowUp']||S.keys['w']||S.keys[' ']||S.keys['Enter'])&&onGround) S.vy=-5.5;
      if(S.keys['ArrowLeft']||S.keys['a'])  S.px=Math.max(AM+9,S.px-3.2);
      if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(ARENA_W-AM-9,S.px+3.2);
      }
      S.py=Math.min(ARENA_H-AM-9,S.py+S.vy);
      if(S.py>=ARENA_H-AM-9) S.vy=0;
    } else {
      if(!S.gameOver){
      if(S.keys['ArrowLeft']||S.keys['a'])  S.px=Math.max(AM+9,S.px-3.5);
      if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(ARENA_W-AM-9,S.px+3.5);
      if(S.keys['ArrowUp']||S.keys['w'])    S.py=Math.max(AM+9,S.py-3.5);
      if(S.keys['ArrowDown']||S.keys['s'])  S.py=Math.min(ARENA_H-AM-9,S.py+3.5);
      }
    }
    if(!S.corBlocksPhase&&!S.corMultiRicPhase&&!S.corRGPhase&&!S.corSSPhase&&!S.healOrbsPhase) S.atkTimer++;
    if(!S.corBlocksPhase&&!S.corMultiRicPhase&&!S.corRGPhase&&!S.corSSPhase&&!S.healOrbsPhase) updateZones();
    // Screenshake when a platform y-line activates during platPhase
    if(S.platPhase){
      for(const z of S.zones){
        if(z.active && z.color==='#cc44ff' && !z._shook){
          z._shook=true;
          S.shakeFrames=8;
        }
      }
    }
    // Collision: player heart (~6px) vs active zones
    const hit=!S.corBlocksPhase&&!S.corRGPhase&&!S.corSSPhase&&!S.meditatePhase&&S.zones.some(z=>{
      if(z.type==='circle_expand'&&z.passThru) return false;
      if(!z.active) return false;
      if(z.type==='spinner'){
        // Distance from player to the arm line segment (from center outward)
        const cos=Math.cos(z.angle||0), sin=Math.sin(z.angle||0);
        const dx=S.px-z.cx, dy=S.py-z.cy;
        const proj=dx*cos+dy*sin;
        if(proj<0||proj>z.armLen) return false; // outside segment length
        const dist=Math.abs(dx*sin-dy*cos);
        return dist<(z.thickness||10)/2+6;
      }
      if(z.type==='zigzag'){
        const dx=S.px-z.bx, dy=S.py-z.by;
        return Math.sqrt(dx*dx+dy*dy)<(z.ballR||8)+6;
      }
      if(z.type==='line_360'){
        const cos=Math.cos(z.angle), sin=Math.sin(z.angle);
        const dx=S.px-z.cx, dy=S.py-z.cy;
        // Only hit if player is in the forward direction of the ray
        const proj=dx*cos+dy*sin;
        if(proj<0) return false;
        const dist=Math.abs(dx*sin - dy*cos);
        return dist < (z.thickness||8)/2 + 6;
      }
      if(z.type==='circle_expand'){
        const dx=S.px-z.cx,dy=S.py-z.cy;
        const dist=Math.sqrt(dx*dx+dy*dy);
        const thick=(z.thickness||20)/2;
        return dist>z.r-thick-6&&dist<z.r+thick+6;
      }
      return S.px+6>z.x&&S.px-6<z.x+z.w&&S.py+6>z.y&&S.py-6<z.y+z.h;
    });
    if(hit&&S.pHitFlash<=0&&S.pSilentFlash<=0){
      const dmg=S._runBlitz?S.playerMax:(S.phase===2?3:2);
      S.playerHP=Math.max(0,S.playerHP-dmg);S.pHitFlash=30;updateHP();
      if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S._runBlitz=false;setTimeout(loseGame,500);}
    }
    // Phase 4 platform mode: start when slash rotate completes
    if(S.attack==='phase4_all' && !S.platPhase && !S.splitPhase && S.platStart>0 && S.atkTimer>=S.platStart){
      S.platPhase=true;
      S.platTimer=0;
      S.platforms=[];
      S.platSpawnCount=0;
      S.floorDmg=false;
      S.gravity=true;
      S.vy=0;
      // keep player where they are — no teleport
      S.arenaRotating=false;
      elArena.style.transform='';
    }
    if(S.platPhase){
      updatePlatforms();
    } else if(S.splitPhase){
      updateSplit();
    } else if(S.quadPhase){
      updateQuad();
    } else if(S.dropperPhase){
      updateDropper();
    } else if(S.wallsPhase){
      updateWalls();
    } else if(S.riflePhase){
      updateRifle();
    } else if(S.ricochetPhase){
      updateRicochet();
    } else if(S.rapidfirePhase){
      updateRapidfireAttack();
    } else if(S.grenadePhase){
      updateGrenade();
    } else if(S.possessionPhase){
      updatePossession();
        } else if(S.compulsionPhase){
      updateCompulsion();
    } else if(S.blindchasePhase){
      updateBlindchase();
    } else if(S.corridorPhase){
      updateCorridor();
    } else if(S.corMultiRicPhase){
      updateCorMultiRic();
    } else if(S.corBlocksPhase){
      updateCorBlocks();
    } else if(S.corRGPhase){
      updateCorRifleGrenade();
    } else if(S.corSpinRapidPhase){
      updateCorSpinRapid();
    } else if(S.corSSPhase){
      updateCorStompSwipe();
    } else if(S.corQuadPhase){
      updateCorQuad();
    } else if(S.healOrbsPhase){
      updateHealOrbsPhase();
    } else if(S.corMRSPhase){
      updateCorMRS();
    } else if(S.cor10Phase){
      updateCor10();
    } else if(!S.meditatePhase && S.atkTimer>=S.atkDur){
      S.zones=[];
      S.turn='player';
      // Reset directly rather than relying solely on the next-frame edge
      // detection above (S._prevTurn==='boss') — that check also requires
      // !S.gameOver, so if gameOver happened to be true on this exact frame
      // (e.g. a hit landed the same frame the attack timer expired), the
      // edge gets silently consumed on the next frame's S._prevTurn=S.turn
      // and never fires again, permanently softlocking actions.
      S.actionLocked=false;
      S.gravity=false; S.vy=0;
      S.arenaRotating=false; S.arenaRotation=0;
      elArena.style.transform='';
      S.platPhase=false;S.floorDmg=false;S.platforms=[];S._runBlitz=false;
      elMenu.style.display='';
      say(S.flattered>=2&&S.bossHP<150?'It seems worn down. Try MERCY.':'What will you do?');
      S.inSub=false;S.subIdx=0;highlightMain();buildSub(S.selAction);
    }
  }
  // These three run on their own flags rather than S.turn==='boss', so they
  // need the same isInputBlocked() pause as the block above independently.
  // Real simulation state (meditate HP, heal-orb positions, etc.), not
  // drawing — must run once per logical tick (here, inside updateOnce) so
  // they get the same 30-ticks/sec floor as everything else above, rather
  // than staying tied to render fps.
  if(S.preMeditatePhase && !isInputBlocked()) updatePreMeditate();
  if(S.meditatePhase && !isInputBlocked()) updateMeditate();
  // Heal orbs run every frame regardless of phase
  if(S.healOrbs&&S.healOrbs.length>0 && !isInputBlocked()) updateHealOrbs();
  // Deliberately last thing in updateOnce(), so it runs after every tick
  // (not just once per rendered frame) — every phase-transition function
  // (however deep in the call chain above) has already run by this point,
  // so this always sees the final S.phase for the tick instead of lagging
  // behind, including mid catch-up when multiple ticks run in one rAF
  // callback. See ui/phaseSavePopup.js for why that lag mattered.
  checkPhaseChange();
}

// Decouple the logical simulation rate from the render rate: floor the sim
// at ~15 ticks/sec so a slow/throttled render rate (busy tab, weak device,
// background throttling) doesn't also slow down game logic (attack timers,
// bullet movement, hit windows) — while leaving today's behavior (exactly
// 1 tick per rendered frame) completely unchanged whenever render fps is
// already >= 15. MAX_STEPS_PER_FRAME caps how many catch-up ticks can run
// in a single rAF callback, so that a long stall (e.g. a backgrounded tab
// waking back up) can't trigger a synchronous burst of ticks large enough
// to itself stall the next frame (a "spiral of death").
//
// state/gameSpeed.js's `enabled` flag (set via ui/gameSpeedPanel.js)
// switches this floor into a hard CAP instead: with the custom rate, a tick
// only runs once enough real time has actually accumulated for it — unlike
// the default branch below, there's no Math.max(1, ...) forcing at least
// one tick per rendered frame, so a high render fps no longer means a
// faster game once a custom rate is active.
//
// MAX_STEPS_PER_FRAME has to be high enough to actually REACH the custom
// rate, not just float below it — at MAX_RATE=120 (state/gameSpeed.js),
// each tick is ~8.3ms, so keeping up through anything short of a real
// stall (render fps down to ~8) needs on the order of 15 catch-up ticks in
// a single rAF callback, not 6. Too low a cap here silently throttles
// "120" down to whatever (cap * actual render fps) works out to.
const STEP_MS = 1000 / 15;
const MAX_STEPS_PER_FRAME = 20;
let _lastTime = null;
let _accumulator = 0;

export function loop(now){
  requestAnimationFrame(loop);
  if(typeof now !== 'number') now = performance.now(); // main.js's initial kickoff call passes no argument
  if(_lastTime === null) _lastTime = now;
  const delta = now - _lastTime;
  _lastTime = now;

  const gs = getGameSpeed();
  if(gs.enabled){
    const stepMs = 1000 / gs.rate;
    _accumulator += delta;
    let steps = 0;
    while(_accumulator >= stepMs && steps < MAX_STEPS_PER_FRAME){
      updateOnce();
      _accumulator -= stepMs;
      steps++;
    }
    if(steps === MAX_STEPS_PER_FRAME) _accumulator = 0;
  } else {
    _accumulator = 0; // don't let a stale buildup bias the next time custom mode turns on
    let steps = Math.max(1, Math.floor(delta / STEP_MS));
    if(steps > MAX_STEPS_PER_FRAME) steps = MAX_STEPS_PER_FRAME;
    for(let i=0; i<steps; i++) updateOnce();
  }
  drawOnce();
}
