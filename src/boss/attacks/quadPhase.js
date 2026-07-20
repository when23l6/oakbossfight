// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 4662-4862
// (── QUAD SURVIVAL PHASE ── header comment through the end of function
// updateQuad()). Logic only — rendering is shared/entangled with `corQuad`
// and is handled by a separate render subtask (boss/render/quadDraw.js).
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { say, updateHP } from '../../ui/menu.js';
import { loseGame } from '../../ui/overlay.js';
import { elArena } from '../../core/canvasRefs.js';
import { phase5cs } from '../../cutscenes/phase5.js';

// ── QUAD SURVIVAL PHASE ──────────────────────────
// Arena is divided into 4 quadrants (2x2). Each round, 3 quads fill with
// falling killbrick slabs. Player must move to the 1 safe quad.
// Safe quad is always adjacent (shares an edge) to the previous safe quad.
// Round duration: 60 frames (1 sec). Slabs fill over first ~45 frames,
// active kill window the last 15 frames. Total: 20 rounds then back to player.

// Quad layout (indices):
//   0 | 1
//  -------
//   2 | 3
// Adjacent map: which quads share an edge with each quad
// Columns 0-3 left to right. Adjacent = neighbours sharing a side.
export const QUAD_ADJ = [[1],[0,2],[1,3],[2]]; // column adjacency

export function beginQuadPhase(){
  S.quadPhase=true;
  S.quadTimer=0;
  S.quadRound=0;
  S.quadSlabs=[];
  S.quadKeyHeld=false;
  S.quadShowPrevTimer=0;
  S.quadBlackout=false;
  S.quadBlackTimer=0;
  S.quadRotation=0;
  S.gravity=false;
  S.vy=0;
  // 4 vertical columns. Safe col chosen randomly, player starts elsewhere.
  S.quadSafe=Math.floor(Math.random()*4);
  S.quadPrev=-1;
  // Pre-pick next safe so the ghost preview works from round 1
  const adj0=QUAD_ADJ[S.quadSafe];
  S.quadNextSafe=adj0[Math.floor(Math.random()*adj0.length)];
  const startCol=(S.quadSafe+1)%4;
  _quadTeleportToQuad(startCol);
  say('The arena fractures. Find the safe column!');
  _buildQuadSlabs();
}

export function _quadCenter(q){
  // 4 equal-width vertical columns
  const IW=ARENA_W-AM*2, IH=ARENA_H-AM*2;
  const cw=IW/4;
  return { x: AM + q*cw + cw/2, y: AM + IH/2 };
}

export function _quadTeleportToQuad(q){
  const c=_quadCenter(q);
  S.px=c.x;
  if(!S.corQuadPhase) S.py=ARENA_H-AM-9;
  S.quadPlayerQuad=q;
}

export function _buildQuadSlabs(){
  // Each dangerous column gets one slab object that falls from the top
  S.quadSlabs=[];
  for(let q=0;q<4;q++){
    if(q===S.quadSafe) continue;
    S.quadSlabs.push({col:q, y:0, active:false});
  }
  S.quadTimer=0;
}

export function _quadRoundDur(){
  const base=Math.max(36, 45 - Math.floor(S.quadRound/5)*9);
  if(S._quadFrenzy){
    // Frenzy quad: always keeps accelerating, never slows down
    const speedMult=Math.min(5, 1 + Math.floor(S._quadFrenzyRound/5)*0.5);
    return Math.max(8, Math.round(base/(speedMult*3)));
  }
  if(S.quadRound>=25) return 30;
  if(S._quadSlowAfter>0 && S.quadRound>=S._quadSlowAfter) return Math.max(10, Math.round(base*(2/3)));
  return base;
}

export function _quadBlackDur(){
  // Rounds 26-30: 6f (0.1s blackout). Others: 18f (0.3s)
  return S.quadRound>=25 ? 6 : 18;
}

export function updateQuad(){
  if(!S.quadPhase) return;
  if(S.meditatePhase) return; // quad visuals freeze during meditate

  // ── Blackout phase (between rounds 21-30) ──
  if(S.quadBlackout){
    S.quadBlackTimer++;
    const DUR=_quadBlackDur();
    if(S.quadBlackTimer>=DUR){
      // Blackout ends: snap rotation, reveal arena, start slabs
      S.quadBlackout=false;
      S.quadRotation=[0,90,180,270][Math.floor(Math.random()*4)];
      // Apply rotation to arena element
      elArena.style.transition='none';
      elArena.style.transform=`rotate(${S.quadRotation}deg)`;
      _buildQuadSlabs();
    }
    return; // freeze everything during blackout
  }

  const isSlow = false; // unused now
  S.quadTimer++;
  const ROUND_DUR=_quadRoundDur();

  const IH = ARENA_H - AM*2;
  const ARRIVE = Math.floor(ROUND_DUR * 0.82);
  const prog = Math.min(1, S.quadTimer / ARRIVE);
  const eased = prog * prog;
  const slabTopFull = AM - IH + IH * eased;

  if(S.quadNextSafe===undefined) S.quadNextSafe=S.quadSafe;
  if(S.quadShowPrevTimer>0) S.quadShowPrevTimer--;

  for(const sl of S.quadSlabs){
    sl.y = slabTopFull;
    sl.active = (sl.y + IH) >= (ARENA_H - AM - 12);
  }

  // Key-press teleport left/right only (columns)
  const wantLeft  = S.keys['ArrowLeft'] ||S.keys['a'];
  const wantRight = S.keys['ArrowRight']||S.keys['d'];
  const anyKey = wantLeft||wantRight;

  if(anyKey && !S.quadKeyHeld && !S.gameOver){
    S.quadKeyHeld=true;
    const q=S.quadPlayerQuad;
    let target=q;
    if(wantLeft  && q>0) target=q-1;
    if(wantRight && q<3) target=q+1;
    if(target!==q) _quadTeleportToQuad(target);
  }
  if(!anyKey) S.quadKeyHeld=false;

  // Damage if player is in a dangerous column and slab is active
  const playerInDanger=S.quadSlabs.some(sl=>sl.active && sl.col===S.quadPlayerQuad);
  if(playerInDanger && S.pHitFlash<=0&&S.pSilentFlash<=0){
    const dmg=(S._quadSlowAfter>0 && S.quadRound>=S._quadSlowAfter) ? 1 : 2;
    S.playerHP=Math.max(0,S.playerHP-dmg);
    S.pHitFlash=30; updateHP();
    if(S.playerHP<=0 && !S.gameOver){S.gameOver=true;setTimeout(loseGame,500);}
  }

  // Round over
  if(S.quadTimer>=ROUND_DUR){
    S.quadRound++;
    if(S._quadFrenzy) S._quadFrenzyRound++;
    S.shakeFrames=6;
    const quadEnd=S._quadMaxRounds||30;
    if(S.quadRound>=quadEnd){
      S.quadPhase=false;
      S.quadSlabs=[];
      S.quadBlackout=false;
      S.quadRotation=0;
      S._quadMaxRounds=0;
      S._quadSlowAfter=0;
      S._quadSlowFrac=0;
      elArena.style.transform='';
      if(quadEnd===20){
        if(!S._meditateUsed){
          // Start frenzy quad — gets faster until player dies
          S._quadFrenzy=true;
          S._quadFrenzyRound=0;
          beginQuadPhase();
          S._quadMaxRounds=99999;
        }
        // else: meditate already done — softlock
      } else {
        phase5cs();
      }
    } else {
      // Pick next safe
      S.quadPrev=S.quadSafe;
      S.quadShowPrevTimer=18;
      S.quadSafe=S.quadNextSafe;
      const adj=QUAD_ADJ[S.quadSafe];
      S.quadNextSafe=adj[Math.floor(Math.random()*adj.length)];

      // Dialogue milestones
      if(!S.meditatePhase){
        if(S.quadRound===5)  say("It's speeding up!");
        if(S.quadRound===10) say('Faster! Read the light!');
        if(S.quadRound===15) say("Almost there — don't slip now!");
        if(S.quadRound===20) say('...He flicks his fingers. Everything goes dark.');
        if(S.quadRound===25) say('No time to think. Just move.');
      }

      if(S.quadRound>=20){
        // Rounds 21-30: boss flicks → -10 HP → blackout → rotation
        S.bossHP=Math.max(0,S.bossHP-10);
        S.bossHitFlash=12;
        updateHP();
        S.quadBlackout=true;
        S.quadBlackTimer=0;
        S.quadSlabs=[];
        // Rotation will be applied and slabs built when blackout ends
      } else {
        _buildQuadSlabs();
      }
    }
  }
}
