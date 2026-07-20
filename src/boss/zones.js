import { S } from '../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../state/constants.js';
import { elMenu } from '../core/canvasRefs.js';
import { say } from '../ui/menu.js';
import { beginWalls } from './attacks/walls.js';
import { beginDropper } from './attacks/dropper.js';
import { beginRifle } from './attacks/rifle.js';
import { beginRicochet } from './attacks/ricochet.js';
import { beginRapidfireAttack } from './attacks/rapidfire.js';
import { beginGrenade } from './attacks/grenade.js';
import { beginPossession } from './attacks/possession.js';
import { beginCompulsion } from './attacks/compulsion.js';
import { beginBlindchase } from './attacks/blindchase.js';
import { beginCorridor } from './attacks/corridor.js';
import { updateZones } from './zonesUpdate.js';
import { scheduleLegacyA } from './zonesLegacyA.js';
import { scheduleLegacyB } from './zonesLegacyB.js';
import { scheduleTicks, msToTicks } from '../core/tickTimer.js';

// Each zone: {x,y,w,h, warn, active, done, color, warnDur, activeDur, startTick}
// warn phase: transparent flashing danger overlay
// active phase: solid hitbox that damages
// Zone factory — provides warn/active/done defaults so call sites don't repeat them
function makeZone(props){ return Object.assign({warn:false,active:false,done:false},props); }

// Shared 4-pass slash pattern used by slash_rotate attack and phase4_all sub-attack.
// T0: startTick offset. color: beam color. extra: additional props merged onto each zone (e.g. {rotLayer:true}).
function scheduleSlashRotateZones(T0, color, extra){
  const IW=ARENA_W-AM*2, IH=ARENA_H-AM*2;
  const beamW=14, WARN=17, ACT=15, safeGap=32, count=10, interval=8;
  const usable=IW-safeGap-beamW, step=Math.floor(usable/(count-1));
  const beamH=14, usableY=IH-safeGap-beamH, stepY=Math.floor(usableY/(count-1));
  const colorH = color==='#cc44ff'?'#ff44cc':color; // horizontal beam color
  const mk = props => makeZone(extra ? Object.assign({},props,extra) : props);
  const p2s=T0+count*interval+WARN+ACT+10;
  const p3s=p2s+count*interval+WARN+ACT+10;
  const p4s=p3s+count*interval+WARN+ACT+10;
  for(let i=0;i<count;i++) S.zones.push(mk({x:AM+i*step,y:AM,w:beamW,h:IH,color,warnDur:WARN,activeDur:ACT,startTick:T0+i*interval}));
  for(let i=0;i<count;i++) S.zones.push(mk({x:(ARENA_W-AM-beamW)-i*step,y:AM,w:beamW,h:IH,color,warnDur:WARN,activeDur:ACT,startTick:p2s+i*interval}));
  for(let i=0;i<count;i++){
    const t=p3s+i*interval;
    S.zones.push(mk({x:AM+i*step,y:AM,w:beamW,h:IH,color,warnDur:WARN,activeDur:ACT,startTick:t}));
    S.zones.push(mk({x:AM,y:AM+i*stepY,w:IW,h:beamH,color:colorH,warnDur:WARN,activeDur:ACT,startTick:t}));
  }
  for(let i=0;i<count;i++){
    const t=p4s+i*interval;
    S.zones.push(mk({x:(ARENA_W-AM-beamW)-i*step,y:AM,w:beamW,h:IH,color,warnDur:WARN,activeDur:ACT,startTick:t}));
    S.zones.push(mk({x:AM,y:(ARENA_H-AM-beamH)-i*stepY,w:IW,h:beamH,color:colorH,warnDur:WARN,activeDur:ACT,startTick:t}));
  }
}

function scheduleZones(atk){
  S.zones=[];
  const IW=ARENA_W-AM*2, IH=ARENA_H-AM*2;
  const ph2=S.phase>=2;
  const ph3=S.phase>=3;
  const ph4=S.phase>=4;

  // Legacy pattern-based attacks (swipe/stomp/slash/barrage/circle/memory_line/
  // blocks/slash_rotate/phase4_all/line_360/spinner+zigzag) — each dispatcher
  // internally checks atk and no-ops if it doesn't match, exactly like the
  // original single if/else-if chain (atk is one string, so only one branch
  // across both calls plus the triggers below ever actually runs).
  scheduleLegacyA(atk, ph2, ph3, IW, IH);
  scheduleLegacyB(atk, ph2, ph3, ph4, IW, IH);

  // Windup delays below use scheduleTicks() (core/tickTimer.js), not
  // setTimeout() — these are gameplay pacing (how long before the attack
  // actually starts), so they scale with gamespeed like everything else
  // tick-driven instead of staying a fixed real-world pause regardless of
  // how fast the game is set to run.

  // Walls: handled by updateWalls, scheduleZones just sets a long atkDur
  if(atk==='walls'){
    S.atkDur=99999; // handled by updateWalls
    scheduleTicks(msToTicks(300), ()=>{ if(S.attack==='walls') beginWalls(); });
  }

  // Dropper: handled by updateDropper, scheduleZones just sets a long atkDur
  if(atk==='dropper'){
    S.atkDur=99999; // updateDropper will end the attack itself
    // Kick off the dropper phase after a short delay
    scheduleTicks(msToTicks(400), ()=>{ if(S.attack==='dropper') beginDropper(); });
  }

  // Rifle: handled entirely by updateRifle/drawRifle
  if(atk==='rifle'){
    S.atkDur=99999;
    scheduleTicks(msToTicks(300), ()=>{ if(S.attack==='rifle') beginRifle(); });
  }

  // Ricochet: bullet bounces 5 times, re-aims at player each bounce
  if(atk==='ricochet'){
    S.atkDur=99999;
    scheduleTicks(msToTicks(300), ()=>{ if(S.attack==='ricochet') beginRicochet(); });
  }

  // Rapidfire: 20 bullets fired one at a time, each aimed at player's current pos
  if(atk==='rapidfire'){
    S.atkDur=99999;
    scheduleTicks(msToTicks(300), ()=>{ if(S.attack==='rapidfire') beginRapidfireAttack(); });
  }

  // Grenade: 3 grenades thrown simultaneously, arc to random spots, show blast radius, explode
  if(atk==='grenade'){
    S.atkDur=99999;
    scheduleTicks(msToTicks(300), ()=>{ if(S.attack==='grenade') beginGrenade(); });
  }

  // Phase 7 attacks: stay on player turn during delay so game loop doesn't softlock
  if(atk==='possession'||atk==='compulsion'||atk==='blindchase'||atk==='corridor'){
    S.atkDur=99999;
    S.turn='player'; elMenu.style.display='none'; say('...');
    if(atk==='possession')  scheduleTicks(msToTicks(1000), ()=>{ if(S.attack==='possession') { S.turn='boss'; beginPossession(); }});
    if(atk==='compulsion')  scheduleTicks(msToTicks(1000), ()=>{ if(S.attack==='compulsion') { S.turn='boss'; beginCompulsion(); }});
    if(atk==='blindchase')  scheduleTicks(msToTicks(1000), ()=>{ if(S.attack==='blindchase') { S.turn='boss'; beginBlindchase(); }});
    if(atk==='corridor')    scheduleTicks(msToTicks(1000), ()=>{ if(S.attack==='corridor')   { S.turn='boss'; beginCorridor(); }});
  }
}

export { makeZone, scheduleSlashRotateZones, scheduleZones, updateZones };
