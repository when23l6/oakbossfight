// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 4427-4660
// (── PLATFORM SYSTEM ── header comment through the end of function
// updateSplit()). Logic only.
//
// NOTE on file layout: the original has two attacks back to back —
// updatePlatforms() (platform-drop phase) and updateSplit() (split-arena
// phase). There is no beginPlatforms()/beginSplit() pair: platPhase is
// switched on elsewhere (outside this range, in the phase-4 cutscene logic)
// and updatePlatforms() flips S.splitPhase=true directly inline at its end
// to hand off to updateSplit(). Since docs/architecture.md's planned layout
// lists a single `platforms.js` (no separate `split.js`) and the combined
// logic fits well under the 300-line limit, both functions are kept together
// here rather than split into a second file.
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { makeZone } from '../zones.js';
import { say, updateHP } from '../../ui/menu.js';
import { loseGame } from '../../ui/overlay.js';
import { elArena, elMenu } from '../../core/canvasRefs.js';
import { beginQuadPhase } from './quadPhase.js';

// ── PLATFORM SYSTEM────────
// Called each frame during platform phase
export function updatePlatforms(){
  if(!S.platPhase) return;
  S.platTimer++;
  const t=S.platTimer;
  const IW=ARENA_W-AM*2, IH=ARENA_H-AM*2;
  const platW=60, platH=10;
  const dropSpeed=0.8; // px per frame platforms fall

  // Left/right movement
  if(!S.gameOver){
  if(S.keys['ArrowLeft']||S.keys['a']) S.px=Math.max(AM+9,S.px-3.2);
  if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(ARENA_W-AM-9,S.px+3.2);
  }

  // Spawn a new platform every 120 frames (2 sec), max 2 visible
  // Each platform starts near top, drops slowly
  if(t===1 || (t%72===0 && S.platforms.length<10 && S.platSpawnCount<50)){
    // pick x not too close to existing platform
    let px;
    let tries=0;
    do {
      px = AM+10+Math.floor(Math.random()*(IW-platW-20));
      tries++;
    } while(tries<10 && S.platforms.some(p=>Math.abs(p.x-px)<platW+10));
    S.platforms.push({
      x:px, y:AM+10, w:platW, h:platH,
      id:t, standing:false,
    });
    S.platSpawnCount=(S.platSpawnCount||0)+1;
    // Y-line beams only start after 2nd platform spawns
    if(S.platSpawnCount>=2 && S.platforms.length>=1){
      const beamW=16;
      const highest=S.platforms.reduce((a,b)=>a.y<b.y?a:b);
      for(let b=0;b<2;b++){
        const bx=highest.x+b*(Math.floor(highest.w/2)-beamW/2);
        S.zones.push(makeZone({x:Math.max(AM,Math.min(ARENA_W-AM-beamW,bx)),y:AM,w:beamW,h:IH,color:'#cc44ff',warnDur:40,activeDur:20,startTick:S.atkTimer+10+b*5}));
      }
    }
  }

  // Drop all platforms
  for(const p of S.platforms){
    p.y+=dropSpeed;
  }

  // Remove platforms that have fallen off screen
  S.platforms=S.platforms.filter(p=>p.y<ARENA_H-AM);

  // Floor becomes killbrick after 5 sec (300 frames)
  S.floorDmg=t>300;

  // Player stands on platform if overlapping
  let onPlatform=false;
  for(const p of S.platforms){
    // check if player feet are on top of platform
    if(S.px+6>p.x && S.px-6<p.x+p.w &&
       S.py+8>=p.y && S.py+8<=p.y+p.h+6 && S.vy>=0){
      S.py=p.y-8;
      S.vy=0;
      onPlatform=true;
    }
  }

  // Gravity — always on during platform phase
  const onGround=S.py>=ARENA_H-AM-10;
  const canJump=onPlatform||onGround;
  if(!canJump){
    S.vy=S.vy+0.3;
  } else {
    if(!onPlatform) S.vy=0; // clamp to ground
    if(S.keys['ArrowUp']||S.keys['w']||S.keys[' ']||S.keys['Enter']) S.vy=-5.8;
  }
  S.py=Math.min(ARENA_H-AM-9, Math.max(AM+9, S.py+S.vy));

  // Floor damage
  if(S.floorDmg && S.py>=ARENA_H-AM-12 && S.pHitFlash<=0&&S.pSilentFlash<=0){
    const dmg=3;
    S.playerHP=Math.max(0,S.playerHP-dmg);
    S.pHitFlash=30; updateHP();
    if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;setTimeout(loseGame,500);}
  }

  // Platform phase ends -> split phase
  if(t>=1800){
    S.platPhase=false;
    S.floorDmg=false;
    S.platforms=[];
    S.gravity=true;
    S.vy=0; S.vy2=0;
    const mid=ARENA_W/2;
    S.px=Math.max(AM+9,Math.min(mid-9,S.px));
    S.px2=mid+Math.max(9,(ARENA_W/2-AM)/2);
    S.py2=ARENA_H-AM-9;
    S.splitPhase=true;
    S.splitTimer=0;
    S.zones=[];
    S.platforms=[];
    S.floorDmg=false;
    say('The arena splits.');
  }
}

export function updateSplit(){
  if(!S.splitPhase) return;
  S.splitTimer++;
  const t=S.splitTimer;
  const mid=ARENA_W/2;
  const spd=3.2;
  const canJump=S.keys['ArrowUp']||S.keys['w']||S.keys[' ']||S.keys['Enter'];
  const goLeft=S.keys['ArrowLeft']||S.keys['a'];
  const goRight=S.keys['ArrowRight']||S.keys['d'];

  // LEFT heart: player controls normally, clamped to left half
  if(!S.gameOver){
  if(goLeft)  S.px=Math.max(AM+9, S.px-spd);
  if(goRight) S.px=Math.min(mid-9, S.px+spd);
  S.px=Math.max(AM+9,Math.min(mid-9,S.px)); // cannot cross mid line

  // RIGHT heart: mirrors — left key moves it right, right key moves it left
  if(goLeft)  S.px2=Math.min(ARENA_W-AM-9, S.px2+spd);
  if(goRight) S.px2=Math.max(mid+9, S.px2-spd);
  S.px2=Math.max(mid+9,Math.min(ARENA_W-AM-9,S.px2)); // cannot cross mid line
  }

  // Platform collision BEFORE gravity (so standing is detected first)
  let onPlat1=false, onPlat2=false;
  if(t>320 && S.splitPlats){
    for(const p of S.splitPlats){
      if(p.side==='L' && S.px+6>p.x&&S.px-6<p.x+p.w&&S.py+8>=p.y&&S.py+8<=p.y+p.h+6&&S.vy>=0){
        S.py=p.y-8; S.vy=0; onPlat1=true;
      }
      if(p.side==='R' && S.px2+6>p.x&&S.px2-6<p.x+p.w&&S.py2+8>=p.y&&S.py2+8<=p.y+p.h+6&&S.vy2>=0){
        S.py2=p.y-8; S.vy2=0; onPlat2=true;
      }
    }
  }

  // Gravity: left heart
  S.vy=S.vy+0.28;
  const onGround1=S.py>=ARENA_H-AM-9;
  if(onGround1||onPlat1){S.vy=0;if(canJump)S.vy=-5.8;}
  S.py=Math.min(t>520?ARENA_H:ARENA_H-AM-9, S.py+S.vy);

  // Gravity: right heart
  S.vy2=S.vy2+0.28;
  const onGround2=S.py2>=ARENA_H-AM-9;
  if(onGround2||onPlat2){S.vy2=0;if(canJump)S.vy2=-5.8;}
  S.py2=Math.min(t>520?ARENA_H:ARENA_H-AM-9, S.py2+S.vy2);

  // Killbrick floor after platforms start
  if(t>520){
    if(S.py>=ARENA_H-AM-9&&S.pHitFlash<=0&&S.pSilentFlash<=0){S.playerHP=Math.max(0,S.playerHP-3);S.pHitFlash=30;updateHP();if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;setTimeout(loseGame,500);}}
    if(S.py2>=ARENA_H-AM-9&&S.p2HitFlash<=0){S.playerHP=Math.max(0,S.playerHP-3);S.p2HitFlash=30;updateHP();if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;setTimeout(loseGame,500);}}
  }

  // Shockwaves both directions — 4 waves (t=10,90,170,250)
  if(t<=250 && t%80===10){
    S.zones.push(makeZone({type:'wave_lr',startTick:S.atkTimer,color:'#2255ff',x:ARENA_W-AM,y:0,w:24,h:0}));
    S.zones.push(makeZone({type:'wave_rl',startTick:S.atkTimer,color:'#2255ff',x:AM,y:0,w:24,h:0}));
  }

  // After 4 shockwaves: platform + y-beam phase
  if(t>320){
    const mid=ARENA_W/2;
    const IW2=mid-AM; // width of one half
    const platW=30, platH=10;

    // Spawn mirrored platforms every 100 frames, up to 25 pairs
    if((t-320)%100===1 && (S.splitPlats||[]).length<50){
      const relX=AM+10+Math.floor(Math.random()*(IW2-platW-20));
      // Left platform
      S.splitPlats=S.splitPlats||[];
      S.splitPlats.push({x:relX,y:AM+20,w:platW,h:platH,side:'L'});
      // Right mirror
      const mirX=mid+(mid-AM-(relX-AM)-platW);
      S.splitPlats.push({x:mirX,y:AM+20,w:platW,h:platH,side:'R'});
    }

    // Drop platforms
    S.splitPlats=S.splitPlats||[];
    for(const p of S.splitPlats) p.y+=0.8;
    S.splitPlats=S.splitPlats.filter(p=>p.y<ARENA_H-AM);

    // X-beams targeting highest platform y — stop after 10 pairs
    S.splitXbeamCount=S.splitXbeamCount||0;
    if(S.splitXbeamCount<10 && (t-320)%120===60 && S.splitPlats.length>0){
      const IW=ARENA_W-AM*2, beamH=14, WARN=40, ACT=20;
      const leftPlats=S.splitPlats.filter(p=>p.side==='L');
      const rightPlats=S.splitPlats.filter(p=>p.side==='R');
      if(leftPlats.length>0){
        const hp=leftPlats.reduce((a,b)=>a.y<b.y?a:b);
        const by=Math.max(AM, hp.y+Math.floor(hp.h/2)-beamH/2);
        S.zones.push(makeZone({x:AM,y:by,w:IW,h:beamH,color:'#cc44ff',warnDur:WARN,activeDur:ACT,startTick:S.atkTimer}));
      }
      if(rightPlats.length>0){
        const hp=rightPlats.reduce((a,b)=>a.y<b.y?a:b);
        const by=Math.max(AM, hp.y+Math.floor(hp.h/2)-beamH/2);
        S.zones.push(makeZone({x:AM,y:by,w:IW,h:beamH,color:'#cc44ff',warnDur:WARN,activeDur:ACT,startTick:S.atkTimer+10}));
      }
      S.splitXbeamCount++;
    }

    // (platform collision handled before gravity above)
  }

  // Hit detection heart 2 (shockwaves hit both)
  if(S.p2HitFlash>0){S.p2HitFlash--;}
  else{
    const hit2=S.zones.some(z=>{
      if(!z.active)return false;
      return S.px2+6>z.x&&S.px2-6<z.x+z.w&&S.py2+6>z.y&&S.py2-6<z.y+z.h;
    });
    if(hit2&&S.p2HitFlash<=0){S.playerHP=Math.max(0,S.playerHP-2);S.p2HitFlash=30;updateHP();if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;setTimeout(loseGame,500);}}
  }

  // End after all 25 pairs spawned + platforms fall off + buffer
  // 25 pairs: last spawns at t=320+24*100=2720, platforms take ~(ARENA_H/0.8)≈250 frames to fall
  if(t>=3000){
    S.splitPhase=false;
    S.gravity=false;S.vy=0;S.vy2=0;
    S.splitPlats=[];
    S.splitXbeamCount=0;
    S.splitRotStart=0;
    elArena.style.transform='';
    S.zones=[];
    // Clear phase4_all attack state so the loop doesn't re-trigger platform mode
    S.attack=null; S.atkTimer=0; S.platStart=0; S.stompStart=-1; S.stompEnd=-1;
    elMenu.style.display='none';
    // → transition into quad survival phase
    beginQuadPhase();
  }
}
