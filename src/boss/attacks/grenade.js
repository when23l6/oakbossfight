import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { elMenu } from '../../core/canvasRefs.js';
import { say, updateHP, highlightMain, buildSub } from '../../ui/menu.js';
import { loseGame } from '../../ui/overlay.js';

// ── GRENADE ATTACK ────────────────────────────────
// Boss throws 3 grenades simultaneously from top-center.
// Each follows a parabolic arc to a random landing spot.
// While in-air: show the grenade as a small dot tracing the arc.
// On landing: blast radius circle expands briefly (warn), then explodes (damage).
// Player sees the landing zone the whole time the grenade is in-air — time to dodge.

export const GRN_ARC_DUR    = 47;  // frames grenade is in-air (1.5x faster)
export const GRN_WARN_DUR   = 13;  // frames blast circle pulses after landing (1.5x faster)
export const GRN_BLAST_DUR  = 10;  // frames of active explosion
export const GRN_BLAST_R    = 50;  // blast radius px
export const GRN_WAIT_DUR   = 30;  // frames before throw (1.5x faster)

export function beginGrenade(){
  if(S.grenadePhase) return;
  S.grenadePhase=true;
  S.grenadeTimer=0;
  S.gravity=false; S.vy=0;

  // 3 landing spots — spread wide across the full arena
  const IW=ARENA_W-AM*2, IH=ARENA_H-AM*2;
  const landingXs=[
    AM + IW*0.05 + Math.random()*IW*0.2,
    AM + IW*0.38 + Math.random()*IW*0.24,
    AM + IW*0.72 + Math.random()*IW*0.2,
  ];

  const ox=ARENA_W/2, oy=AM+4;
  S.grenades=landingXs.map(lx=>{
    const ly=AM + IH*0.25 + Math.random()*IH*0.55;
    return {
      ox, oy,
      lx, ly,
      state:'wait',   // 'wait' | 'arc' | 'warn' | 'blast' | 'done'
      timer:0,
    };
  });

  say('Grenades!');
  elMenu.style.display='none';
}

export function updateGrenade(){
  if(!S.grenadePhase) return;
  S.grenadeTimer++;

  // Player free movement
  if(!S.gameOver){
  if(S.keys['ArrowLeft']||S.keys['a'])  S.px=Math.max(AM+9, S.px-3.2);
  if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(ARENA_W-AM-9, S.px+3.2);
  if(S.keys['ArrowUp']||S.keys['w'])    S.py=Math.max(AM+9, S.py-3.2);
  if(S.keys['ArrowDown']||S.keys['s'])  S.py=Math.min(ARENA_H-AM-9, S.py+3.2);
  }

  let allDone=true;
  for(const g of S.grenades){
    if(g.state==='done') continue;
    allDone=false;
    g.timer++;

    if(g.state==='wait'){
      if(g.timer>=GRN_WAIT_DUR){ g.state='arc'; g.timer=0; }

    } else if(g.state==='arc'){
      if(g.timer>=GRN_ARC_DUR){ g.state='warn'; g.timer=0; }

    } else if(g.state==='warn'){
      if(g.timer>=GRN_WARN_DUR){ g.state='blast'; g.timer=0; S.shakeFrames=6; }

    } else if(g.state==='blast'){
      // Damage player if inside blast radius
      if(S.pHitFlash<=0&&S.pSilentFlash<=0){
        const dx=S.px-g.lx, dy=S.py-g.ly;
        if(Math.sqrt(dx*dx+dy*dy)<GRN_BLAST_R+6){
          S.playerHP=Math.max(0,S.playerHP-7);
          S.pHitFlash=40; updateHP();
          if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.grenadePhase=false;setTimeout(loseGame,500);}
        }
      }
      if(g.timer>=GRN_BLAST_DUR){ g.state='done'; }
    }
  }

  if(allDone){
    S.grenadePhase=false;
    S.grenades=[];
    S.turn='player';
    S.actionLocked=false;
    elMenu.style.display='';
    say('What will you do?');
    S.inSub=false;S.subIdx=0;highlightMain();buildSub(S.selAction);
  }
}
