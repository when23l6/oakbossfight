// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 3500-3685.
// Logic only (begin/update). Rendering lives in
// src/boss/render/group1Draw.js (ricochet + rapidfire + corMultiRic +
// corSpinRapid + healOrbs).
import { S } from '../../state/gameState.js';
import { CS } from '../../state/cutsceneState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { say, updateHP } from '../../ui/menu.js';
import { elMenu, elArena, elStats, elCsSkip, elSpeaker } from '../../core/canvasRefs.js';
import { csAdvance } from '../../cutscenes/engine.js';
import { spawnParticles } from '../../core/particles.js';
import { beginCorQuad } from './corQuad.js';

// ── HEAL ORBS ─────────────────────────────────────────────────────────────
// After pull phase: 3 orbs spawn from arena corners and fly toward player.
// Each heals 8 HP on touch. If player HP + 8 > max, orb backs away.
// When player HP < 10, backed-away orbs return one at a time.

export const HEAL_ORB_SPEED = 1.8;
export const HEAL_ORB_R     = 10;
export const HEAL_ORB_HEAL  = 8;

export function beginHealOrbs(){
  // Spawn from off-screen edges
  const spawnPoints=[
    {x:-20,          y:ARENA_H/2},       // left edge
    {x:ARENA_W+20,   y:ARENA_H/2},       // right edge
    {x:ARENA_W/2,    y:-20},             // top edge
  ];
  S.healOrbs=spawnPoints.map((sp,i)=>({
    x:sp.x, y:sp.y,
    vx:0, vy:0,
    state:'wait',
    id:i,
    backX:sp.x, backY:sp.y, // fly back here when done
    orbitAngle: (i/3)*Math.PI*2,
    orbitTimer: 0,
  }));

  // Boss monologue — hide arena during speech
  S.gameOver=true;
  elArena.style.display='none';
  elMenu.style.display='none';
  elStats.style.display='none';
  elCsSkip.style.display='block';

  CS.active=true;
  CS.idx=0;
  CS.animTick=0;
  CS.onEnd=()=>{
    CS.active=false;
    elCsSkip.style.display='none';
    elSpeaker.style.display='none';
    elArena.style.display='';
    elStats.style.display='';
    elMenu.style.display='none';
    S.gameOver=false;
    S.turn='boss';
    S.healOrbsPhase=true;
    S.healOrbsTimer=0;
    S.atkDur=99999;
    S.zones=[];
    for(const o of S.healOrbs) o.state='flyin';
  };
  CS.events={};
  CS.lines=[
    "I haven't forgotten a single step of my ascent.",
    "Every innocent soul I snuffed out...",
    "They're etched into my memory.",
    "And the fire?",
    "It was never an accident.",
    "I was the architect of that hell!",
    "All so I could seize this position.",
    "So I could...",
    "So I could finally have everything...",
  ];
  CS.poses=['idle','idle','idle','idle','idle','rage','rage','idle','old'];
  CS.speakers=Array(CS.lines.length).fill('professor');
  csAdvance();
}

export function updateHealOrbsPhase(){
  if(!S.healOrbsPhase) return;
  S.healOrbsTimer++;

  // Free player movement
  if(!S.gameOver){
    if(S.keys['ArrowLeft'] ||S.keys['a']) S.px=Math.max(AM+9,S.px-3.5);
    if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(ARENA_W-AM-9,S.px+3.5);
    if(S.keys['ArrowUp']   ||S.keys['w']) S.py=Math.max(AM+9,S.py-3.5);
    if(S.keys['ArrowDown'] ||S.keys['s']) S.py=Math.min(ARENA_H-AM-9,S.py+3.5);
  }

  // (orb logic runs globally in game loop)

  // Transition to quad once all orbs have settled (orbit, away, or beyond — not still flying in)
  const settled = ['orbit','away','flyaway','flyback','done'];
  if(S.healOrbs.length>0 && S.healOrbs.every(o=>settled.includes(o.state))){
    S.healOrbsPhase=false;
    // Do NOT clear healOrbs — they persist and fly back in later phases
    beginCorQuad();
  }
}

export function updateHealOrbs(){
  if(!S.healOrbs||S.healOrbs.length===0) return;
  // Moved here from render/group1Draw.js — that decremented once per
  // rendered frame, drifting from gamespeed once ticks and frames stopped
  // being 1:1; this runs once per tick instead. Orbs never get spliced out
  // of S.healOrbs (they persist as state==='done'), so this array is never
  // empty again once populated — safe past the early return above.
  if(S._healVfxTimer>0) S._healVfxTimer--;

  // Count how many orbs are currently flying back in (state==='flyback')
  // so we only allow one at a time
  const flybackCount = S.healOrbs.filter(o=>o.state==='flyback'||o.state==='flyin').length;

  for(const o of S.healOrbs){
    if(o.state==='done') continue;

    if(o.state==='flyin'){
      // Initial fly-in from spawn edge to orbit
      const targetX=S.px+Math.cos(o.orbitAngle)*60;
      const targetY=S.py+Math.sin(o.orbitAngle)*60;
      const dx=targetX-o.x, dy=targetY-o.y;
      const dist=Math.sqrt(dx*dx+dy*dy)||1;
      o.x+=(dx/dist)*3.5;
      o.y+=(dy/dist)*3.5;
      if(dist<6){ o.state='orbit'; o.orbitTimer=0; }

    } else if(o.state==='orbit'){
      o.orbitTimer++;
      o.orbitAngle+=0.025;
      const R=60;

      // Can this orb heal without exceeding max?
      const wouldExceed = S.playerHP+HEAL_ORB_HEAL > S.playerMax;
      // Only one orb heals at a time — the first orbiting one when heal is safe
      const canHeal = !wouldExceed;
      const isFirst = canHeal && S.healOrbs.find(x=>x.state==='orbit')===o;

      if(isFirst){
        // Drift toward player
        const dx=S.px-o.x, dy=S.py-o.y;
        const dist=Math.sqrt(dx*dx+dy*dy)||1;
        o.x+=(dx/dist)*2.5;
        o.y+=(dy/dist)*2.5;
        if(dist<HEAL_ORB_R+8){
          S.playerHP=Math.min(S.playerMax, S.playerHP+HEAL_ORB_HEAL);
          updateHP();
          spawnParticles(S.px,S.py,'#44ffaa',12,3,16);
          S._healVfxTimer=40;
          // Fly away after healing — disappears once offscreen
          o.state='flyaway';
        }
      } else {
        o.x=S.px+Math.cos(o.orbitAngle)*R;
        o.y=S.py+Math.sin(o.orbitAngle)*R;
      }

      // Full and timed out — fly away
      if(o.state==='orbit' && o.orbitTimer>=240 && wouldExceed){
        o.state='flyaway';
      }

    } else if(o.state==='flyaway'){
      // Fly toward own spawn point (offscreen)
      const dx=o.backX-o.x, dy=o.backY-o.y;
      const dist=Math.sqrt(dx*dx+dy*dy)||1;
      o.x+=(dx/dist)*4;
      o.y+=(dy/dist)*4;
      // Once offscreen, become 'away' and wait
      if(o.x<-15||o.x>ARENA_W+15||o.y<-15||o.y>ARENA_H+15||dist<6){
        o.x=o.backX; o.y=o.backY;
        o.state='away';
      }

    } else if(o.state==='away'){
      // Watch for HP dropping below 12 — fly back one at a time, only if heal won't exceed max
      const hpLow = S.playerHP < 12;
      const noOneComingBack = S.healOrbs.filter(x=>x.state==='flyback').length===0;
      const healSafe = S.playerHP + HEAL_ORB_HEAL <= S.playerMax;
      if(hpLow && noOneComingBack && healSafe){
        o.state='flyback';
        o.orbitTimer=0;
        break; // only send one at a time — stop looping so others don't trigger same tick
      }

    } else if(o.state==='flyback'){
      // Fly toward player, heal on contact, then disappear permanently
      const dx=S.px-o.x, dy=S.py-o.y;
      const dist=Math.sqrt(dx*dx+dy*dy)||1;
      o.x+=(dx/dist)*4;
      o.y+=(dy/dist)*4;
      if(dist<HEAL_ORB_R+8){
        S.playerHP=Math.min(S.playerMax, S.playerHP+HEAL_ORB_HEAL);
        updateHP();
        spawnParticles(S.px,S.py,'#44ffaa',12,3,16);
        S._healVfxTimer=40;
        o.state='done'; // gone permanently
      }
    }
  }

}
