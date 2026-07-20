import { beginCredits } from './credits.js';

// ── SECURITY SCENE ─────────────────────────────
export function beginSecurityScene(){
  const cv=document.createElement('canvas');
  cv.width=720; cv.height=480;
  cv.style.cssText='position:fixed;inset:0;margin:auto;display:block;background:#000;z-index:300;';
  document.body.appendChild(cv);
  const ctx=cv.getContext('2d');
  const W=720,H=480;

  // stages: 0=flashlight blinds, 1=hold white, 2=fall, 3=black hold, 4=credits
  let stage=0, sT=0;
  let fallRot=0, fallDrop=0;

  function vignette(s){
    const vg=ctx.createRadialGradient(W/2,H/2,H*0.1,W/2,H/2,W*0.75);
    vg.addColorStop(0,'rgba(0,0,0,0)');
    vg.addColorStop(1,`rgba(0,0,0,${s})`);
    ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);

    // ── STAGE 0: flashlight ramps up and blinds ──
    if(stage===0){
      // Beam starts dim, rapidly overwhelms the screen
      const prog=Math.min(sT/60,1);
      const eased=prog*prog; // accelerates

      // Outer warm glow fills room first
      const roomGlow=ctx.createRadialGradient(W/2,H*0.08,10,W/2,H*0.08,W*1.2);
      roomGlow.addColorStop(0,`rgba(255,250,220,${eased*0.9})`);
      roomGlow.addColorStop(0.4,`rgba(230,215,160,${eased*0.5})`);
      roomGlow.addColorStop(1,`rgba(200,180,100,${eased*0.15})`);
      ctx.fillStyle=roomGlow; ctx.fillRect(0,0,W,H);

      // Tight hard cone from top center
      const coneAlpha=Math.min(eased*1.4,1);
      ctx.save();
      ctx.translate(W/2, H*0.02);
      const spread=0.08+eased*0.25;
      const cg=ctx.createRadialGradient(0,0,2,0,0,H*1.1);
      cg.addColorStop(0,`rgba(255,255,255,${coneAlpha})`);
      cg.addColorStop(0.12,`rgba(255,255,220,${coneAlpha*0.9})`);
      cg.addColorStop(0.4,`rgba(240,230,180,${coneAlpha*0.4})`);
      cg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.lineTo(Math.sin(-spread)*H*1.1, Math.cos(-spread)*H*1.1);
      ctx.lineTo(Math.sin( spread)*H*1.1, Math.cos( spread)*H*1.1);
      ctx.closePath();
      ctx.fillStyle=cg; ctx.fill();
      ctx.restore();

      // White core at lens — gets bigger
      const lensR=4+eased*60;
      const lensG=ctx.createRadialGradient(W/2,H*0.04,0,W/2,H*0.04,lensR);
      lensG.addColorStop(0,'rgba(255,255,255,1)');
      lensG.addColorStop(0.5,`rgba(255,255,230,${coneAlpha*0.8})`);
      lensG.addColorStop(1,'rgba(255,255,200,0)');
      ctx.fillStyle=lensG; ctx.beginPath(); ctx.arc(W/2,H*0.04,lensR,0,Math.PI*2); ctx.fill();

      // Final blow — full white wash in last 10 frames
      if(sT>50){
        const blowA=Math.min((sT-50)/10,1);
        ctx.fillStyle=`rgba(255,255,255,${blowA})`; ctx.fillRect(0,0,W,H);
      }

      if(sT>62){ stage=1; sT=0; }
    }

    // ── STAGE 1: hold blinded white + "Don't move." ──
    if(stage===1){
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);
      // Dialogue fades in over white
      if(sT>10){
        const ta=Math.min((sT-10)/12,1);
        ctx.save();
        ctx.font=`28px 'VT323',monospace`;
        ctx.textAlign='center';
        ctx.fillStyle=`rgba(30,20,10,${ta})`;
        ctx.fillText('Don\'t move.', W/2, H*0.52);
        ctx.restore();
      }
      if(sT>70){ stage=2; sT=0; }
    }

    // ── STAGE 2: shot — orange flash then quick black ──
    if(stage===2){
      if(sT<=1){
        // Pure white burst
        ctx.fillStyle='rgba(255,255,240,1)'; ctx.fillRect(0,0,W,H);
      } else if(sT<=4){
        // Orange ring
        ctx.fillStyle='rgba(255,180,60,0.8)'; ctx.fillRect(0,0,W,H);
        const fg=ctx.createRadialGradient(W/2,H*0.06,0,W/2,H*0.06,(sT-1)*110);
        fg.addColorStop(0,'rgba(255,255,255,0.9)');
        fg.addColorStop(0.5,'rgba(255,200,80,0.5)');
        fg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=fg; ctx.fillRect(0,0,W,H);
      } else {
        const d=Math.min((sT-4)/8,1);
        ctx.fillStyle=`rgba(0,0,0,${d})`; ctx.fillRect(0,0,W,H);
      }
      if(sT>16){ stage=3; sT=0; fallRot=0; fallDrop=0; }
    }

    // ── STAGE 3: first-person fall ──
    if(stage===3){
      const accel=Math.min(sT*0.045,2.8);
      fallRot+=accel*0.85;
      fallDrop+=accel*3.0;

      ctx.save();
      ctx.translate(W/2, H*0.45);
      ctx.rotate(fallRot*Math.PI/180);
      ctx.translate(-W/2,-H*0.45);

      const floorY=H*0.5+fallDrop;
      ctx.fillStyle='#0d0d0d'; ctx.fillRect(0,Math.min(floorY,H),W,H);
      if(floorY<H){
        ctx.strokeStyle='rgba(35,35,35,0.9)'; ctx.lineWidth=1;
        for(let tx=0;tx<W*2;tx+=55){
          ctx.beginPath(); ctx.moveTo(tx,floorY);
          ctx.lineTo(W/2+(tx-W/2)*0.15,H+80); ctx.stroke();
        }
        for(let i=0;i<6;i++){
          const fy=floorY+i*55*(0.4+Math.min(sT/40,1)*0.6);
          if(fy>H) break;
          ctx.beginPath(); ctx.moveTo(0,fy); ctx.lineTo(W,fy); ctx.stroke();
        }
      }
      if(floorY>0){
        ctx.fillStyle='#0a0705';
        ctx.fillRect(0,0,W,Math.min(floorY,H));
      }
      ctx.restore();

      vignette(Math.min(sT/55,1)*0.92);

      if(sT>65){
        ctx.fillStyle=`rgba(0,0,0,${Math.min((sT-65)/22,1)})`; ctx.fillRect(0,0,W,H);
      }
      if(sT>92){ stage=4; sT=0; }
    }

    // ── STAGE 4: black hold ──
    if(stage===4){
      ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
      if(sT>45){ stage=5; sT=0; }
    }

    // ── STAGE 5: go to credits ──
    if(stage===5){
      cv.remove(); beginCredits(); return;
    }

    sT++;
    requestAnimationFrame(draw);
  }
  draw();
}
