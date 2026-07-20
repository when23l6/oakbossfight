import { S } from '../../state/gameState.js';
import { arenaCanvas, aCtx } from '../../core/canvasRefs.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { spawnParticles } from '../../core/particles.js';
import { CMR_R } from '../attacks/corMultiRic.js';
import { RF_TOTAL, RF_INTERVAL, RF_BULLET_R } from '../attacks/rapidfire.js';
import { CSR_BOX_HALF, CSR_BULLET_R } from '../attacks/corSpinRapid.js';
import { HEAL_ORB_R, HEAL_ORB_HEAL } from '../attacks/healOrbs.js';

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 7802-7834
// (drawArena's "── Ricochet attack drawing ──" block). The
// S.ricochetPhase gate is kept inside the function — call unconditionally
// every frame.
export function drawRicochet(){
  const ctx=aCtx;
  const t=S.tick;
  if(S.ricochetPhase && S.ricochetBullet){
    const b=S.ricochetBullet;
    ctx.save();
    ctx.beginPath(); ctx.rect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2); ctx.clip();

    // Trail
    if(b.trail.length>1){
      for(let i=1;i<b.trail.length;i++){
        const alpha=(i/b.trail.length)*0.7;
        const width=1+(i/b.trail.length)*4;
        ctx.strokeStyle=`rgba(255,160,30,${alpha})`;
        ctx.lineWidth=width; ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(b.trail[i-1].x, b.trail[i-1].y);
        ctx.lineTo(b.trail[i].x,   b.trail[i].y);
        ctx.stroke();
      }
    }
    // Bullet head
    ctx.fillStyle='rgba(255,255,180,1)';
    ctx.beginPath(); ctx.arc(b.x,b.y,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,160,0,0.5)';
    ctx.beginPath(); ctx.arc(b.x,b.y,10,0,Math.PI*2); ctx.fill();
    if(t%2===0) spawnParticles(b.x,b.y,'#ffaa22',2,2,8);

    // Bounces left
    ctx.fillStyle='rgba(255,150,50,0.8)';
    ctx.font='bold 9px monospace'; ctx.textAlign='left';
    ctx.fillText(`BOUNCES: ${b.bouncesLeft}`, AM+4, AM+10);
    ctx.textAlign='start';

    ctx.restore();
  }
}

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 8048-8087
// (drawArena's "── Rapid fire drawing ──" block). The S.rapidfirePhase
// gate is kept inside the function — call unconditionally every frame.
export function drawRapidfire(){
  const ctx=aCtx;
  if(S.rapidfirePhase){
    ctx.save();
    ctx.beginPath(); ctx.rect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2); ctx.clip();

    // Gun origin flash when a shot fires
    if(S.rapidfireTimer > 45 && (S.rapidfireTimer - 45) % RF_INTERVAL === 1 && S.rapidfireShotCount < RF_TOTAL){
      ctx.fillStyle='rgba(255,220,80,0.7)';
      ctx.beginPath(); ctx.arc(ARENA_W/2, AM, 10, 0, Math.PI*2); ctx.fill();
    }

    for(const b of S.rapidfireBullets){
      // Trail
      for(let i=1;i<b.trail.length;i++){
        const alpha=(i/b.trail.length)*0.5;
        ctx.strokeStyle=`rgba(255,140,0,${alpha})`;
        ctx.lineWidth=2+(i/b.trail.length)*2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(b.trail[i-1].x,b.trail[i-1].y);
        ctx.lineTo(b.trail[i].x,  b.trail[i].y);
        ctx.stroke();
      }
      // Bullet head
      ctx.fillStyle='rgba(255,255,160,1)';
      ctx.beginPath(); ctx.arc(b.x,b.y,RF_BULLET_R,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,160,0,0.4)';
      ctx.beginPath(); ctx.arc(b.x,b.y,RF_BULLET_R+4,0,Math.PI*2); ctx.fill();
    }

    // Shot counter
    const remaining=RF_TOTAL-S.rapidfireShotCount;
    if(remaining>0){
      ctx.fillStyle='rgba(255,150,50,0.8)';
      ctx.font='bold 9px monospace'; ctx.textAlign='left';
      ctx.fillText(`SHOTS: ${remaining}`, AM+4, AM+10);
      ctx.textAlign='start';
    }

    ctx.restore();
  }
}

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 7921-7944
// (drawArena's "── Corridor multi-ricochet balls ──" block). The
// S.corMultiRicPhase gate is kept inside the function — call
// unconditionally every frame.
export function drawCorMultiRic(){
  const ctx=aCtx;
  if(S.corMultiRicPhase){
    ctx.save();
    ctx.beginPath(); ctx.rect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2); ctx.clip();
    for(const b of S.corMultiRicBalls){
      if(b.state==='done'||b.state==='wait') continue;
      // Trail
      for(let i=1;i<b.trail.length;i++){
        const alpha=(i/b.trail.length)*0.6;
        ctx.strokeStyle=`rgba(255,160,30,${alpha})`;
        ctx.lineWidth=1+(i/b.trail.length)*3;
        ctx.beginPath();
        ctx.moveTo(b.trail[i-1].x,b.trail[i-1].y);
        ctx.lineTo(b.trail[i].x,b.trail[i].y);
        ctx.stroke();
      }
      // Glow
      ctx.fillStyle='rgba(255,160,0,0.4)';
      ctx.beginPath(); ctx.arc(b.x,b.y,CMR_R*2,0,Math.PI*2); ctx.fill();
      // Ball
      ctx.fillStyle='rgba(255,255,180,1)';
      ctx.beginPath(); ctx.arc(b.x,b.y,CMR_R,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 7872-7900
// (drawArena's "── Spin rapid attack ──" block). The S.corSpinRapidPhase
// gate is kept inside the function — call unconditionally every frame.
export function drawCorSpinRapid(){
  const ctx=aCtx;
  if(S.corSpinRapidPhase){
    const cx=ARENA_W/2, cy=ARENA_H/2;
    const ang=S.corSpinAngle;
    const h=CSR_BOX_HALF;
    ctx.save();
    ctx.translate(cx,cy);
    ctx.rotate(ang);
    // Box — filled, damaging brick
    const pulse=0.7+0.3*Math.sin(S.tick*0.3);
    ctx.fillStyle=`rgba(200,60,0,${pulse*0.85})`;
    ctx.fillRect(-h,-h,h*2,h*2);
    ctx.strokeStyle=`rgba(255,140,0,${pulse})`;
    ctx.lineWidth=3;
    ctx.strokeRect(-h,-h,h*2,h*2);
    ctx.restore();
    // Bullets
    ctx.save();
    ctx.beginPath(); ctx.rect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2); ctx.clip();
    for(const b of S.corSpinBullets){
      const glow=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,CSR_BULLET_R*3);
      glow.addColorStop(0,'rgba(255,150,0,0.5)');
      glow.addColorStop(1,'rgba(255,80,0,0)');
      ctx.fillStyle=glow;
      ctx.beginPath(); ctx.arc(b.x,b.y,CSR_BULLET_R*3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,220,100,1)';
      ctx.beginPath(); ctx.arc(b.x,b.y,CSR_BULLET_R,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 7837-7869
// (drawArena's "── Heal VFX ──" text-popup block followed by the
// "── Heal orbs ──" block). Both S._healVfxTimer>0 and S.healOrbs gates
// are kept inside the function — call unconditionally every frame.
export function drawHealOrbs(){
  // Heal VFX (floating "+N" text popup)
  if(S._healVfxTimer>0){
    S._healVfxTimer--;
    const prog=S._healVfxTimer/40;
    const floatY=S.py-20-(1-prog)*18;
    aCtx.save();
    aCtx.globalAlpha=prog;
    aCtx.font="bold 18px 'VT323', monospace";
    aCtx.textAlign='center';
    aCtx.fillStyle='#44ffaa';
    aCtx.fillText('+'+HEAL_ORB_HEAL, S.px, floatY);
    aCtx.restore();
  }

  // Heal orbs
  if(S.healOrbs&&S.healOrbs.length>0){
    for(const o of S.healOrbs){
      if(o.state==='done'||o.state==='away') continue;
      const pulse=0.7+0.3*Math.sin(S.tick*0.2+o.id*1.5);
      // Glow
      const g=aCtx.createRadialGradient(o.x,o.y,0,o.x,o.y,HEAL_ORB_R*2.5);
      g.addColorStop(0,`rgba(80,255,160,${pulse*0.5})`);
      g.addColorStop(1,'rgba(0,255,100,0)');
      aCtx.fillStyle=g;
      aCtx.beginPath(); aCtx.arc(o.x,o.y,HEAL_ORB_R*2.5,0,Math.PI*2); aCtx.fill();
      // Core
      aCtx.fillStyle=`rgba(180,255,220,${pulse})`;
      aCtx.beginPath(); aCtx.arc(o.x,o.y,HEAL_ORB_R,0,Math.PI*2); aCtx.fill();
      // Cross
      aCtx.fillStyle=`rgba(255,255,255,${pulse*0.9})`;
      aCtx.fillRect(o.x-5,o.y-1.5,10,3);
      aCtx.fillRect(o.x-1.5,o.y-5,3,10);
    }
  }
}
