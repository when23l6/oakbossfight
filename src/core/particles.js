// Extracted verbatim from "iron_fist_battle_v8 (2).html":
//   - lines 325-327, 329-362: bxParticles array + spawnBxParticle/drawBxParticles
//     (+ the pCanvas.width=720/height=300 sizing on line 327, which core/canvasRefs.js
//     did not set — this module sets it at load time instead)
//   - lines 6825-6848: spawnParticles/spawnEdgeParticles/updateParticles
import { S } from '../state/gameState.js';
import { pCanvas, pCtx } from './canvasRefs.js';

// Fixed size — battle box is always 720px wide, height set generously
pCanvas.width=720; pCanvas.height=300;

const bxParticles=[];

export function spawnBxParticle(){
  const w=pCanvas.width||720, h=pCanvas.height||200;
  bxParticles.push({
    x: Math.random()*w,
    y: h + Math.random()*20,
    size: 1 + Math.random()*2.5,
    speed: 0.4 + Math.random()*0.8,
    drift: (Math.random()-0.5)*0.3,
    alpha: 0.4 + Math.random()*0.5,
    life: 1.0,
    decay: 0.004 + Math.random()*0.004,
  });
}

export function drawBxParticles(){
  if(!pCtx) return;
  pCtx.clearRect(0,0,pCanvas.width,pCanvas.height);
  if(!S.bossHorror) return;

  // Spawn ~2 particles per frame
  if(Math.random()<0.7) spawnBxParticle();
  if(Math.random()<0.4) spawnBxParticle();

  for(let i=bxParticles.length-1;i>=0;i--){
    const p=bxParticles[i];
    p.y -= p.speed;
    p.x += p.drift;
    p.life -= p.decay;
    if(p.life<=0||p.y<-10){ bxParticles.splice(i,1); continue; }
    const a=p.alpha*p.life;
    pCtx.fillStyle=`rgba(${180+Math.floor(Math.random()*40)},${Math.floor(p.life*30)},0,${a})`;
    pCtx.fillRect(Math.round(p.x), Math.round(p.y), Math.ceil(p.size), Math.ceil(p.size));
  }
}

// ── PARTICLES ──────────────────────────────────
export function spawnParticles(x,y,col,count,speed,life){
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2;
    const sp=speed*(0.4+Math.random()*0.8);
    S.particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,col,life,maxLife:life,r:Math.random()*3+1});
  }
}
export function spawnEdgeParticles(x,y,w,h,col,count){
  for(let i=0;i<count;i++){
    const side=Math.floor(Math.random()*4);
    let px,py,vx,vy;
    if(side===0){px=x+Math.random()*w;py=y;vy=-Math.random()*2-0.5;vx=(Math.random()-0.5)*1.5;}
    else if(side===1){px=x+Math.random()*w;py=y+h;vy=Math.random()*2+0.5;vx=(Math.random()-0.5)*1.5;}
    else if(side===2){px=x;py=y+Math.random()*h;vx=-Math.random()*2-0.5;vy=(Math.random()-0.5)*1.5;}
    else{px=x+w;py=y+Math.random()*h;vx=Math.random()*2+0.5;vy=(Math.random()-0.5)*1.5;}
    S.particles.push({x:px,y:py,vx,vy,col,life:20,maxLife:20,r:Math.random()*2.5+0.5});
  }
}
export function updateParticles(){
  S.particles=S.particles.filter(p=>{
    p.x+=p.vx; p.y+=p.vy; p.vy+=0.08; p.vx*=0.96; p.life--;
    return p.life>0;
  });
}
