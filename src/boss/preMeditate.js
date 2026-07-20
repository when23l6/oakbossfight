// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 8508-8598
// — a standalone function, separate from (and defined immediately after)
// drawArena(). Draws the pre-meditate fade-in/prompt overlay.
import { S } from '../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../state/constants.js';
import { aCtx, elArena } from '../core/canvasRefs.js';

// Orig. lines 8508-8598
export function drawPreMeditate(){
  if(!S.preMeditatePhase) return;
  const ctx=aCtx;
  const t=S.preMeditateTimer;
  const W=ARENA_W, H=ARENA_H;

  // Show the arena section so we can draw on it
  elArena.style.display='';

  // ── Dark overlay fades in over 60 frames ──
  const fadeIn=Math.min(1, t/60);
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle=`rgba(0,0,0,${0.92*fadeIn})`;
  ctx.fillRect(0,0,W,H);

  if(fadeIn<0.3) return; // nothing else until fade is visible

  const presses=S.preMeditatePresses;
  const shine=S.preMeditateShineTimer;

  // ── Edge white shine flash after each press ──
  if(shine>0){
    const shineAlpha=(shine/30)*0.7;
    const edgeW=6;
    // All 4 edges
    ctx.fillStyle=`rgba(255,255,255,${shineAlpha})`;
    ctx.fillRect(AM,AM, W-AM*2, edgeW);         // top
    ctx.fillRect(AM,H-AM-edgeW, W-AM*2, edgeW); // bottom
    ctx.fillRect(AM,AM, edgeW, H-AM*2);          // left
    ctx.fillRect(W-AM-edgeW,AM, edgeW, H-AM*2); // right
    // Inner glow spreading inward
    const spread=Math.round((1-shine/30)*18);
    ctx.fillStyle=`rgba(220,220,255,${shineAlpha*0.35})`;
    ctx.fillRect(AM+edgeW,AM+edgeW, W-AM*2-edgeW*2, spread);
    ctx.fillRect(AM+edgeW,H-AM-edgeW-spread, W-AM*2-edgeW*2, spread);
    ctx.fillRect(AM+edgeW,AM+edgeW, spread, H-AM*2-edgeW*2);
    ctx.fillRect(W-AM-edgeW-spread,AM+edgeW, spread, H-AM*2-edgeW*2);
  }

  // ── "MEDITATE" title text ──
  const textFade=Math.min(1,(t-20)/40);
  if(textFade<=0) return;

  ctx.save();
  ctx.textAlign='center';
  ctx.textBaseline='middle';

  // Subtle glow behind text
  ctx.fillStyle=`rgba(180,220,255,${0.08*textFade})`;
  ctx.fillRect(AM, H/2-36, W-AM*2, 72);

  // Main title
  ctx.font=`${Math.floor(28*textFade)}px 'VT323', monospace`;
  ctx.fillStyle=`rgba(200,230,255,${0.55*textFade})`;
  ctx.fillText('M E D I T A T E', W/2, H/2-14);

  // Press prompt (pulsing, appears after fade)
  const pulse=0.55+0.3*Math.sin(t*0.12);
  const promptFade=Math.min(1,(t-50)/30)*textFade;
  ctx.font=`13px 'VT323', monospace`;
  ctx.fillStyle=`rgba(160,200,255,${pulse*promptFade})`;

  if(presses>=3){
    ctx.fillStyle=`rgba(255,255,200,${pulse*promptFade})`;
    ctx.fillText('...', W/2, H/2+14);
  }

  // ── Key hint — all disappear together on first press ──
  const keyLabels=['CLICK','SPACE','ENTER','Z'];
  if(presses<3){
    ctx.font=`14px 'VT323', monospace`;
    ctx.textAlign='left';
    const slashW=ctx.measureText(' / ').width;
    const labelWidths=keyLabels.map(k=>ctx.measureText(k).width);
    const totalW=labelWidths.reduce((s,w)=>s+w,0)+slashW*(keyLabels.length-1);
    let cx2=W/2-totalW/2;
    for(let i=0;i<keyLabels.length;i++){
      ctx.fillStyle=`rgba(160,200,255,${0.65*textFade})`;
      ctx.fillText(keyLabels[i], cx2, H/2+30);
      cx2+=labelWidths[i];
      if(i<keyLabels.length-1){
        ctx.fillStyle=`rgba(100,140,180,${0.4*textFade})`;
        ctx.fillText(' / ', cx2, H/2+30);
        cx2+=slashW;
      }
    }
    ctx.textAlign='center';
  }

  ctx.restore();
}
