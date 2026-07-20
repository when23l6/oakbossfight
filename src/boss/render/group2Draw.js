import { S } from '../../state/gameState.js';
import { arenaCanvas, aCtx } from '../../core/canvasRefs.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { CMRS_R } from '../attacks/corMRS.js';
import { COR10_AM, COR10_CIRCLE_R, COR10_BALL_R, COR10_WALL_ARC, COR10_ROUND_DUR } from '../attacks/cor10.js';
import { GRN_BLAST_R } from '../attacks/grenade.js';

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 7947-7994
// (drawArena's un-headered corMRS block, right after the corridor
// multi-ricochet comment section). The S.corMRSPhase gate is kept inside
// the function — call unconditionally every frame.
export function drawCorMRS(){
  const ctx=aCtx;
  if(S.corMRSPhase){
    ctx.save();
    ctx.beginPath(); ctx.rect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2); ctx.clip();

    // Draw expanding circles from wall hits
    const MAX_R=Math.min(ARENA_W,ARENA_H)/3;
    const CIRCLE_DUR=90;
    for(const c of S.corMRSCircles){
      const prog=c.age/CIRCLE_DUR;
      const alpha=(1-prog)*0.7;
      ctx.strokeStyle=`rgba(255,120,30,${alpha})`;
      ctx.lineWidth=10;
      ctx.beginPath();
      ctx.arc(c.x,c.y,c.r,0,Math.PI*2);
      ctx.stroke();
      // Inner glow ring
      ctx.strokeStyle=`rgba(255,200,80,${alpha*0.5})`;
      ctx.lineWidth=1;
      ctx.beginPath();
      ctx.arc(c.x,c.y,Math.max(0,c.r-5),0,Math.PI*2);
      ctx.stroke();
    }

    // Draw balls
    for(const b of S.corMRSBalls){
      if(b.state==='done'||b.state==='wait') continue;
      // Trail
      for(let i=1;i<b.trail.length;i++){
        const alpha=(i/b.trail.length)*0.6;
        ctx.strokeStyle=`rgba(255,80,30,${alpha})`;
        ctx.lineWidth=2+(i/b.trail.length)*4;
        ctx.beginPath();
        ctx.moveTo(b.trail[i-1].x,b.trail[i-1].y);
        ctx.lineTo(b.trail[i].x,b.trail[i].y);
        ctx.stroke();
      }
      // Glow
      const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,CMRS_R*3);
      g.addColorStop(0,'rgba(255,80,0,0.5)');
      g.addColorStop(1,'rgba(255,40,0,0)');
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.arc(b.x,b.y,CMRS_R*3,0,Math.PI*2); ctx.fill();
      // Ball
      ctx.fillStyle='rgba(255,200,160,1)';
      ctx.beginPath(); ctx.arc(b.x,b.y,CMRS_R,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 7997-8045
// (drawArena's "── Attack 10 drawing ──" block, "spin" stage only). NOTE:
// cor10's "plat" stage does NOT live in this range — it is drawn by
// drawPlatforms() in group3Draw.js, which is gated by
// `S.platPhase || (S.cor10Phase && S.cor10Stage==='plat')` (see original
// line 7238). The S.cor10Phase/'spin'-stage gate is kept inside this
// function — call unconditionally every frame.
export function drawCor10(){
  const ctx=aCtx;
  if(S.cor10Phase && S.cor10Stage==='spin'){
    const cx=ARENA_W/2, cy=ARENA_H/2;
    const round2=S.cor10Timer>60+COR10_ROUND_DUR;
    const shrinkProg=round2?Math.min(1,(S.cor10Timer-60-COR10_ROUND_DUR)/60):0;
    const shrink=shrinkProg*20;
    ctx.save();
    ctx.beginPath(); ctx.rect(0,0,ARENA_W,ARENA_H); ctx.clip();

    // Shrunk border indicator in round 2
    if(round2){
      ctx.strokeStyle='rgba(255,200,50,0.5)';
      ctx.lineWidth=2; ctx.setLineDash([4,4]);
      ctx.strokeRect(COR10_AM+shrink,COR10_AM+shrink,ARENA_W-COR10_AM*2-shrink*2,ARENA_H-COR10_AM*2-shrink*2);
      ctx.setLineDash([]);
    }

    // Circle ring
    ctx.strokeStyle='rgba(80,180,255,0.35)';
    ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(cx,cy,COR10_CIRCLE_R,0,Math.PI*2); ctx.stroke();

    // Wall — full pie slice from center to arena edge
    const wallAlpha=0.75+0.15*Math.sin(S.cor10Timer*0.2);
    const wallOuter=Math.max(ARENA_W,ARENA_H); // beyond arena edge
    ctx.fillStyle=`rgba(255,50,50,${wallAlpha})`;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,wallOuter,S.cor10Angle,S.cor10Angle+COR10_WALL_ARC);
    ctx.closePath();
    ctx.fill();
    // Bright edges
    ctx.strokeStyle=`rgba(255,140,100,${wallAlpha})`;
    ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,wallOuter,S.cor10Angle,S.cor10Angle+COR10_WALL_ARC); ctx.closePath(); ctx.stroke();

    // Balls
    for(const b of S.cor10Balls){
      if(b.x===undefined) continue;
      const g=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,COR10_BALL_R*2.5);
      g.addColorStop(0,'rgba(255,220,80,0.7)');
      g.addColorStop(1,'rgba(255,120,0,0)');
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.arc(b.x,b.y,COR10_BALL_R*2.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,240,160,1)';
      ctx.beginPath(); ctx.arc(b.x,b.y,COR10_BALL_R,0,Math.PI*2); ctx.fill();
    }

    ctx.restore();
  }
}

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 8447-8503
// (drawArena's "── Meditate background visuals ──" block plus the
// "── Meditate press flash ──" block). The S.meditatePhase /
// S.meditateFlash gates are kept inside the function — call
// unconditionally every frame.
export function drawMeditate(){
  const ctx=aCtx;
  if(S.meditatePhase){
    ctx.save();
    ctx.beginPath(); ctx.rect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2); ctx.clip();
    // Rico bullets
    for(const b of (S.meditateRicBullets||[])){
      for(let i=1;i<b.trail.length;i++){
        ctx.strokeStyle=`rgba(255,200,80,${(i/b.trail.length)*0.5})`;
        ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(b.trail[i-1].x,b.trail[i-1].y); ctx.lineTo(b.trail[i].x,b.trail[i].y); ctx.stroke();
      }
      ctx.fillStyle='rgba(255,220,100,1)';
      ctx.beginPath(); ctx.arc(b.x,b.y,6,0,Math.PI*2); ctx.fill();
    }
    // Grenades
    for(const g of S.meditateGrenades){
      const prog=Math.min(1,g.timer/47);
      const gx=g.sx+(g.lx-g.sx)*prog, gy=g.sy+(g.ly-g.sy)*prog;
      if(g.state==='blast'){
        ctx.fillStyle='rgba(255,80,0,0.6)';
        ctx.beginPath(); ctx.arc(gx,gy,GRN_BLAST_R,0,Math.PI*2); ctx.fill();
      } else {
        ctx.fillStyle='rgba(255,160,40,0.9)';
        ctx.beginPath(); ctx.arc(gx,gy,6,0,Math.PI*2); ctx.fill();
      }
    }
    // Zigzag balls
    for(const b of (S.meditateZigzags||[])){
      // glow
      ctx.fillStyle='rgba(0,220,255,0.18)';
      ctx.beginPath(); ctx.arc(b.x,b.y,b.r+5,0,Math.PI*2); ctx.fill();
      // core
      ctx.fillStyle='rgba(80,240,255,0.95)';
      ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
      // bright center
      ctx.fillStyle='rgba(220,255,255,0.9)';
      ctx.beginPath(); ctx.arc(b.x,b.y,b.r*0.45,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  // Meditate press flash — edge shine (same as pre-meditate)
  if(S.meditateFlash>0){
    const shine=S.meditateFlash;
    const shineAlpha=(shine/8)*0.7;
    const edgeW=6;
    ctx.fillStyle=`rgba(255,255,255,${shineAlpha})`;
    ctx.fillRect(AM,AM, ARENA_W-AM*2, edgeW);
    ctx.fillRect(AM,ARENA_H-AM-edgeW, ARENA_W-AM*2, edgeW);
    ctx.fillRect(AM,AM, edgeW, ARENA_H-AM*2);
    ctx.fillRect(ARENA_W-AM-edgeW,AM, edgeW, ARENA_H-AM*2);
    const spread=Math.round((1-shine/8)*18);
    ctx.fillStyle=`rgba(220,220,255,${shineAlpha*0.35})`;
    ctx.fillRect(AM+edgeW,AM+edgeW, ARENA_W-AM*2-edgeW*2, spread);
    ctx.fillRect(AM+edgeW,ARENA_H-AM-edgeW-spread, ARENA_W-AM*2-edgeW*2, spread);
    ctx.fillRect(AM+edgeW,AM+edgeW, spread, ARENA_H-AM*2-edgeW*2);
    ctx.fillRect(ARENA_W-AM-edgeW-spread,AM+edgeW, spread, ARENA_H-AM*2-edgeW*2);
  }
}
