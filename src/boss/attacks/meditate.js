// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 4175-4424
// (── MEDITATE PHASE ── header comment through the end of function
// updateMeditate()). Logic only. NOTE: this does not include the separate
// standalone `drawPreMeditate` render function, which lives elsewhere
// (boss/preMeditate.js render module).
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { makeZone } from '../zones.js';
import { say, updateHP, highlightMain, buildSub } from '../../ui/menu.js';
import { loseGame } from '../../ui/overlay.js';
import { elMenu, elArena, elStats } from '../../core/canvasRefs.js';

// ── MEDITATE PHASE ──────────────────────────────────────────────────────
// After frenzy quad kills player. Black screen, "Meditate" text.
// Player spams z/space/enter/click to heal. Must press 1.5–2/sec to survive.
// Drain: 0.058 HP/frame. Heal per press: 2 HP. Net at 1.75/sec ≈ 0.
// Background visuals (beams, rico, grenades) drawn but deal 0 dmg.
// Survive 15 sec → boss gets tired → softlock. Die → normal death.

export const MED_HEAL           = 1;     // HP per press (keep small, drain scales)
export const MED_DURATION       = 900;   // 15 sec
export const MED_PRESS_COOLDOWN = 8;  // blocks OS key-repeat and double-fires

// Drain scales linearly: 2 presses/sec at start → 12 presses/sec at end
// drain_per_frame = presses_needed_per_sec * MED_HEAL / 60

// Shared by every input path that can heal during meditate — the document
// click handler, the Z/Space/Enter keydown handler, and the D-pad's touch
// handler (all in core/input.js / ui/touchControls.js) — so the actual
// heal/flash/hint-flash effect only needs to be defined once.
export function meditateHeal(){
  S.meditateHP=Math.min(20, S.meditateHP+MED_HEAL);
  S.meditateFlash=8;
  const hint=document.getElementById('meditate-hint');
  if(hint){ hint.classList.remove('meditate-hint-flash'); void hint.offsetWidth; hint.classList.add('meditate-hint-flash'); }
}

export function beginMeditate(){
  // ── Pre-meditate intro: darken screen, show MEDITATE text, 3 button presses ──
  S.preMeditatePhase=true;
  S.preMeditateTimer=0;
  S.preMeditatePresses=0;
  S.preMeditateShineTimer=0;
  S.preMeditateKeyHeld=false;
  S._meditateUsed=true;
  S._quadFrenzy=false;
  S.quadPhase=false; S.quadSlabs=[];
  S.gravity=false; S.vy=0;
  S.zones=[];
  S.gameOver=true; // freeze normal loop actions
  elMenu.style.display='none';
  elArena.style.display='none';
  elStats.style.display='none';
  document.getElementById('meditate-text').style.display='none';
  say('...');
}

export function _startMeditateForReal(){
  S.preMeditatePhase=false;
  S.meditatePhase=true;
  S.meditateTimer=0;
  S.meditateHP=20;
  S.meditatePressCooldown=0;
  S._medKeyHeld={};
  S.meditateRicBullets=[];
  S.meditateGrenades=[];
  S.meditateBeamTimer=0;
  S.meditateSpinners=[];
  S.meditateZigzags=[];
  S.gravity=false; S.vy=0;
  S.zones=[];
  S.playerHP=20;
  updateHP();
  S.gameOver=false;
  elMenu.style.display='none';
  elArena.style.display='';
  elStats.style.display='';
  document.getElementById('meditate-text').style.display='block';
  document.getElementById('dialogue').textContent='';
  // Start frenzy quad at higher round so it's already fast
  if(S._quadFrenzy) S._quadFrenzyRound=Math.max(S._quadFrenzyRound, 10);
}

export function updatePreMeditate(){
  if(!S.preMeditatePhase) return;
  S.preMeditateTimer++;
  if(S.preMeditateShineTimer>0) S.preMeditateShineTimer--;

  // Detect any key/click press for the 3-press mechanic (after fade-in)
  if(S.preMeditateTimer > 60){
    const anyKey = Object.values(S.keys).some(v=>v);
    if(anyKey && !S.preMeditateKeyHeld){
      S.preMeditateKeyHeld=true;
      S.preMeditatePresses++;
      S.preMeditateShineTimer=30;
      if(S.preMeditatePresses>=3){
        // Brief pause then enter real meditate
        setTimeout(_startMeditateForReal, 500);
        S.preMeditatePhase=false;
      }
    }
    if(!Object.values(S.keys).some(v=>v)) S.preMeditateKeyHeld=false;
  }
}

export function updateMeditate(){
  if(!S.meditatePhase) return;
  S.meditateTimer++;
  const t=S.meditateTimer;

  // Drain scales from 2 presses/sec (start) to 12 presses/sec (end)
  const pressRate = 2 + (36-2)*(t/MED_DURATION); // 2→36 over 15 sec
  const drain = pressRate * MED_HEAL / 60;
  S.meditateHP=Math.max(0, S.meditateHP-drain);
  document.getElementById('player-hp-bar').style.width=(S.meditateHP/20*100)+'%';
  document.getElementById('hp-text').textContent=(S.meditateHP<=5?S.meditateHP.toFixed(1):Math.ceil(S.meditateHP))+'/20';

  // Cooldown tick
  if(S.meditatePressCooldown>0) S.meditatePressCooldown--;
  if(S.meditateFlash>0) S.meditateFlash--;

  // Die
  if(S.meditateHP<=0){
    S.meditatePhase=false;
    document.getElementById('meditate-text').style.display='none';
    S.playerHP=0; S.gameOver=true;
    setTimeout(loseGame,500);
    return;
  }

  // Succeed after 15 sec — player gets to attack
  if(t>=MED_DURATION){
    S.meditatePhase=false;
    S.meditateSpinners=[];
    S.meditateZigzags=[];
    S.zones=[];
    document.getElementById('meditate-text').style.display='none';
    S.playerHP=Math.max(1,Math.round(S.meditateHP));
    updateHP();
    // Give player their turn to attack
    S.phase=9;
    S.turn='player';
    S.actionLocked=false;
    S.gameOver=false;
    elArena.style.display='';
    elStats.style.display='';
    elMenu.style.display='';
    say('Now.');
    S.inSub=false; S.subIdx=0; highlightMain(); buildSub('FIGHT');
    return;
  }

  // ── Background attacks — escalate over time ──
  // progress: 0 at start → 1 at 15 sec
  const prog=Math.min(1, t/MED_DURATION);

  S.meditateBeamTimer++;
  // Beam interval: 60f at start → 20f at end
  const beamInterval=Math.round(60-40*prog);
  if(S.meditateBeamTimer%beamInterval===1){
    const IW=ARENA_W-AM*2, IH=ARENA_H-AM*2;
    // Warn/active duration shortens over time
    const warnDur=Math.round(30-10*prog);
    const actDur=Math.round(30-10*prog);
    S.zones.push(makeZone({x:AM+10+Math.floor(Math.random()*(IW-50)),y:AM,w:30,h:IH,color:'#ff2244',warnDur,activeDur:actDur,startTick:S.atkTimer}));
    S.zones.push(makeZone({x:AM,y:AM+10+Math.floor(Math.random()*(IH-40)),w:IW,h:20,color:'#ff8800',warnDur,activeDur:actDur,startTick:S.atkTimer+5}));
    S.zones.push(makeZone({x:AM+10+Math.floor(Math.random()*(IW-50)),y:AM,w:20,h:IH,color:'#aa44ff',warnDur:Math.round(25-8*prog),activeDur:Math.round(25-8*prog),startTick:S.atkTimer+10}));
    // Extra beams in second half
    if(prog>0.5){
      S.zones.push(makeZone({x:AM+10+Math.floor(Math.random()*(IW-50)),y:AM,w:25,h:IH,color:'#ff2244',warnDur,activeDur:actDur,startTick:S.atkTimer+15}));
      S.zones.push(makeZone({x:AM,y:AM+10+Math.floor(Math.random()*(IH-40)),w:IW,h:18,color:'#ff8800',warnDur,activeDur:actDur,startTick:S.atkTimer+20}));
    }
  }

  // Rico bullets: count scales 3→6, speed scales 13.5→20
  const ricCount=Math.round(3+3*prog);
  const RICO_SPEED=13.5+6.5*prog;
  while(S.meditateRicBullets.length<ricCount){
    const sides=[[ARENA_W/2,AM+2],[ARENA_W/2,ARENA_H-AM-2],[AM+2,ARENA_H/2],[ARENA_W-AM-2,ARENA_H/2]];
    const [sx,sy]=sides[Math.floor(Math.random()*4)];
    const dx=S.px-sx, dy=S.py-sy, len=Math.sqrt(dx*dx+dy*dy)||1;
    S.meditateRicBullets.push({x:sx,y:sy,vx:(dx/len)*RICO_SPEED,vy:(dy/len)*RICO_SPEED,bounces:12,trail:[]});
  }
  for(let i=S.meditateRicBullets.length-1;i>=0;i--){
    const b=S.meditateRicBullets[i];
    b.x+=b.vx; b.y+=b.vy;
    b.trail.push({x:b.x,y:b.y}); if(b.trail.length>16) b.trail.shift();
    let hitX=false,hitY=false;
    if(b.x<=AM+5){b.x=AM+5;hitX=true;} else if(b.x>=ARENA_W-AM-5){b.x=ARENA_W-AM-5;hitX=true;}
    if(b.y<=AM+5){b.y=AM+5;hitY=true;} else if(b.y>=ARENA_H-AM-5){b.y=ARENA_H-AM-5;hitY=true;}
    if(hitX){b.vx=-b.vx;b.bounces--;b.trail=[];}
    if(hitY){b.vy=-b.vy;if(!hitX)b.bounces--;b.trail=[];}
    if(b.bounces<=0) S.meditateRicBullets.splice(i,1);
  }

  // Grenades: interval 90f→40f, count 3→6
  const grenInterval=Math.round(90-50*prog);
  const grenCount=Math.round(3+3*prog);
  if(t%grenInterval===1){
    for(let i=0;i<grenCount;i++){
      S.meditateGrenades.push({
        sx:AM+Math.random()*(ARENA_W-AM*2), sy:AM,
        lx:AM+Math.random()*(ARENA_W-AM*2), ly:ARENA_H-AM-20,
        timer:0, state:'arc',
      });
    }
  }
  // Arc/warn/blast durations shorten over time
  const arcDur=Math.round(47-15*prog);
  const warnEndDur=Math.round(60-15*prog);
  const blastEndDur=Math.round(70-15*prog);
  for(const g of S.meditateGrenades){
    g.timer++;
    if(g.state==='arc'&&g.timer>=arcDur) g.state='warn';
    if(g.state==='warn'&&g.timer>=warnEndDur) g.state='blast';
    if(g.state==='blast'&&g.timer>=blastEndDur) g.state='done';
  }
  S.meditateGrenades=S.meditateGrenades.filter(g=>g.state!=='done');

  // ── Spinners — fast rotating arms from center ──
  // Spawn 1 spinner at start, add more over time (max 3)
  const spinnerTarget=prog<0.4?1:prog<0.75?2:3;
  while(S.meditateSpinners.length<spinnerTarget){
    const offset=(S.meditateSpinners.length/3)*Math.PI*2;
    // Each spinner has a slightly different speed; they all get faster with prog
    S.meditateSpinners.push({
      angle: offset,
      baseSpeed: 0.06+S.meditateSpinners.length*0.025,
      armLen: Math.sqrt((ARENA_W/2)**2+(ARENA_H/2)**2)+10,
      thickness: 9,
    });
  }
  for(const sp of S.meditateSpinners){
    const speed=(sp.baseSpeed+0.05*prog)*(1+prog*0.6);
    sp.angle+=speed;
    // Draw as active zone directly — reuse the existing spinner draw path
    // We push a transient zone each frame (will be overwritten each tick)
    S.zones.push(makeZone({
      type:'spinner',
      cx:ARENA_W/2, cy:ARENA_H/2,
      angle:sp.angle,
      armLen:sp.armLen,
      thickness:sp.thickness,
      color:'#ff4400',
      warn:true, active:false, done:false,
      startTick:0, warnDur:99999, activeDur:0,
    }));
  }

  // ── Zigzag balls — lots of them, spawned over time ──
  // Count scales 6→20 over the duration
  const zigTarget=Math.round(6+14*prog);
  while(S.meditateZigzags.length<zigTarget){
    const bx=AM+5+Math.random()*(ARENA_W-AM*2-10);
    const speed=1.8+1.2*prog+Math.random()*1.2;
    S.meditateZigzags.push({
      x:bx, y:AM-8,
      vx:(Math.random()<0.5?1:-1)*(1.2+Math.random()*1.8),
      vy:speed,
      r:7,
      life:0,
    });
  }
  for(let i=S.meditateZigzags.length-1;i>=0;i--){
    const b=S.meditateZigzags[i];
    b.x+=b.vx; b.y+=b.vy;
    b.life++;
    // Bounce off side walls
    if(b.x<=AM+b.r){b.x=AM+b.r;b.vx=Math.abs(b.vx);}
    else if(b.x>=ARENA_W-AM-b.r){b.x=ARENA_W-AM-b.r;b.vx=-Math.abs(b.vx);}
    // Remove when off bottom
    if(b.y>ARENA_H+20) S.meditateZigzags.splice(i,1);
  }
}
