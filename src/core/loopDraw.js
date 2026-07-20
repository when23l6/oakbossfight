// Pure rendering for one animation frame — split out of core/loop.js to keep
// that file under the project's 300-line limit once it grew a delta-time
// accumulator. Called once per rendered frame (not once per logical tick
// like loop.js's updateOnce()) by loop()'s requestAnimationFrame callback,
// after however many update ticks ran that frame.
import { S } from '../state/gameState.js';
import { bossCanvas, bCtx, elArena, pCanvas } from './canvasRefs.js';
import { drawBxParticles } from './particles.js';
import { drawBoss } from '../boss/render/bossCommon.js';
import { drawArena } from '../boss/render/drawArena.js';
import { drawPreMeditate } from '../boss/preMeditate.js';

export function drawOnce(){
  drawBoss(S.tick);
  // "Dodged" text VFX during dodge animation
  if(S.corRGStage==='dodge' && S.corRGDodgeTimer>0){
    const prog=Math.min(1, S.corRGDodgeTimer/20);
    const alpha=prog<0.7 ? 1 : 1-(prog-0.7)/0.3;
    const W=bossCanvas.width, H=bossCanvas.height;
    bCtx.save();
    bCtx.font="bold 48px 'VT323', monospace";
    bCtx.textAlign='center';
    bCtx.textBaseline='middle';
    bCtx.fillStyle=`rgba(255,255,255,${alpha})`;
    bCtx.fillText('Dodged', W/2, H*0.45);
    bCtx.restore();
  }
  // Update arena rotation for slash_rotate — rotate the whole arena section div
  const arenaEl=elArena;
  if(S.arenaRotating && S.turn==='boss' && !S.gameOver && S.atkTimer>=S.rotStart){
    const totalRot=Math.max(1,S.rotEnd-S.rotStart);
    const prog=Math.min(1,(S.atkTimer-S.rotStart)/totalRot);
    arenaEl.style.transform=`rotate(${prog*360}deg)`;
    arenaEl.style.transition='none';
  } else if((S.quadPhase||S.corQuadPhase) && S.quadRotation!==0 && !S.quadBlackout){
    arenaEl.style.transform=`rotate(${S.quadRotation}deg)`;
    arenaEl.style.transition='none';
  } else if((S.quadPhase||S.corQuadPhase) && S.quadBlackout){
    // keep transform as-is during blackout (will be set on exit)
  } else if(S.splitPhase && S.splitXbeamCount>=10){
    S.splitRotStart=S.splitRotStart||S.splitTimer;
    const rotDeg=((S.splitTimer-S.splitRotStart)/380)*360;
    arenaEl.style.transform=`rotate(${rotDeg}deg)`;
    arenaEl.style.transition='none';
  } else if(S.corSSPhase){
    arenaEl.style.transform=`rotate(${S.corSSRotation}deg)`;
    arenaEl.style.transition='none';
  } else if(S.shakeFrames>0){
    const sx=(Math.random()-0.5)*6;
    const sy=(Math.random()-0.5)*4;
    arenaEl.style.transform=`translate(${sx}px,${sy}px)`;
    arenaEl.style.transition='none';
    S.shakeFrames--;
  } else {
    arenaEl.style.transform='';
  }
  drawArena();
  if(S.preMeditatePhase) drawPreMeditate();
  drawBxParticles();
  pCanvas.style.opacity = S.bossHorror ? '1' : '0';
}
