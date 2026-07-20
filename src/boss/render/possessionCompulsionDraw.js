import { S } from '../../state/gameState.js';
import { arenaCanvas, aCtx } from '../../core/canvasRefs.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { spawnParticles } from '../../core/particles.js';
import { POS_CHARGE_DUR, POS_WARN_DUR, POS_BEAM_LEN, POS_BEAM_THICK } from '../attacks/possession.js';
import { CMP_PULSE_COUNT, CMP_PULL_DUR, CMP_RELEASE_DUR, CMP_ZONE_R } from '../attacks/compulsion.js';

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 8164-8252
// (drawArena's "── Possession drawing ──" block). The S.possessionPhase
// gate is kept inside the function — call unconditionally every frame.
export function drawPossession(){
  const ctx=aCtx;
  const t=S.tick;
  if(S.possessionPhase){
    ctx.save();
    ctx.beginPath(); ctx.rect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2); ctx.clip();

    // Blue flash before invert kicks in
    if(S.possessionFlash>0){
      const alpha=S.possessionFlash/20;
      ctx.fillStyle=`rgba(60,120,255,${alpha*0.85})`;
      ctx.fillRect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2);
      // Bright center burst
      const bg=ctx.createRadialGradient(ARENA_W/2,ARENA_H/2,0,ARENA_W/2,ARENA_H/2,ARENA_W);
      bg.addColorStop(0,`rgba(180,200,255,${alpha*0.9})`);
      bg.addColorStop(1,`rgba(20,60,200,${alpha*0.3})`);
      ctx.fillStyle=bg; ctx.fillRect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2);
    }

    // Charge phase — blue pulse from center
    if(!S.possessionInverted){
      const chProg=Math.min(1, S.possessionTimer/POS_CHARGE_DUR);
      const pulse=0.3+0.25*Math.sin(t*0.6);
      const cg=ctx.createRadialGradient(ARENA_W/2,ARENA_H/2,0,ARENA_W/2,ARENA_H/2,40*chProg);
      cg.addColorStop(0,`rgba(80,120,255,${(0.4+pulse)*chProg})`);
      cg.addColorStop(1,'rgba(0,0,80,0)');
      ctx.fillStyle=cg; ctx.fillRect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2);
      // Beam from center to player as it charges
      if(chProg>0.3){
        const a=Math.atan2(S.py-ARENA_H/2, S.px-ARENA_W/2);
        const ex=ARENA_W/2+Math.cos(a)*POS_BEAM_LEN;
        const ey=ARENA_H/2+Math.sin(a)*POS_BEAM_LEN;
        ctx.strokeStyle=`rgba(100,150,255,${(chProg-0.3)*0.7})`;
        ctx.lineWidth=4; ctx.setLineDash([6,6]);
        ctx.beginPath(); ctx.moveTo(ARENA_W/2,ARENA_H/2); ctx.lineTo(ex,ey); ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Possessed — purple vignette overlay
    if(S.possessionInverted){
      const pv=0.12+0.06*Math.sin(t*0.3);
      ctx.fillStyle=`rgba(60,0,120,${pv})`;
      ctx.fillRect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2);
      // "POSSESSED" label
      if(Math.floor(t/10)%2===0){
        ctx.fillStyle='rgba(160,80,255,0.7)';
        ctx.font='bold 9px monospace'; ctx.textAlign='center';
        ctx.fillText('INVERTED', ARENA_W/2, AM+10);
        ctx.textAlign='start';
      }
      // Inverted arrow hints on edges
      ctx.fillStyle='rgba(120,60,220,0.5)';
      ctx.font='bold 11px monospace'; ctx.textAlign='center';
      ctx.fillText('↓', ARENA_W/2, AM+20);
      ctx.fillText('↑', ARENA_W/2, ARENA_H-AM-6);
      ctx.textAlign='start';
    }

    // Draw beams
    for(const b of S.possessionBeams){
      if(b.done) continue;
      const cos=Math.cos(b.angle), sin=Math.sin(b.angle);
      const ex=b.cx+cos*POS_BEAM_LEN, ey=b.cy+sin*POS_BEAM_LEN;
      const aimCol=b.isAimed?'200,80,255':'100,140,255';

      if(b.warn){
        const wProg=b.timer/POS_WARN_DUR;
        const pulse=0.25+0.2*Math.sin(t*0.8);
        ctx.strokeStyle=`rgba(${aimCol},${pulse+wProg*0.3})`;
        ctx.lineWidth=POS_BEAM_THICK; ctx.setLineDash([8,6]);
        ctx.beginPath(); ctx.moveTo(b.cx,b.cy); ctx.lineTo(ex,ey); ctx.stroke();
        ctx.setLineDash([]);
        // center dot
        ctx.fillStyle=`rgba(${aimCol},0.8)`;
        ctx.beginPath(); ctx.arc(b.cx,b.cy,5,0,Math.PI*2); ctx.fill();
      } else if(b.active){
        // outer glow
        ctx.strokeStyle=`rgba(${aimCol},0.25)`; ctx.lineWidth=POS_BEAM_THICK+12; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(b.cx,b.cy); ctx.lineTo(ex,ey); ctx.stroke();
        // core
        ctx.strokeStyle=`rgba(${aimCol},0.92)`; ctx.lineWidth=POS_BEAM_THICK;
        ctx.beginPath(); ctx.moveTo(b.cx,b.cy); ctx.lineTo(ex,ey); ctx.stroke();
        // bright edge
        ctx.strokeStyle='rgba(220,200,255,0.8)'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(b.cx,b.cy); ctx.lineTo(ex,ey); ctx.stroke();
        if(t%2===0) spawnParticles(b.cx+cos*Math.random()*POS_BEAM_LEN, b.cy+sin*Math.random()*POS_BEAM_LEN, b.isAimed?'#cc44ff':'#6688ff',1,2,10);
      }
    }

    ctx.restore();
  }
}

// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 8255-8389
// (drawArena's "── Compulsion drawing ──" block). The S.compulsionPhase
// gate is kept inside the function — call unconditionally every frame.
export function drawCompulsion(){
  const ctx=aCtx;
  const t=S.tick;
  if(S.compulsionPhase){
    ctx.save();
    ctx.beginPath(); ctx.rect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2); ctx.clip();

    const isPull=S._cmpState==='pull';
    const cycleLen=CMP_PULL_DUR+CMP_RELEASE_DUR;
    const cycleT=S.compulsionTimer%cycleLen;
    const pulse=Math.floor(S.compulsionTimer/cycleLen)+1;
    const pullProg=isPull?cycleT/CMP_PULL_DUR:0;
    const dxZ=S.compulsionZoneX-S.px, dyZ=S.compulsionZoneY-S.py;
    const distToZone=Math.sqrt(dxZ*dxZ+dyZ*dyZ)||1;
    const proximity=Math.max(0,1-(distToZone/(CMP_ZONE_R*5)));

    // S._cmpGlitchFlash decrements once per tick in
    // boss/attacks/compulsion.js's updateCompulsion(), not here — this used
    // to decrement once per rendered frame instead, which drifted from
    // gamespeed once ticks and frames stopped being 1:1.

    // STUN flash — burst when core touched
    if(S._cmpGlitchFlash>0){
      const fa=S._cmpGlitchFlash/20;
      // Full screen flash
      ctx.fillStyle=`rgba(200,80,255,${fa*0.9})`;
      ctx.fillRect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2);
      // Heavy slice tears
      for(let g=0;g<16;g++){
        const gy=AM+Math.random()*(ARENA_H-AM*2);
        const gh=Math.random()*12+3;
        const gx=(Math.random()-0.5)*50;
        if(gy+gh<ARENA_H){
          const sd=ctx.getImageData(AM,gy,ARENA_W-AM*2,gh);
          ctx.putImageData(sd,AM+gx,gy);
        }
      }
      // Black bars
      for(let b2=0;b2<4;b2++){
        const by2=AM+Math.random()*(ARENA_H-AM*2);
        ctx.fillStyle=`rgba(0,0,0,${fa*0.8})`;
        ctx.fillRect(AM,by2,ARENA_W-AM*2,Math.random()*10+4);
      }
    }

    // Proximity glitch — increases sharply near core, screen-blocking at close range
    if(isPull && proximity>0.05 && S._cmpStun<=0){
      const glitchStrength=proximity*28;
      const glitchLines=Math.floor(proximity*14)+1;
      // Horizontal slice shifts
      for(let g=0;g<glitchLines;g++){
        const gy=AM+Math.random()*(ARENA_H-AM*2);
        const gh=2+Math.random()*8;
        const gx=((Math.random()-0.5)*2)*glitchStrength;
        if(gy+gh<ARENA_H){
          const sd=ctx.getImageData(AM,gy,ARENA_W-AM*2,gh);
          ctx.putImageData(sd,AM+gx,gy);
        }
      }
      // Purple wash — gets heavy near core
      ctx.fillStyle=`rgba(160,0,255,${proximity*0.25})`;
      ctx.fillRect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2);
      // Scanlines
      if(proximity>0.3){
        ctx.fillStyle=`rgba(0,0,0,${proximity*0.3})`;
        for(let sl=AM;sl<ARENA_H-AM;sl+=3) ctx.fillRect(AM,sl,ARENA_W-AM*2,1);
      }
      // Wide black bars flickering
      if(proximity>0.5 && Math.floor(t/2)%2===0){
        const bh=Math.floor(proximity*20);
        for(let b2=0;b2<3;b2++){
          const by2=AM+Math.random()*(ARENA_H-AM*2-bh);
          ctx.fillStyle=`rgba(0,0,0,${proximity*0.6})`;
          ctx.fillRect(AM,by2,ARENA_W-AM*2,bh);
        }
      }
      // Near-total screen wipe at very close range
      if(proximity>0.75){
        ctx.fillStyle=`rgba(80,0,160,${(proximity-0.75)*1.2})`;
        ctx.fillRect(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2);
        // RGB split — strong
        const off=Math.floor(proximity*8);
        const imgD=ctx.getImageData(AM,AM,ARENA_W-AM*2,ARENA_H-AM*2);
        ctx.globalAlpha=0.25;
        ctx.putImageData(imgD,AM+off,AM);
        ctx.putImageData(imgD,AM-off,AM);
        ctx.globalAlpha=1;
      }
    }

    // Pull lines — arrow toward border point
    if(isPull && S._cmpStun<=0){
      ctx.beginPath(); ctx.moveTo(S.px,S.py);
      ctx.lineTo(S.compulsionZoneX, S.compulsionZoneY);
      ctx.strokeStyle=`rgba(160,80,255,${pullProg*0.5})`;
      ctx.lineWidth=2; ctx.setLineDash([3,4]);
      ctx.stroke(); ctx.setLineDash([]);
    }

    // Border wall segment — glowing danger strip along the wall
    {
      const zPulse=0.5+0.3*Math.sin(t*0.5);
      const stunned=S._cmpStun>0;
      const wallAlpha=stunned?0.15:(isPull?0.3+pullProg*0.35:0.2);
      const side=S.compulsionZoneSide||0;
      const IW=ARENA_W-AM*2, IH=ARENA_H-AM*2;
      const thick=10; // wall strip thickness

      ctx.fillStyle=`rgba(180,0,255,${wallAlpha})`;
      ctx.strokeStyle=stunned?`rgba(255,255,255,0.5)`:`rgba(200,80,255,${0.7+zPulse*0.3})`;
      ctx.lineWidth=2; ctx.setLineDash([]);

      let wx,wy,ww,wh;
      if(side===0){      wx=AM;         wy=AM;          ww=IW; wh=thick; } // top
      else if(side===1){ wx=AM;         wy=ARENA_H-AM-thick; ww=IW; wh=thick; } // bottom
      else if(side===2){ wx=AM;         wy=AM;          ww=thick; wh=IH; } // left
      else             { wx=ARENA_W-AM-thick; wy=AM;    ww=thick; wh=IH; } // right

      ctx.fillRect(wx,wy,ww,wh);
      ctx.strokeRect(wx,wy,ww,wh);

      // Bright center dot at the exact pull target point
      ctx.fillStyle=`rgba(220,120,255,${isPull?0.6+pullProg*0.4:0.3})`;
      ctx.beginPath(); ctx.arc(S.compulsionZoneX,S.compulsionZoneY,5,0,Math.PI*2); ctx.fill();
      if(!stunned && isPull){
        ctx.strokeStyle=`rgba(255,180,255,${0.5+zPulse*0.4})`;
        ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(S.compulsionZoneX,S.compulsionZoneY,10+zPulse*4,0,Math.PI*2); ctx.stroke();
      }
    }

    // Label
    const label=S._cmpStun>0?`STUNNED`:`PULL ${pulse}/${CMP_PULSE_COUNT}${isPull?'':' — BREAK FREE'}`;
    ctx.fillStyle=S._cmpStun>0?'rgba(255,200,255,0.8)':'rgba(200,100,255,0.7)';
    ctx.font='bold 9px monospace'; ctx.textAlign='left';
    ctx.fillText(label, AM+4, AM+10);
    ctx.textAlign='start';

    ctx.restore();
  }
}
