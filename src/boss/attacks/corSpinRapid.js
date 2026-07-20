// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 3330-3417.
// Logic only (begin/update) — rendering lives in
// src/boss/render/group1Draw.js (ricochet + rapidfire + corMultiRic +
// corSpinRapid + healOrbs).
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { say, updateHP } from '../../ui/menu.js';
import { elMenu } from '../../core/canvasRefs.js';
import { loseGame } from '../../ui/overlay.js';
import { beginCorStompSwipe } from './corStompSwipe.js';

// ── CORRIDOR SPIN RAPID — spinning box fires bullets in all directions ──
export const CSR_BOX_HALF = 30;   // half-size of the spinning box
export const CSR_SPD      = 0.04; // rotation speed rad/frame
export const CSR_BULLET_SPD = 3.5;
export const CSR_BULLET_R   = 4;
export const CSR_TOTAL    = 60;   // total bullets to fire
export const CSR_INTERVAL = 5;    // frames between shots (fires 4 at a time)
export const CSR_DURATION = 420;  // total frames (~7 sec)

export function beginCorSpinRapid(){
  if(S.corSpinRapidPhase) return;
  S.corSpinRapidPhase=true;
  S.corSpinTimer=0;
  S.corSpinAngle=0;
  S.corSpinBullets=[];
  S.gravity=false; S.vy=0;
  S.px=ARENA_W/2; S.py=ARENA_H-AM-9;
  say('...');
  elMenu.style.display='none';
}

export function updateCorSpinRapid(){
  if(!S.corSpinRapidPhase) return;
  S.corSpinTimer++;
  const t=S.corSpinTimer;

  // Player free movement
  if(!S.gameOver){
    if(S.keys['ArrowLeft'] ||S.keys['a']) S.px=Math.max(AM+9,S.px-3.5);
    if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(ARENA_W-AM-9,S.px+3.5);
    if(S.keys['ArrowUp']   ||S.keys['w']) S.py=Math.max(AM+9,S.py-3.5);
    if(S.keys['ArrowDown'] ||S.keys['s']) S.py=Math.min(ARENA_H-AM-9,S.py+3.5);
  }

  // Spin the box
  S.corSpinAngle+=CSR_SPD;

  // Fire 4 bullets outward along box axes every CSR_INTERVAL frames
  const cx=ARENA_W/2, cy=ARENA_H/2;
  if(t>30 && t%CSR_INTERVAL===0 && S.corSpinBullets.length<CSR_TOTAL*4){
    for(let i=0;i<4;i++){
      const ang=S.corSpinAngle+i*(Math.PI/2);
      S.corSpinBullets.push({
        x:cx+Math.cos(ang)*CSR_BOX_HALF,
        y:cy+Math.sin(ang)*CSR_BOX_HALF,
        vx:Math.cos(ang)*CSR_BULLET_SPD,
        vy:Math.sin(ang)*CSR_BULLET_SPD,
        done:false,
      });
    }
  }

  // Move bullets
  for(const b of S.corSpinBullets){
    if(b.done) continue;
    b.x+=b.vx; b.y+=b.vy;
    if(b.x<AM-10||b.x>ARENA_W-AM+10||b.y<AM-10||b.y>ARENA_H-AM+10){ b.done=true; continue; }
    if(S.pHitFlash<=0&&S.pSilentFlash<=0){
      const dx=S.px-b.x,dy=S.py-b.y;
      if(Math.sqrt(dx*dx+dy*dy)<CSR_BULLET_R+6){
        b.done=true;
        S.playerHP=Math.max(0,S.playerHP-3);S.pHitFlash=30;updateHP();
        if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.corSpinRapidPhase=false;setTimeout(loseGame,500);}
      }
    }
  }
  // Box collision — rotating rectangle hit test
  if(S.pHitFlash<=0&&S.pSilentFlash<=0){
    const cx2=ARENA_W/2, cy2=ARENA_H/2;
    const dx=S.px-cx2, dy=S.py-cy2;
    // Rotate player into box local space
    const cosA=Math.cos(-S.corSpinAngle), sinA=Math.sin(-S.corSpinAngle);
    const lx=dx*cosA-dy*sinA, ly=dx*sinA+dy*cosA;
    if(Math.abs(lx)<CSR_BOX_HALF+6&&Math.abs(ly)<CSR_BOX_HALF+6){
      S.playerHP=Math.max(0,S.playerHP-3);S.pHitFlash=30;updateHP();
      if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.corSpinRapidPhase=false;setTimeout(loseGame,500);}
    }
  }

  S.corSpinBullets=S.corSpinBullets.filter(b=>!b.done);

  if(t>=CSR_DURATION){
    S.corSpinRapidPhase=false;
    S.corSpinBullets=[];
    S.bossOffsetX=0;
    beginCorStompSwipe();
  }
}
