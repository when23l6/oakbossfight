import { S } from '../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../state/constants.js';

function updateZones(){
  const t=S.atkTimer;
  const IH=ARENA_H-AM*2;
  const waveH=20; // shockwave bar height
  const waveSpeed=3.2; // px per frame moving left
  for(const z of S.zones){
    if(z.done) continue;
    const rel=t-z.startTick;
    z.warn=false; z.active=false;
    if(rel<0) continue;

    if(z.type==='wave_lr'){
      // The bar slides from right to left across the arena floor
      // warn: first 20 frames it flashes on the right edge as preview
      // active: it moves left across the full arena
      const WARN=20, TRAVEL=Math.ceil((ARENA_W-AM*2+24)/waveSpeed);
      if(rel<WARN){
        z.warn=true;
        z.x=ARENA_W-AM-24; z.y=ARENA_H-AM-waveH; z.w=24; z.h=waveH;
      } else {
        const moved=(rel-WARN)*waveSpeed;
        z.x=(ARENA_W-AM)-(rel-WARN)*waveSpeed;
        z.y=ARENA_H-AM-waveH; z.w=24; z.h=waveH;
        if(z.x+z.w < AM){ z.done=true; continue; }
        z.active=true;
      }
    } else if(z.type==='wave_rl'){
      const WARN=20;
      if(rel<WARN){
        z.warn=true;z.x=AM;z.y=ARENA_H-AM-waveH;z.w=24;z.h=waveH;
      } else {
        // leading edge moves right from AM: right edge = AM + progress + w
        // position bar so right edge = AM + progress
        z.x=AM+(rel-WARN)*waveSpeed-24;
        z.y=ARENA_H-AM-waveH;z.w=24;z.h=waveH;
        if(z.x+z.w>ARENA_W-AM){z.done=true;continue;}
        z.active=true;
      }
    } else if(z.type==='circle_expand'){
      const passT=z.passThruDur||0;
      const totalActive=z.activeDur+passT;
      if(rel<z.warnDur){
        z.warn=true; z.passThru=false;
        z.r=5+2*Math.sin(rel*0.45); z.thickness=8;
      } else if(rel<z.warnDur+z.activeDur){
        const prog=(rel-z.warnDur)/z.activeDur;
        const corners=[[AM,AM],[ARENA_W-AM,AM],[AM,ARENA_H-AM],[ARENA_W-AM,ARENA_H-AM]];
        const maxRFull=Math.max(...corners.map(([cx,cy])=>Math.sqrt((z.cx-cx)**2+(z.cy-cy)**2)));
        const maxR=z.fullBox?maxRFull+10:maxRFull*0.65;
        z.r=6+prog*(maxR-6);
        z.thickness=z.fullBox?12:10;
        z.warn=false;
        if(z.fullBox){
          // ph3: flash white (safe) for 15 frames mid-expand, red otherwise
          const relActive=rel-z.warnDur;
          const midStart=Math.floor(z.activeDur*0.45);
          const midEnd=midStart+30;
          const inWhite=relActive>=midStart&&relActive<midEnd;
          z.passThru=inWhite;
          z.active=!inWhite;
        } else {
          z.active=true; z.passThru=false;
        }
      } else if(z.passThruDur>0 && rel<z.warnDur+z.activeDur+z.passThruDur){
        z.active=false; z.passThru=true; z.warn=false;
        const corners=[[AM,AM],[ARENA_W-AM,AM],[AM,ARENA_H-AM],[ARENA_W-AM,ARENA_H-AM]];
        const maxRFull=Math.max(...corners.map(([cx,cy])=>Math.sqrt((z.cx-cx)**2+(z.cy-cy)**2)));
        z.r=maxRFull+10; z.thickness=12;
      } else { z.done=true; z.passThru=false; }
    } else if(z.type==='spinner'){
      if(rel<z.warnDur){ z.warn=true; }
      else if(rel<z.warnDur+z.activeDur){
        z.active=true; z.warn=false;
        z.angle=(z.angle||0)+z.speed;
      } else { z.done=true; }
    } else if(z.type==='zigzag'){
      if(rel<0) continue;
      z.grace=(rel<60); // first 60 frames (1 sec) = grace, no damage
      z.active=!z.grace;
      z.visible=true; // always visible once started
      // Move ball
      z.bx+=z.bvx;
      z.by+=z.bvy;
      // Bounce off left/right walls
      if(z.bx-z.ballR<=AM){ z.bx=AM+z.ballR; z.bvx=Math.abs(z.bvx); }
      if(z.bx+z.ballR>=ARENA_W-AM){ z.bx=ARENA_W-AM-z.ballR; z.bvx=-Math.abs(z.bvx); }
      // Done when falls off bottom
      if(z.by-z.ballR>ARENA_H-AM) z.done=true;
    } else if(z.type==='line_360'){
      if(rel<z.warnDur){
        z.warn=true;
        // Lock onto player position at the very first frame of warn
        if(rel===0 && z.trackPlayer){
          z.angle=Math.atan2(S.py-z.cy, S.px-z.cx);
        }
      }
      else if(rel<z.warnDur+z.activeDur){ z.active=true; z.warn=false; }
      else { z.done=true; }
    } else if(z.memoryBeam){
      const gapDur=z.gapDur||0;
      z.inGap=false;
      if(rel<0){ /* not started */ }
      else if(rel<z.warnDur){ z.warn=true; }
      else if(rel<z.warnDur+gapDur){ z.warn=false; z.active=false; z.inGap=true; }
      else if(rel<z.warnDur+gapDur+z.activeDur){ z.active=true; z.inGap=false; }
      else { z.done=true; }
    } else {
      if(rel<z.warnDur){ z.warn=true; }
      else if(rel<z.warnDur+z.activeDur){ z.active=true; }
      else { z.done=true; }
    }
  }
}

export { updateZones };
