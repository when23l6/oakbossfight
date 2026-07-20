// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 3970-4172
// (── CORRIDOR ATTACK 10 — Spinning Circle ── header comment through the end
// of function updateCor10()). Logic only — the "plat" sub-stage's rendering
// reuses the `platforms` attack's render block in the original (handled by a
// separate render subtask).
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { makeZone, updateZones } from '../zones.js';
import { say, updateHP } from '../../ui/menu.js';
import { loseGame } from '../../ui/overlay.js';
import { elMenu, elArena } from '../../core/canvasRefs.js';
import { beginQuadPhase } from './quadPhase.js';

// ── CORRIDOR ATTACK 10 — Spinning Circle ──────────────────────────────
// A circle spins in the center. 3 balls orbit on it, bobbing in/out.
// A wall arc (~100°) sweeps around — player must run around the outside.
// Player: free movement in bigger box. Dodge balls + stay ahead of wall.

export const COR10_AM       = 0;
export const COR10_CIRCLE_R = 55;   // base orbit radius
export const COR10_BOB_AMT  = 60;   // higher bob amplitude
export const COR10_BALL_R   = 7;
export const COR10_WALL_ARC = 1.8;  // wall arc span in radians (~100°)
export const COR10_SPIN_SPD = 0.018;
export const COR10_ROUND_DUR = Math.ceil(Math.PI*2/COR10_SPIN_SPD); // ~349 frames per full rotation
export const COR10_DURATION = COR10_ROUND_DUR*2; // 2 full rounds
export const COR10_BALL_COUNT = 15;

export function beginCor10(){
  if(S.cor10Phase) return;
  S.cor10Phase=true;
  S.cor10Timer=0;
  S.cor10Stage='spin';
  S.cor10PlatTimer=0;
  const cx=ARENA_W/2, cy=ARENA_H/2;
  // Start wall on the opposite side from the player
  const pdx=S.px-cx, pdy=S.py-cy;
  const playerAngle=Math.atan2(pdy,pdx);
  S.cor10Angle=playerAngle+Math.PI; // opposite side
  S.gravity=false; S.vy=0;
  S.zones=[];
  // 3 balls evenly spaced, each with a bob phase offset
  S.cor10Balls=Array.from({length:COR10_BALL_COUNT},(_, i)=>({
    offset: (Math.PI*2/COR10_BALL_COUNT)*i,
    bobPhase: (Math.PI*2/COR10_BALL_COUNT)*i*0.7,
  }));
  say('...');
  elMenu.style.display='none';
}

export function updateCor10(){
  if(!S.cor10Phase) return;
  S.cor10Timer++;
  const t=S.cor10Timer;
  if(t<=60 && S.cor10Stage==='spin') return; // 1 sec delay before spin starts
  const tActive=t-60; // offset timer for all logic

  // Spin
  S.cor10Angle+=COR10_SPIN_SPD;

  const cx=ARENA_W/2, cy=ARENA_H/2;

  // ── SPIN STAGE ──
  if(S.cor10Stage==='spin'){
    const round2 = tActive >= COR10_ROUND_DUR;
    // Round 2: replace with 10 evenly spaced balls
    if(tActive===COR10_ROUND_DUR && S.cor10Balls.length===COR10_BALL_COUNT){
      S.cor10Balls=Array.from({length:10},(_,i)=>({
        offset:(Math.PI*2/10)*i,
        bobPhase:(Math.PI*2/10)*i*0.7,
      }));
    }
    const shrinkProg = round2 ? Math.min(1, (tActive - COR10_ROUND_DUR) / 60) : 0;
    const shrink = shrinkProg * 20;

    // Free movement — bigger box (shrinks in round 2)
    if(!S.gameOver){
      if(S.keys['ArrowLeft'] ||S.keys['a']) S.px=Math.max(COR10_AM+6+shrink,S.px-3.5);
      if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(ARENA_W-COR10_AM-6-shrink,S.px+3.5);
      if(S.keys['ArrowUp']   ||S.keys['w']) S.py=Math.max(COR10_AM+6+shrink,S.py-3.5);
      if(S.keys['ArrowDown'] ||S.keys['s']) S.py=Math.min(ARENA_H-COR10_AM-6-shrink,S.py+3.5);
    }
    S.px=Math.max(COR10_AM+6+shrink, Math.min(ARENA_W-COR10_AM-6-shrink, S.px));
    S.py=Math.max(COR10_AM+6+shrink, Math.min(ARENA_H-COR10_AM-6-shrink, S.py));

    // Ball positions + hit detection
    const ballExpandProg=Math.min(1, tActive/60);
    for(const b of S.cor10Balls){
      const angle=S.cor10Angle+b.offset;
      const bob=Math.sin(tActive*0.07+b.bobPhase)*COR10_BOB_AMT;
      const r=(COR10_CIRCLE_R+bob)*ballExpandProg;
      b.x=cx+Math.cos(angle)*r;
      b.y=cy+Math.sin(angle)*r;
      if(S.pHitFlash<=0&&S.pSilentFlash<=0){
        const dx=S.px-b.x, dy=S.py-b.y;
        if(Math.sqrt(dx*dx+dy*dy)<COR10_BALL_R+6){
          S.playerHP=Math.max(0,S.playerHP-2); S.pHitFlash=30; updateHP();
          if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.cor10Phase=false;setTimeout(loseGame,500);}
        }
      }
    }

    // Wall arc hit detection
    const pdx=S.px-cx, pdy=S.py-cy;
    const pDist=Math.sqrt(pdx*pdx+pdy*pdy);
    const pAngle=Math.atan2(pdy,pdx);
    let relAngle=((pAngle-S.cor10Angle)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
    if(relAngle<COR10_WALL_ARC && pDist>8 && S.pHitFlash<=0&&S.pSilentFlash<=0){
      S.playerHP=Math.max(0,S.playerHP-2); S.pHitFlash=30; updateHP();
      if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.cor10Phase=false;setTimeout(loseGame,500);}
    }

    // Transition to plat stage
    if(tActive>=COR10_DURATION){
      S.cor10Stage='plat';
      S.cor10PlatTimer=0;
      S.cor10Balls=[];
      S.platforms=[];
      S.gravity=true; S.vy=0;
      S.py=ARENA_H-AM-9;
      S.zones=[];
      S.pSilentFlash=120; // grace period entering plat stage
      say('...');
    }
    return;
  }

  // ── Platform stage ──
  if(S.cor10Stage==='plat'){
    S.cor10PlatTimer++;
    const pt=S.cor10PlatTimer;
    const IW=ARENA_W-AM*2, IH=ARENA_H-AM*2;
    const platW=50, platH=8;

    // Player movement
    if(!S.gameOver){
      if(S.keys['ArrowLeft'] ||S.keys['a']) S.px=Math.max(AM+9,S.px-3.5);
      if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(ARENA_W-AM-9,S.px+3.5);
    }

    // Spawn 2-3 platforms every 90 frames
    if(pt===1 || (pt%90===0 && pt<1100)){
      const count=2+Math.floor(Math.random()*2); // 2 or 3
      for(let i=0;i<count;i++){
        let px2, tries=0;
        do {
          px2=AM+8+Math.floor(Math.random()*(IW-platW-16));
          tries++;
        } while(tries<10 && S.platforms.some(p=>Math.abs(p.x-px2)<platW+12));
        S.platforms.push({x:px2, y:AM+6, w:platW, h:platH, standing:false});
      }
    }

    // Drop platforms
    for(const p of S.platforms) p.y+=0.7;
    S.platforms=S.platforms.filter(p=>p.y<ARENA_H-AM);

    // Platform collision
    let onPlatform=false;
    for(const p of S.platforms){
      if(S.px+6>p.x&&S.px-6<p.x+p.w&&S.py+8>=p.y&&S.py+8<=p.y+p.h+6&&S.vy>=0){
        S.py=p.y-8; S.vy=0; onPlatform=true;
      }
    }

    // Gravity + jump
    const onGround=S.py>=ARENA_H-AM-10;
    const canJump=onPlatform||onGround;
    if(!canJump){
      S.vy+=0.3;
    } else {
      if(S.keys['ArrowUp']||S.keys['w']||S.keys[' ']||S.keys['Enter']){ S.vy=-5.8; }
      else if(!onPlatform){ S.vy=0; }
    }
    S.py=Math.min(ARENA_H-AM-9,Math.max(AM+9,S.py+S.vy));

    S.cor10FloorDmg = pt > 180;

    // Floor damage after 3 sec (no damage during grace period)
    if(S.cor10FloorDmg&&S.py>=ARENA_H-AM-12&&S.pHitFlash<=0&&S.pSilentFlash<=0){
      S.playerHP=Math.max(0,S.playerHP-3); S.pHitFlash=30; updateHP();
      if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.cor10Phase=false;setTimeout(loseGame,500);}
    }

    // Y-line + X-line beams every 180 frames (~3 sec)
    S.atkTimer++;
    updateZones();
    if(pt>60 && pt%180===0){
      // Vertical beam — random x
      const bx=AM+20+Math.floor(Math.random()*(IW-40));
      S.zones.push(makeZone({x:bx,y:AM,w:36,h:IH,color:'#ff2244',warnDur:50,activeDur:60,startTick:S.atkTimer}));
      // Horizontal beam — random y
      const by=AM+20+Math.floor(Math.random()*(IH-60));
      S.zones.push(makeZone({x:AM,y:by,w:IW,h:28,color:'#ff8800',warnDur:50,activeDur:60,startTick:S.atkTimer+10}));
    }

    // Zone hit detection
    const zoneHit=S.zones.some(z=>z.active&&S.px+6>z.x&&S.px-6<z.x+z.w&&S.py+6>z.y&&S.py-6<z.y+z.h);
    if(zoneHit&&S.pHitFlash<=0&&S.pSilentFlash<=0){
      S.playerHP=Math.max(0,S.playerHP-3); S.pHitFlash=30; updateHP();
      if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.cor10Phase=false;setTimeout(loseGame,500);}
    }

    // End after 20 sec → normal quad x20
    if(pt>=1200){
      S.cor10Phase=false;
      S.cor10Balls=[]; S.platforms=[]; S.zones=[];
      S.gravity=false; S.vy=0; S.cor10FloorDmg=false;
      elArena.style.transform='';
      // Begin normal quad, 20 rounds
      beginQuadPhase();
      S._quadMaxRounds=20;
      S._quadSlowAfter=0; // no slow
    }
  }
}
