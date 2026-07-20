import { S } from '../../state/gameState.js';
import { arenaCanvas, aCtx } from '../../core/canvasRefs.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { LANE_W, DROPPER_TOTAL_H } from '../attacks/dropper.js';

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 7238-7265
// (drawArena's "── Platforms ──" block). This is also the render path
// used by cor10's "plat" stage — the gate condition below
// (`S.platPhase || (S.cor10Phase && S.cor10Stage==='plat')`) is the
// original condition, preserved verbatim, and is kept inside the
// function — call unconditionally every frame.
export function drawPlatforms(){
  const ctx=aCtx;
  if((S.platPhase||(S.cor10Phase&&S.cor10Stage==='plat'))&&S.platforms&&S.platforms.length>0){
    const floorActive = S.floorDmg || S.cor10FloorDmg;
    // Floor danger indicator
    if(floorActive){
      const flicker=0.3+0.2*Math.sin(S.tick*0.5);
      ctx.fillStyle=`rgba(255,30,0,${flicker})`;
      ctx.fillRect(AM,ARENA_H-AM-8,ARENA_W-AM*2,8);
      ctx.strokeStyle='rgba(255,80,0,0.8)';ctx.lineWidth=1.5;
      ctx.strokeRect(AM,ARENA_H-AM-8,ARENA_W-AM*2,8);
      // Brick pattern
      ctx.strokeStyle='rgba(180,0,0,0.5)'; ctx.lineWidth=1;
      const brickW=16, brickH=8, floorY=ARENA_H-AM-8;
      for(let bx=AM;bx<ARENA_W-AM;bx+=brickW){
        ctx.strokeRect(bx,floorY,brickW,brickH);
      }
    } else {
      ctx.fillStyle='rgba(255,100,0,0.15)';
      ctx.fillRect(AM,ARENA_H-AM-8,ARENA_W-AM*2,8);
    }
    // Draw platforms
    for(const p of S.platforms){
      ctx.fillStyle='#888'; ctx.fillRect(p.x,p.y,p.w,p.h);
      ctx.fillStyle='#bbb'; ctx.fillRect(p.x,p.y,p.w,2);
      ctx.fillStyle='#555'; ctx.fillRect(p.x,p.y+p.h-2,p.w,2);
      const prog=Math.min(1,(p.y-AM)/(ARENA_H-AM*2));
      if(prog>0.5){ ctx.fillStyle=`rgba(255,0,0,${(prog-0.5)*0.4})`; ctx.fillRect(p.x,p.y,p.w,p.h); }
    }
  }
}

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 7268-7287
// (drawArena's "── Split line + platforms ──" block). The S.splitPhase
// gate is kept inside the function — call unconditionally every frame.
export function drawSplit(){
  const ctx=aCtx;
  if(S.splitPhase){
    ctx.strokeStyle='rgba(255,255,255,0.7)';
    ctx.lineWidth=2; ctx.setLineDash([6,4]);
    ctx.beginPath();ctx.moveTo(ARENA_W/2,AM);ctx.lineTo(ARENA_W/2,ARENA_H-AM);ctx.stroke();
    ctx.setLineDash([]);
    // Draw mirrored platforms
    if(S.splitPlats){
      // Killbrick floor indicator when active
      if(S.splitTimer>520){
        const flicker=0.3+0.2*Math.sin(S.tick*0.5);
        ctx.fillStyle=`rgba(255,30,0,${flicker})`;
        ctx.fillRect(AM,ARENA_H-AM-8,ARENA_W-AM*2,8);
      }
      for(const p of S.splitPlats){
        ctx.fillStyle='#888';ctx.fillRect(p.x,p.y,p.w,p.h);
        ctx.fillStyle='#bbb';ctx.fillRect(p.x,p.y,p.w,2);
        ctx.fillStyle='#555';ctx.fillRect(p.x,p.y+p.h-2,p.w,2);
      }
    }
  }
}

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 7290-7349
// (drawArena's "── Dropper attack ──" block). The S.dropperPhase gate is
// kept inside the function — call unconditionally every frame.
export function drawDropper(){
  const ctx=aCtx;
  if(S.dropperPhase){
    const IW=ARENA_W-AM*2, IH=ARENA_H-AM*2;
    const laneL=ARENA_W/2-LANE_W/2;
    const laneR=ARENA_W/2+LANE_W/2;
    const camY=S.dropperCamY||0;

    // Scrolling background — faint horizontal lines to show movement
    ctx.fillStyle='rgba(20,20,30,0.6)';
    ctx.fillRect(AM, AM, IW, IH);
    const lineSpacing=30;
    const lineOffset=((camY*0.8)%lineSpacing);
    ctx.strokeStyle='rgba(60,60,80,0.5)'; ctx.lineWidth=1;
    for(let ly=AM-lineOffset;ly<ARENA_H-AM;ly+=lineSpacing){
      ctx.beginPath();ctx.moveTo(AM,ly);ctx.lineTo(ARENA_W-AM,ly);ctx.stroke();
    }

    // World top/bottom indicators (faint lines showing lane extent)
    const worldTopScreen = AM - camY;
    const worldBotScreen = AM + DROPPER_TOTAL_H - camY;
    if(worldTopScreen>AM && worldTopScreen<ARENA_H-AM){
      ctx.strokeStyle='rgba(255,255,0,0.5)'; ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(AM,worldTopScreen);ctx.lineTo(ARENA_W-AM,worldTopScreen);ctx.stroke();
    }
    if(worldBotScreen>AM && worldBotScreen<ARENA_H-AM){
      ctx.strokeStyle='rgba(255,255,0,0.5)'; ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(AM,worldBotScreen);ctx.lineTo(ARENA_W-AM,worldBotScreen);ctx.stroke();
    }

    // Left wall (red, danger)
    const wallFlicker=0.6+0.15*Math.sin(S.tick*0.5);
    ctx.fillStyle=`rgba(200,20,0,${wallFlicker})`;
    ctx.fillRect(AM, AM, laneL-AM, IH);
    ctx.fillStyle='rgba(255,60,0,0.9)';
    ctx.fillRect(laneL-3, AM, 3, IH);

    // Right wall
    ctx.fillStyle=`rgba(200,20,0,${wallFlicker})`;
    ctx.fillRect(laneR, AM, (ARENA_W-AM)-laneR, IH);
    ctx.fillStyle='rgba(255,60,0,0.9)';
    ctx.fillRect(laneR, AM, 3, IH);

    // Lane (clear / darker)
    ctx.fillStyle='rgba(0,0,0,0.3)';
    ctx.fillRect(laneL, AM, LANE_W, IH);

    // Boxes — draw at screen position (world y → screen y via camera)
    ctx.save();
    ctx.beginPath();ctx.rect(laneL,AM,LANE_W,IH);ctx.clip();
    for(const b of S.dropperBoxes){
      const bsy=(b.wy-camY)+AM;
      if(bsy+b.h<AM||bsy>ARENA_H-AM) continue;
      const bf=0.85+0.12*Math.sin(S.tick*0.5);
      ctx.fillStyle=`rgba(180,0,220,${bf})`;
      ctx.fillRect(b.x, bsy, b.w, b.h);
      ctx.fillStyle='rgba(220,100,255,0.9)';
      ctx.fillRect(b.x, bsy, b.w, 2);
      ctx.fillRect(b.x, bsy+b.h-2, b.w, 2);
    }
    ctx.restore();
  }
}

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 7352-7378
// (drawArena's "── Walls attack ──" block). The S.wallsPhase gate is kept
// inside the function — call unconditionally every frame.
export function drawWalls(){
  const ctx=aCtx;
  if(S.wallsPhase){
    const IW=ARENA_W-AM*2, IH=ARENA_H-AM*2;
    const wallFlicker=0.65+0.15*Math.sin(S.tick*0.5);

    // Left wall (AM to wallsLeft)
    ctx.fillStyle=`rgba(200,20,0,${wallFlicker})`;
    ctx.fillRect(AM, AM, S.wallsLeft-AM, IH);
    ctx.fillStyle='rgba(255,60,0,0.95)';
    ctx.fillRect(S.wallsLeft-3, AM, 3, IH);

    // Right wall (wallsRight to ARENA_W-AM)
    ctx.fillStyle=`rgba(200,20,0,${wallFlicker})`;
    ctx.fillRect(S.wallsRight, AM, (ARENA_W-AM)-S.wallsRight, IH);
    ctx.fillStyle='rgba(255,60,0,0.95)';
    ctx.fillRect(S.wallsRight, AM, 3, IH);

    // Safe lane (dark center)
    ctx.fillStyle='rgba(0,0,0,0.35)';
    ctx.fillRect(S.wallsLeft, AM, S.wallsRight-S.wallsLeft, IH);

    // Lane edge glow lines
    const g=0.4+0.25*Math.sin(S.tick*0.3);
    ctx.strokeStyle=`rgba(255,120,0,${g})`;
    ctx.lineWidth=2; ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(S.wallsLeft,AM);ctx.lineTo(S.wallsLeft,ARENA_H-AM);ctx.stroke();
    ctx.beginPath();ctx.moveTo(S.wallsRight,AM);ctx.lineTo(S.wallsRight,ARENA_H-AM);ctx.stroke();
  }
}
