import { S } from '../../state/gameState.js';
import { arenaCanvas, aCtx } from '../../core/canvasRefs.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { COR_LANE_W, COR_WORLD_H, COR_LANE_H, COR_WORLD_W, COR_MID_Y } from '../attacks/corridor.js';

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 7381-7510
// (drawArena's "── Corridor attack ──" block). The S.corridorPhase gate is
// kept inside the function — call unconditionally every frame.
export function drawCorridor(){
  const ctx=aCtx;
  if(S.corridorPhase){
    const IW=ARENA_W-AM*2, IH=ARENA_H-AM*2;
    const wf=0.6+0.15*Math.sin(S.tick*0.5);
    const bf=0.85+0.12*Math.sin(S.tick*0.5);
    const laneL=ARENA_W/2-COR_LANE_W/2;
    const laneR=ARENA_W/2+COR_LANE_W/2;
    const camX=S.corCamX||0, camY=S.corCamY||0;
    const isVertical=(S.corPhase==='up'||S.corPhase==='fall'||S.corPhase==='pause');
    // Hall screen-Y positions (camera Y locked so midpoint = screen center)
    const hallScreenT=ARENA_H/2-COR_LANE_H/2;
    const hallScreenB=ARENA_H/2+COR_LANE_H/2;
    // Midpoint screen Y (for vertical view)
    const midScreenY=(COR_MID_Y-camY)+AM;

    // Background
    ctx.fillStyle='rgba(20,20,30,0.6)'; ctx.fillRect(AM,AM,IW,IH);
    ctx.strokeStyle='rgba(60,60,80,0.5)'; ctx.lineWidth=1;
    if(isVertical){
      const lo=(camY*0.8)%30;
      for(let ly=AM-lo;ly<ARENA_H-AM;ly+=30){ctx.beginPath();ctx.moveTo(AM,ly);ctx.lineTo(ARENA_W-AM,ly);ctx.stroke();}
    } else {
      const lo=(camX*0.8)%30;
      for(let lx=AM-lo;lx<ARENA_W-AM;lx+=30){ctx.beginPath();ctx.moveTo(lx,AM);ctx.lineTo(lx,ARENA_H-AM);ctx.stroke();}
    }

    if(isVertical){
      // Left/right danger walls
      ctx.fillStyle=`rgba(200,20,0,${wf})`; ctx.fillRect(AM,AM,laneL-AM,IH);
      ctx.fillStyle='rgba(255,60,0,0.9)'; ctx.fillRect(laneL-3,AM,3,IH);
      ctx.fillStyle=`rgba(200,20,0,${wf})`; ctx.fillRect(laneR,AM,(ARENA_W-AM)-laneR,IH);
      ctx.fillStyle='rgba(255,60,0,0.9)'; ctx.fillRect(laneR,AM,3,IH);
      // Lane interior
      ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(laneL,AM,COR_LANE_W,IH);
      // Vertical boxes
      ctx.save(); ctx.beginPath();ctx.rect(laneL,AM,COR_LANE_W,IH);ctx.clip();
      for(const b of (S.corVBoxes||[])){
        const bsy=(b.wy-camY)+AM;
        if(bsy+b.h<AM||bsy>ARENA_H-AM) continue;
        ctx.fillStyle=`rgba(180,0,220,${bf})`; ctx.fillRect(b.x,bsy,b.w,b.h);
        ctx.fillStyle='rgba(220,100,255,0.9)'; ctx.fillRect(b.x,bsy,b.w,2);ctx.fillRect(b.x,bsy+b.h-2,b.w,2);
      }
      ctx.restore();
    } else {
      // Top/bottom danger walls
      ctx.fillStyle=`rgba(200,20,0,${wf})`; ctx.fillRect(AM,AM,IW,hallScreenT-AM);
      ctx.fillStyle='rgba(255,60,0,0.9)'; ctx.fillRect(AM,hallScreenT-3,IW,3);
      ctx.fillStyle=`rgba(200,20,0,${wf})`; ctx.fillRect(AM,hallScreenB,IW,(ARENA_H-AM)-hallScreenB);
      ctx.fillStyle='rgba(255,60,0,0.9)'; ctx.fillRect(AM,hallScreenB,IW,3);
      // Hall interior
      ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fillRect(AM,hallScreenT,IW,COR_LANE_H);
      // Right danger wall at world right edge (only during right/left/chase phases)
      if(S.corPhase==='right'||S.corPhase==='left'||S.corPhase==='chase'){
        const rightWallScreenX=(COR_WORLD_W-9-camX)+AM;
        if(rightWallScreenX<ARENA_W-AM){
          ctx.fillStyle=`rgba(200,180,0,${wf})`; ctx.fillRect(rightWallScreenX,hallScreenT,(ARENA_W-AM)-rightWallScreenX,COR_LANE_H);
          ctx.fillStyle='rgba(255,255,0,0.9)'; ctx.fillRect(rightWallScreenX,hallScreenT,3,COR_LANE_H);
        }
      }
      // Boxes
      ctx.save(); ctx.beginPath();ctx.rect(AM,hallScreenT,IW,COR_LANE_H);ctx.clip();
      for(const b of (S.corHBoxes||[])){
        const bsx=(b.wx-camX)+AM;
        if(bsx+b.w<AM||bsx>ARENA_W-AM) continue;
        ctx.fillStyle=`rgba(180,0,220,${bf})`; ctx.fillRect(bsx,b.screenY,b.w,b.h);
        ctx.fillStyle='rgba(220,100,255,0.9)'; ctx.fillRect(bsx,b.screenY,2,b.h);ctx.fillRect(bsx+b.w-2,b.screenY,2,b.h);
      }
      ctx.restore();
      // Chase wall (red wall from left side)
      if(S.corPhase==='chase' && !S.corChaseDelay){
        const L=(S.corChaseWallX-camX)+AM;
        const wallFlicker=0.65+0.15*Math.sin(S.tick*0.5);
        if(L>AM+3){
          ctx.fillStyle=`rgba(200,20,0,${wallFlicker})`;
          ctx.fillRect(AM,hallScreenT,L-AM,COR_LANE_H);
          ctx.fillStyle='rgba(255,60,0,0.95)';
          ctx.fillRect(L-3,hallScreenT,3,COR_LANE_H);
        }
      }
      // Squeeze walls (all 4 closing to center box)
      if(S.corPhase==='squeeze'){
        const camX2=S.corSqueezeCamX||0;
        const sqL=(S.corChaseWallX-camX2)+AM;
        const sqR=S.corSqR, sqT=S.corSqT, sqB=S.corSqB;
        const wallFlicker=0.65+0.15*Math.sin(S.tick*0.5);
        // Left wall
        if(sqL>AM){
          ctx.fillStyle=`rgba(200,20,0,${wallFlicker})`;
          ctx.fillRect(AM,hallScreenT,sqL-AM,COR_LANE_H);
          ctx.fillStyle='rgba(255,60,0,0.95)';
          ctx.fillRect(sqL-3,hallScreenT,3,COR_LANE_H);
        }

        // Right wall
        if(sqR < ARENA_W-AM-2){
          ctx.fillStyle=`rgba(200,20,0,${wallFlicker})`;
          ctx.fillRect(sqR,hallScreenT,(ARENA_W-AM)-sqR,COR_LANE_H);
          ctx.fillStyle='rgba(255,60,0,0.95)';
          ctx.fillRect(sqR,hallScreenT,3,COR_LANE_H);
        }
        if(sqT>AM){
          ctx.fillStyle=`rgba(200,20,0,${wallFlicker})`;
          ctx.fillRect(AM,AM,IW,sqT-AM);
          ctx.fillStyle='rgba(255,60,0,0.95)';
          ctx.fillRect(AM,sqT-3,IW,3);
        }
        // Bottom wall
        if(sqB<ARENA_H-AM){
          ctx.fillStyle=`rgba(200,20,0,${wallFlicker})`;
          ctx.fillRect(AM,sqB,IW,(ARENA_H-AM)-sqB);
          ctx.fillStyle='rgba(255,60,0,0.95)';
          ctx.fillRect(AM,sqB,IW,3);
        }
      }
      // Ricochet box
      if(S.corPhase==='ricochet'){
        const wf2=0.65+0.15*Math.sin(S.tick*0.5);
        const bx=S.corRicBCX, by=S.corRicBCY, half=S.corRicHalf;
        ctx.fillStyle=`rgba(200,20,0,${wf2})`;
        ctx.fillRect(AM,hallScreenT,bx-half-AM,COR_LANE_H);
        ctx.fillRect(bx+half,hallScreenT,(ARENA_W-AM)-(bx+half),COR_LANE_H);
        ctx.fillRect(AM,hallScreenT,IW,by-half-hallScreenT);
        ctx.fillRect(AM,by+half,IW,hallScreenB-(by+half));
        ctx.fillStyle='rgba(255,60,0,0.95)';
        ctx.fillRect(bx-half-3,hallScreenT,3,COR_LANE_H);
        ctx.fillRect(bx+half,hallScreenT,3,COR_LANE_H);
        ctx.fillRect(AM,by-half-3,IW,3);
        ctx.fillRect(AM,by+half,IW,3);
      }
    }
  }
}
