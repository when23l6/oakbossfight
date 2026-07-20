import { S } from '../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../state/constants.js';
import { clearSub } from '../ui/menu.js';
import { scheduleZones } from './zones.js';

// Small local helper (was a free function in the original monolith); kept
// local since it has no dependency on S/DOM and is only used here for the
// attack-pool picks below.
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}

function bossAttack(){
  S.turn='boss'; S.zones=[]; S.particles=[];
  S.px=ARENA_W/2; S.py=ARENA_H-AM-9;
  S.atkTimer=0; S.atkDur=240;
  // Grant silent iframes at attack start — no animation, just blocks damage
  S.pSilentFlash=30;
  const ph3pool=['swipe','stomp','barrage','slash','circle','memory_line','blocks'];
  const ph2pool=['swipe','stomp','barrage','slash','circle'];
  const ph1pool=['swipe','stomp','barrage','slash'];
  if(S.phase===4){
    S.attack='phase4_all';
  } else if(S.phase>=8){
    S.attack='corridor';
  } else if(S.phase>=7){
    const ph7pool=['possession','compulsion','blindchase'];
    S.attack=ph7pool[Math.floor(Math.random()*ph7pool.length)];
  } else if(S.phase>=6){
    const ph6pool=['rifle','ricochet','rapidfire','grenade'];
    S.attack=ph6pool[Math.floor(Math.random()*ph6pool.length)];
  } else if(S.phase===5){
    const ph5pool=['dropper','line_360','spinner','walls'];
    S.attack=ph5pool[Math.floor(Math.random()*ph5pool.length)];
  } else if(S.phase===3){
    const pool=ph3pool.filter(a=>a!==S.attack);
    S.attack=pick(pool);
  } else if(S.phase===2){
    const pool=ph2pool.filter(a=>a!==S.attack);
    S.attack=pick(pool);
  } else {
    const pool=ph1pool.filter(a=>a!==S.attack);
    S.attack=pick(pool);
  }
  clearSub();
  S.gravity=S.attack==='stomp';
  S.dropperPhase=false;
  S.riflePhase=false;
  S.ricochetPhase=false;
  S.rapidfirePhase=false;
  S.grenadePhase=false;
  S.possessionPhase=false;
  S.compulsionPhase=false;
  S.blindchasePhase=false;
  S.corridorPhase=false;
  if(S.gravity){S.px=ARENA_W/2;S.py=ARENA_H-AM-9;S.vy=0;}
  S.arenaRotation=0; S.arenaRotating=(S.attack==='slash_rotate');
  // Pre-schedule all hitboxes for this attack pattern
  scheduleZones(S.attack);
  // Phase 4: add 0.5 sec (30f) gap at start of each attack
  if(S.phase>=4){
    for(const z of S.zones) z.startTick+=30;
  }
  // compute atkDur from actual zone schedule (ignore infinite-duration zones like zigzag)
  {
    let maxEnd=0;
    for(const z of S.zones){
      if(z.activeDur>=9999) continue; // skip infinite zones
      const e=(z.startTick||0)+(z.warnDur||0)+(z.activeDur||60);
      if(e>maxEnd) maxEnd=e;
    }
    if(maxEnd>0) S.atkDur=maxEnd+50;
  }
}

export { bossAttack };
