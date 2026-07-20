// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 3032-3100
// (split out of corRifleGrenade.js to stay under the 300-line file limit).
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { say } from '../../ui/menu.js';
import { RIFLE_WALL_W, RIFLE_WALL_H, _rifleWallYs, _rifleAngleToPlayer } from './rifle.js';

// ── CORRIDOR RIFLE + GRENADE (phase 8 combo) ──
// Each cycle: 5 grenades → rifle shot. 3 cycles total.
// Attack button: big yellow "ATTACK" text with white border at top-center.
// Stepping on it during aim → boss dodges (shot skipped), button gone, continues.
export const CRG_SPD = 0.5; // player speed multiplier

export function _spawnCorGrenades(){
  const IW=ARENA_W-AM*2, IH=ARENA_H-AM*2;
  const lxs=[
    AM+IW*0.05+Math.random()*IW*0.12,
    AM+IW*0.22+Math.random()*IW*0.12,
    AM+IW*0.44+Math.random()*IW*0.12,
    AM+IW*0.64+Math.random()*IW*0.12,
    AM+IW*0.82+Math.random()*IW*0.12,
  ];
  // Do NOT set S.grenadePhase — managed entirely inside updateCorRifleGrenade
  S.grenades=lxs.map((lx,i)=>({
    ox:ARENA_W/2, oy:AM+4, lx,
    ly:AM+IH*0.25+Math.random()*IH*0.55,
    state:'wait', timer:0, _waitOffset:i*15,
  }));
}

export function _corRGMove(){
  const spd=3.2*CRG_SPD;
  if(!S.gameOver){
    if(S.keys['ArrowLeft'] ||S.keys['a']) S.px=Math.max(AM+9,S.px-spd);
    if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(ARENA_W-AM-9,S.px+spd);
    if(S.keys['ArrowUp']   ||S.keys['w']) S.py=Math.max(AM+9,S.py-spd);
    if(S.keys['ArrowDown'] ||S.keys['s']) S.py=Math.min(ARENA_H-AM-9,S.py+spd);
  }
}

export function _startCorRifleShot(){
  S.corRGStage='rifle';
  S.corRGButtonActive=true;
  S.rifleTimer=0;
  S.rifleState='aim';
  S.rifleAimAngle=_rifleAngleToPlayer();
  // Only spawn walls on first shot — they persist and don't regen
  if(S.corRGCycle===0){
    const ys=_rifleWallYs();
    S.rifleWalls=[
      {x:AM+14,                      y:ys[0],w:RIFLE_WALL_W,h:RIFLE_WALL_H,alive:true,shatterTimer:0,vx: 1.2},
      {x:ARENA_W-AM-14-RIFLE_WALL_W, y:ys[1],w:RIFLE_WALL_W,h:RIFLE_WALL_H,alive:true,shatterTimer:0,vx:-1.6},
      {x:AM+14,                      y:ys[2],w:RIFLE_WALL_W,h:RIFLE_WALL_H,alive:true,shatterTimer:0,vx: 1.0},
    ];
  }
  S.rifleBullet=null;
  say('He raises the rifle!');
}
