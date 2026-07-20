// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 3688-3820.
// Logic only (begin/update) — this attack's RENDERING is shared/entangled
// with `quadPhase` via a combined block in the original code, handled by a
// separate render subtask (see src/boss/render/quadDraw.js).
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { makeZone } from '../zones.js';
import { say, updateHP } from '../../ui/menu.js';
import { elMenu, elArena } from '../../core/canvasRefs.js';
import { loseGame } from '../../ui/overlay.js';
import { QUAD_ADJ, _quadTeleportToQuad, _buildQuadSlabs, _quadRoundDur } from './quadPhase.js';
import { beginCor10 } from './cor10.js';

// ── CORRIDOR QUAD (phase 8 variant) ──
// Rounds 1-5:  teleport only (normal quad)
// Rounds 6-10: + shockwave each round + gravity (can jump)
// Rounds 11+:  no rotation, keep jump+shockwave, stop at round 15

export function beginCorQuad(){
  if(S.corQuadPhase) return;
  S.corQuadPhase=true;
  // Reuse quad state
  S.quadPhase=false; // we drive it ourselves
  S.quadTimer=0;
  S.quadRound=0;
  S.quadSlabs=[];
  S.quadKeyHeld=false;
  S.quadShowPrevTimer=0;
  S.quadBlackout=false;
  S.quadBlackTimer=0;
  S.quadRotation=0;
  S.gravity=false; S.vy=0;
  S.quadSafe=Math.floor(Math.random()*4);
  S.quadPrev=-1;
  const adj0=QUAD_ADJ[S.quadSafe];
  S.quadNextSafe=adj0[Math.floor(Math.random()*adj0.length)];
  const startCol=(S.quadSafe+1)%4;
  _quadTeleportToQuad(startCol);
  elArena.style.transform='';
  _buildQuadSlabs();
  elMenu.style.display='none';
}

export function updateCorQuad(){
  if(!S.corQuadPhase) return;

  const phase2 = S.quadRound >= 5;  // shockwave
  const phase3 = S.quadRound >= 10; // no rotation

  // Gravity on in phase 2+ — player can jump but X movement is teleport
  if(phase2){
    S.vy+=0.28;
    const onGround=S.py>=ARENA_H-AM-9;
    if(!S.gameOver){
      if((S.keys['ArrowUp']||S.keys['w']||S.keys[' ']||S.keys['Enter'])&&onGround) S.vy=-5.5;
    }
    S.py=Math.min(ARENA_H-AM-9, S.py+S.vy);
    if(S.py>=ARENA_H-AM-9) S.vy=0;
  } else {
    S.py=ARENA_H-AM-9; S.vy=0;
  }

  S.quadTimer++;
  const ROUND_DUR=_quadRoundDur();
  const IH=ARENA_H-AM*2;
  const ARRIVE=Math.floor(ROUND_DUR*0.82);
  const prog=Math.min(1,S.quadTimer/ARRIVE);
  const eased=prog*prog;
  const slabTopFull=AM-IH+IH*eased;

  if(S.quadNextSafe===undefined) S.quadNextSafe=S.quadSafe;
  if(S.quadShowPrevTimer>0) S.quadShowPrevTimer--;

  for(const sl of S.quadSlabs){
    sl.y=slabTopFull;
    sl.active=(sl.y+IH)>=(ARENA_H-AM-12);
  }

  // Always teleport left/right (normal quad movement)
  const wantLeft=S.keys['ArrowLeft']||S.keys['a'];
  const wantRight=S.keys['ArrowRight']||S.keys['d'];
  const anyKey=wantLeft||wantRight;
  if(anyKey&&!S.quadKeyHeld&&!S.gameOver){
    S.quadKeyHeld=true;
    const q=S.quadPlayerQuad;
    let target=q;
    if(wantLeft&&q>0) target=q-1;
    if(wantRight&&q<3) target=q+1;
    if(target!==q) _quadTeleportToQuad(target);
  }
  if(!anyKey) S.quadKeyHeld=false;

  // Slab damage
  const playerInDanger=S.quadSlabs.some(sl=>sl.active&&sl.col===S.quadPlayerQuad);
  if(playerInDanger&&S.pHitFlash<=0&&S.pSilentFlash<=0){
    S.playerHP=Math.max(0,S.playerHP-2); S.pHitFlash=30; updateHP();
    if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;setTimeout(loseGame,500);}
  }
  // Wave damage
  const waveHit=S.zones.some(z=>z.type==='wave_lr'&&z.active&&S.px+6>z.x&&S.px-6<z.x+z.w&&S.py+6>z.y&&S.py-6<z.y+z.h);
  if(waveHit&&S.pHitFlash<=0&&S.pSilentFlash<=0){
    S.playerHP=Math.max(0,S.playerHP-2); S.pHitFlash=30; updateHP();
    if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;setTimeout(loseGame,500);}
  }

  // Round over
  if(S.quadTimer>=ROUND_DUR){
    S.quadRound++;
    S.shakeFrames=6;

    if(S.quadRound>=15){
      S.corQuadPhase=false;
      S.quadSlabs=[]; S.quadBlackout=false; S.quadRotation=0;
      S.gravity=false; S.vy=0;
      elArena.style.transform='';
      S.zones=[];
      beginCor10();
      return;
    }

    S.quadPrev=S.quadSafe;
    S.quadShowPrevTimer=18;
    S.quadSafe=S.quadNextSafe;
    const adj=QUAD_ADJ[S.quadSafe];
    S.quadNextSafe=adj[Math.floor(Math.random()*adj.length)];

    if(S.quadRound===5)  say('Shockwaves incoming!');
    if(S.quadRound===10) say('No more rotations. Stay sharp!');

    if(phase2 && S.quadRound>=10 && S.quadRound<15){
      // Rotation starts after 5 shockwave rounds (rounds 10-14)
      S.quadRotation=[0,90,180,270][Math.floor(Math.random()*4)];
      elArena.style.transform=`rotate(${S.quadRotation}deg)`;
    } else if(S.quadRound>=15){
      S.quadRotation=0;
      elArena.style.transform='';
    }

    if(phase2){
      // Wave spawns the same frame slabs start falling.
      // Player sees both coming at once and must handle both.
      S.zones.push(makeZone({type:'wave_lr',startTick:S.atkTimer,color:'#2255ff',x:ARENA_W-AM,y:0,w:20,h:0}));
    }
    _buildQuadSlabs();
  }
}
