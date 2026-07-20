import { S } from '../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../state/constants.js';
import { makeZone, scheduleSlashRotateZones } from './zones.js';

// Legacy pattern-based zone scheduling: memory_line, blocks, slash_rotate,
// phase4_all, line_360, spinner+zigzag. No-ops if atk doesn't match one of
// these types (mirrors original if/else-if chain — atk is a single string so
// only one branch across scheduleLegacyA/scheduleLegacyB/scheduleZones ever fires).
export function scheduleLegacyB(atk, ph2, ph3, ph4, IW, IH){
  if(atk==='memory_line'){
    // 5 beams: show for 1 sec (60f) → invisible gap 2 sec (120f) → deal dmg (25f)
    // 2 rounds: 1 vertical round, 1 horizontal round
    const beamW=28, beamH=28;
    const SHOW=30, GAP=30, ACT=25;
    const rounds=4;
    for(let r=0;r<rounds;r++){
      const isY=r<2; // rounds 0&1: vertical, rounds 2&3: horizontal
      const delay=r*(SHOW+GAP+ACT+30);
      const margin=20;
      for(let i=0;i<5;i++){
        if(isY){
          const bx=AM+margin+Math.floor(Math.random()*(IW-margin*2-beamW));
          S.zones.push(makeZone({x:bx,y:AM,w:beamW,h:IH,color:'#ffaa00',warnDur:SHOW,gapDur:GAP,activeDur:ACT,startTick:delay,memoryBeam:true,inGap:false}));
        } else {
          const by2=AM+margin+Math.floor(Math.random()*(IH-margin*2-beamH));
          S.zones.push(makeZone({x:AM,y:by2,w:IW,h:beamH,color:'#ffcc00',warnDur:SHOW,gapDur:GAP,activeDur:ACT,startTick:delay,memoryBeam:true,inGap:false}));
        }
      }
    }

  } else if(atk==='blocks'){
    // Block moves through corners. Max 2 blocks visible at a time (when 3rd appears, 1st disappears).
    // Faster timing.
    const IW2=ARENA_W-AM*2, IH2=ARENA_H-AM*2;
    const bw=Math.floor(IW2/2), bh=Math.floor(IH2/2);
    const corners=[
      [AM,       AM],
      [AM+bw,    AM],
      [AM+bw,    AM+bh],
      [AM,       AM+bh],
    ];
    const startCorner=Math.floor(Math.random()*4);
    const cw=Math.random()<0.5;
    const WARN=22, ACT=28, GAP=5;
    const step2=WARN+ACT+GAP;
    // 5 moves (loops past start). Each block lives for 2 steps then expires.
    for(let i=0;i<5;i++){
      const ci=cw?(startCorner+i)%4:(startCorner-i+4)%4;
      const [cx2,cy2]=corners[ci];
      S.zones.push(makeZone({x:cx2,y:cy2,w:bw,h:bh,color:'#ff4400',warnDur:WARN,activeDur:ACT+step2,startTick:i*step2,blockIdx:i})); // 2 blocks max on screen
    }
  } else if(atk==='slash_rotate'){
    // Slash at 1.2x speed + arena rotates 360 during attack
    scheduleSlashRotateZones(0,'#cc44ff',null);
    // S.arenaRotating is set in bossAttack — total frames for full rotation computed from atkDur

  } else if(atk==='phase4_all'){
    // Five sub-attacks in fixed order, each waits for previous + 60f (1 sec) gap
    const IW2=ARENA_W-AM*2, IH2=ARENA_H-AM*2;
    const GAP=60;
    let cursor=0;
    function subEndIdx(si){
      let mx=0;
      for(let i=si;i<S.zones.length;i++){
        const z=S.zones[i];
        const e=(z.startTick||0)+(z.warnDur||0)+(z.gapDur||0)+(z.activeDur||60)+(z.passThruDur||0);
        if(e>mx) mx=e;
      }
      return mx;
    }

    // ── 1. BARRAGE 1.2x SPEED ──
    {
      const T0=cursor, si=S.zones.length;
      // 1.2x speed: interval=16 (was ~19 for ph2), warn=18, act=12
      const interval=16, count=12, beamW2=18;
      const warnD=18, actD=12;
      for(let i=0;i<count;i++){
        const t=T0+i*interval;
        const edge=Math.floor(Math.random()*4);
        let x,y,w,h;
        if(edge<2){x=AM+Math.random()*(IW2-beamW2);y=AM;w=beamW2;h=IH2;}
        else{x=AM;y=AM+Math.random()*(IH2-beamW2);w=IW2;h=beamW2;}
        S.zones.push(makeZone({x,y,w,h,color:'#ff6600',warnDur:warnD,activeDur:actD,startTick:t}));
        // second tracked beam
        const txC=Math.max(AM,Math.min(ARENA_W-AM-beamW2,S.px-beamW2/2));
        S.zones.push(makeZone({x:txC,y:AM,w:beamW2,h:IH2,color:'#ff3300',warnDur:warnD+5,activeDur:actD,startTick:t,tracked:true}));
      }
      cursor=subEndIdx(si)+GAP;
    }

    // ── 2. SWIPE (ph3) + STOMP (ph1) ──
    {
      const T0=cursor, si=S.zones.length;
      const WARN=50,ACT=35,w70=Math.floor(IW2*0.70),sideW=Math.floor(IW2*0.20);
      [{x:AM,w:w70,t:0},{x:AM+IW2-w70,w:w70,t:75},{x:AM+Math.floor(IW2*0.15),w:w70,t:150},{x:AM,w:sideW,t:230},{x:AM+IW2-sideW,w:sideW,t:230}]
        .forEach(s=>S.zones.push(makeZone({x:s.x,y:AM,w:s.w,h:IH2,color:'#ff3300',warnDur:WARN,activeDur:ACT,startTick:T0+s.t})));
      for(let i=0;i<5;i++) S.zones.push(makeZone({type:'wave_lr',startTick:T0+i*40,color:'#2255ff',x:ARENA_W-AM,y:0,w:20,h:0}));
      const end=subEndIdx(si);
      S.stompStart=T0; S.stompEnd=end; // gravity window
      cursor=end+GAP;
    }

    // ── 3. BLOCKS + CIRCLE ──
    {
      const T0=cursor, si=S.zones.length;
      const bw=Math.floor(IW2/2),bh=Math.floor(IH2/2);
      const corners=[[AM,AM],[AM+bw,AM],[AM+bw,AM+bh],[AM,AM+bh]];
      const sc=Math.floor(Math.random()*4),cw=Math.random()<0.5;
      const BWARN=22,BACT=28,BGAP=5,bstep=BWARN+BACT+BGAP;
      for(let i=0;i<5;i++){const ci=cw?(sc+i)%4:(sc-i+4)%4;const[cx2,cy2]=corners[ci];S.zones.push(makeZone({x:cx2,y:cy2,w:bw,h:bh,color:'#ff4400',warnDur:BWARN,activeDur:BACT+bstep,startTick:T0+i*bstep,blockIdx:i}));}
      const margin=30,passT=15;
      for(let i=0;i<4;i++){const cx=AM+margin+Math.random()*(ARENA_W-AM*2-margin*2);const cy=AM+margin+Math.random()*(ARENA_H-AM*2-margin*2);S.zones.push(makeZone({type:'circle_expand',cx,cy,startTick:T0+i*75,warnDur:45,activeDur:60,passThruDur:passT,fullBox:true,color:'#ff2200',passThru:false,r:0,thickness:8}));}
      cursor=subEndIdx(si)+GAP;
    }


    // ── 4. SLASH ROTATE (arena spins 360) ──
    {
      const T0=cursor, si=S.zones.length;
      scheduleSlashRotateZones(T0,'#ff44cc',{rotLayer:true});
      S.rotStart=T0; S.rotEnd=subEndIdx(si);
      S.arenaRotating=true;
    }

    // ── 5. PLATFORM JUMP (handled separately, starts after slash rotate) ──
    // platStart is set so the game loop knows when to begin platform mode
    S.platStart=subEndIdx(0)+GAP; // starts after everything else + 1 sec gap
  }

  // ── LINE 360 ──
  // Straight beams fired from center at the player's current angle + spread
  // Each beam covers the full arena diagonally
  if(atk==='line_360'){
    const count=15;
    const WARN=30, ACT=18, GAP=12;
    const IW=ARENA_W-AM*2, IH=ARENA_H-AM*2;
    const half=Math.floor(count/2); // first 7 single, rest in pairs
    let cursor=0;
    for(let i=0;i<count;i++){
      const isSecondHalf=i>=half;
      // For second half, fire 2 beams at the same startTick (paired every 2 shots)
      const tick=isSecondHalf
        ? Math.floor((i-half)/2)*(WARN+ACT+GAP) + half*(WARN+ACT+GAP) + cursor
        : i*(WARN+ACT+GAP);

      const edge=Math.floor(Math.random()*4);
      let ox,oy;
      if(edge===0){ ox=AM+Math.random()*IW; oy=AM; }
      else if(edge===1){ ox=AM+Math.random()*IW; oy=ARENA_H-AM; }
      else if(edge===2){ ox=AM; oy=AM+Math.random()*IH; }
      else             { ox=ARENA_W-AM; oy=AM+Math.random()*IH; }

      S.zones.push(makeZone({type:'line_360', cx:ox, cy:oy, angle:0, warnDur:WARN, activeDur:ACT, startTick:tick, color:'#ff0088', thickness:16, trackPlayer:true}));
    }
  }

  // ── SPINNER + ZIGZAG (combined) ──
  if(atk==='spinner'||atk==='zigzag'){
    // Spinner: 3 sweeps
    const speeds=[0.018, 0.045];
    let cursor=0;
    for(let s=0;s<2;s++){
      const dur=Math.ceil((Math.PI*2)/speeds[s]);
      S.zones.push(makeZone({type:'spinner', cx:ARENA_W/2, cy:ARENA_H/2, angle:0, speed:speeds[s], armLen:Math.sqrt((ARENA_W/2)**2+(ARENA_H/2)**2)+10, thickness:10, startTick:cursor+20, activeDur:dur, warnDur:20, color:'#ff4400'}));
      cursor+=dur+40;
    }
    // Zigzag balls: spawn throughout the attack
    const count=10;
    const ballR=8;
    for(let i=0;i<count;i++){
      S.zones.push(makeZone({type:'zigzag', bx:AM+ballR+Math.random()*(ARENA_W-AM*2-ballR*2), by:AM-ballR, bvx:(Math.random()<0.5?1:-1)*(1.5+Math.random()*1.5), bvy:0.8+Math.random()*0.8, ballR, startTick:i*35, color:'#ffcc00', warnDur:0, activeDur:9999}));
    }
  }
}
