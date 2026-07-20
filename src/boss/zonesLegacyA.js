import { S } from '../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../state/constants.js';
import { makeZone } from './zones.js';

// Legacy pattern-based zone scheduling: swipe, stomp, slash, barrage, circle.
// No-ops if atk doesn't match one of these types (mirrors original else-if chain).
export function scheduleLegacyA(atk, ph2, ph3, IW, IH){
  if(atk==='swipe'){
    const WARN=50, ACT=30;
    let segs;
    if(ph3){
      const w80=Math.floor(IW*0.70);
      const sideW=Math.floor(IW*0.20); // side blocks that force to middle
      const midSafe=Math.floor(IW*0.30); // safe middle strip
      segs=[
        // 80% left, safe = right 20%
        {x:AM,             y:AM, w:w80, h:IH, t:0},
        // 80% right, safe = left 20%
        {x:AM+IW-w80,      y:AM, w:w80, h:IH, t:75},
        // 80% center, safe = thin corners
        {x:AM+Math.floor(IW*0.10), y:AM, w:w80, h:IH, t:150},
        // After middle: left side block + right side block forcing player to center
        {x:AM,             y:AM, w:sideW, h:IH, t:230},
        {x:AM+IW-sideW,    y:AM, w:sideW, h:IH, t:230},
      ];
    } else if(ph2){
      segs=[
        {x:AM,                         y:AM, w:Math.floor(IW*0.70), h:IH, t:0},
        {x:AM+IW-Math.floor(IW*0.70),  y:AM, w:Math.floor(IW*0.70), h:IH, t:75},
        {x:AM+Math.floor(IW*0.15),     y:AM, w:Math.floor(IW*0.70), h:IH, t:150},
      ];
    } else {
      segs=[
        {x:AM,        y:AM, w:IW/2,   h:IH, t:0},
        {x:AM+IW/2,   y:AM, w:IW/2,   h:IH, t:70},
        {x:AM+IW*0.2, y:AM, w:IW*0.6, h:IH, t:140},
      ];
    }
    for(const s of segs){
      S.zones.push(makeZone({x:s.x,y:s.y,w:s.w,h:s.h,color:'#ff3300',
        warnDur:WARN,activeDur:ph3?35:ACT,startTick:s.t}));
    }

  } else if(atk==='stomp'){
    // Shockwave bars sweeping right→left (player jumps)
    for(let i=0;i<5;i++){
      S.zones.push(makeZone({type:'wave_lr', startTick:i*40, color:'#2255ff', x:ARENA_W-AM, y:0, w:20, h:0}));
    }
    // Vertical Y lines — ph2: 1 at a time, ph3: 2 at a time
    if(ph2){
      const beamW=16, IH2=ARENA_H-AM*2;
      const lineCount=ph3?3:3;
      const pairCount=ph3?2:1; // ph3 fires 2 simultaneous lines
      for(let i=0;i<lineCount;i++){
        const baseTick=20+i*60;
        for(let p=0;p<pairCount;p++){
          // Ensure 2 lines don't overlap — split arena into left/right halves
          const halfW=Math.floor((ARENA_W-AM*2-40-beamW)/2);
          const bx=ph3
            ? AM+20+p*halfW+Math.floor(Math.random()*(halfW-beamW))
            : AM+20+Math.floor(Math.random()*(ARENA_W-AM*2-40-beamW));
          S.zones.push(makeZone({x:bx, y:AM, w:beamW, h:IH2, color:'#2255ff', warnDur:28, activeDur:18, startTick:baseTick}));
        }
      }
    }

  } else if(atk==='slash'){
    // Phase 2: also adds horizontal beams (both X and Y)
    const beamW=14, WARN=20, ACT=18, IH2=IH;
    const safeGap=32, count=10;
    const usable=IW-safeGap-beamW;
    const step=Math.floor(usable/(count-1));

    // vertical beams L→R
    for(let i=0;i<count;i++){
      S.zones.push(makeZone({x:AM+i*step,y:AM,w:beamW,h:IH2,color:'#cc44ff',
        warnDur:WARN,activeDur:ACT,startTick:i*10}));
    }
    const phase2Start=count*10+WARN+ACT+15;
    // vertical beams R→L
    for(let i=0;i<count;i++){
      S.zones.push(makeZone({x:(ARENA_W-AM-beamW)-i*step,y:AM,w:beamW,h:IH2,color:'#cc44ff',
        warnDur:WARN,activeDur:ACT,startTick:phase2Start+i*10}));
    }
    const phase3Start=phase2Start+count*10+WARN+ACT+15;
    if(ph2){
      const beamH=14, usableY=IH-safeGap-beamH, stepY=Math.floor(usableY/(count-1));
      // X+Y simultaneous: L→R vertical + T→B horizontal
      for(let i=0;i<count;i++){
        const t=phase3Start+i*10;
        S.zones.push(makeZone({x:AM+i*step,y:AM,w:beamW,h:IH,color:'#cc44ff',
          warnDur:WARN,activeDur:ACT,startTick:t}));
        S.zones.push(makeZone({x:AM,y:AM+i*stepY,w:IW,h:beamH,color:'#ff44cc',
          warnDur:WARN,activeDur:ACT,startTick:t}));
      }
      if(ph3){
        // Phase 3 extra: reverse directions (R→L vertical + B→T horizontal) in order
        const p4Start=phase3Start+count*10+WARN+ACT+15;
        for(let i=0;i<count;i++){
          const t=p4Start+i*10;
          S.zones.push(makeZone({x:(ARENA_W-AM-beamW)-i*step,y:AM,w:beamW,h:IH,color:'#cc44ff',
            warnDur:WARN,activeDur:ACT,startTick:t}));
          S.zones.push(makeZone({x:AM,y:(ARENA_H-AM-beamH)-i*stepY,w:IW,h:beamH,color:'#ff44cc',
            warnDur:WARN,activeDur:ACT,startTick:t}));
        }
      }
    } else {
      // Phase 1: random vertical beams only
      for(let i=0;i<5;i++){
        const safeLeft=i%2===0;
        const bx=safeLeft?AM+safeGap+Math.floor(Math.random()*(IW-safeGap-beamW)):AM+Math.floor(Math.random()*(IW-safeGap-beamW));
        S.zones.push(makeZone({x:bx,y:AM,w:beamW,h:IH2,color:'#ff44cc',
          warnDur:35,activeDur:25,startTick:phase3Start+i*55}));
      }
    }

  } else if(atk==='barrage'){
    const interval=ph3?14:ph2?19:38;
    const count2=ph3?8:ph2?10:6;
    const beamW2=18;
    const warnD=ph3?16:ph2?22:45;
    const actD=ph3?12:ph2?14:25;
    for(let i=0;i<count2;i++){
      const t=i*interval;
      if(ph3){
        // Phase 3: spawn 2 beams per tick
        // First beam: random
        const edge1=Math.floor(Math.random()*4);
        let x1,y1,w1,h1;
        if(edge1<2){x1=AM+Math.random()*(IW-beamW2);y1=AM;w1=beamW2;h1=IH;}
        else{x1=AM;y1=AM+Math.random()*(IH-beamW2);w1=IW;h1=beamW2;}
        S.zones.push(makeZone({x:x1,y:y1,w:w1,h:h1,color:'#ff6600',
          warnDur:warnD,activeDur:actD,startTick:t}));
        // Second beam: tracks player position (snaps to player's current x or y)
        // We record player pos at schedule time; it will warn at that spot
        const trackX=S.px, trackY=S.py;
        // Vertical beam through player's x
        const txClamped=Math.max(AM, Math.min(ARENA_W-AM-beamW2, trackX-beamW2/2));
        S.zones.push(makeZone({x:txClamped,y:AM,w:beamW2,h:IH,color:'#ff3300',warnDur:warnD+8,activeDur:actD,startTick:t,tracked:true}));
      } else {
        const edge=Math.floor(Math.random()*4);
        let x,y,w,h;
        if(edge<2){x=AM+Math.random()*(IW-beamW2);y=AM;w=beamW2;h=IH;}
        else{x=AM;y=AM+Math.random()*(IH-beamW2);w=IW;h=beamW2;}
        S.zones.push(makeZone({x,y,w,h,color:'#ff6600',
          warnDur:warnD,activeDur:actD,startTick:t}));
      }
    }

  } else if(atk==='circle'){
    const margin=30;
    const circCount=ph3?6:4;
    const warnT=45, actT=60, interval=75; // same speed as ph2
    const passT=15; // 0.25 sec white passthrough after active before done
    for(let i=0;i<circCount;i++){
      const cx=AM+margin+Math.random()*(ARENA_W-AM*2-margin*2);
      const cy=AM+margin+Math.random()*(ARENA_H-AM*2-margin*2);
      S.zones.push(makeZone({type:'circle_expand', cx, cy, startTick:i*interval, warnDur:warnT, activeDur:actT, passThruDur:ph3?passT:0, fullBox:ph3, color:'#ff2200', passThru:false, r:0, thickness:8}));
    }
  }
}
