// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 3420-3497.
// Logic only (begin/update). Like corBlocks, this attack has NO dedicated
// rendering block of its own — it is drawn generically by the shared zone
// engine (src/boss/render/zoneEngine.js).
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { makeZone, updateZones } from '../zones.js';
import { say, updateHP } from '../../ui/menu.js';
import { elMenu, elArena } from '../../core/canvasRefs.js';
import { loseGame } from '../../ui/overlay.js';
import { beginBlindchase } from './blindchase.js';

// ── CORRIDOR SWIPE + STOMP with spinning arena ──
export function beginCorStompSwipe(){
  if(S.corSSPhase) return;
  S.corSSPhase=true;
  S.corSSTimer=0;
  S.corSSRotation=0;
  S.zones=[];
  S.gravity=false; S.vy=0;

  const IW2=ARENA_W-AM*2, IH2=ARENA_H-AM*2;
  const WARN=50, ACT=35;
  const w70=Math.floor(IW2*0.70), sideW=Math.floor(IW2*0.20);

  // Swipe pattern (1 round)
  const swipes=[
    {x:AM,                        w:w70,   t:0},
    {x:AM+IW2-w70,               w:w70,   t:75},
    {x:AM+Math.floor(IW2*0.15),  w:w70,   t:150},
    {x:AM,                        w:sideW, t:230},
    {x:AM+IW2-sideW,             w:sideW, t:230},
  ];
  swipes.forEach(s=>S.zones.push(makeZone({x:s.x,y:AM,w:s.w,h:IH2,color:'#ff3300',warnDur:WARN,activeDur:ACT,startTick:s.t})));

  // Stomp waves interleaved throughout
  for(let i=0;i<6;i++) S.zones.push(makeZone({type:'wave_lr',startTick:i*55,color:'#2255ff',x:ARENA_W-AM,y:0,w:20,h:0}));

  S._corSSDur=380;
  S.stompStart=0; S.stompEnd=650; // gravity active whole time
  S.gravity=true; S.vy=0;
  say('...');
  elMenu.style.display='none';
}

export function updateCorStompSwipe(){
  if(!S.corSSPhase) return;
  S.corSSTimer++;

  // Spin arena continuously
  S.corSSRotation=(S.corSSRotation+1.2)%360;

  // Gravity + left/right movement
  S.vy+=0.28;
  const onGround=S.py>=ARENA_H-AM-9;
  if(!S.gameOver){
    if((S.keys['ArrowUp']||S.keys['w']||S.keys[' ']||S.keys['Enter'])&&onGround) S.vy=-5.5;
    if(S.keys['ArrowLeft']||S.keys['a'])  S.px=Math.max(AM+9,S.px-3.5);
    if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(ARENA_W-AM-9,S.px+3.5);
  }
  S.py=Math.min(ARENA_H-AM-9,S.py+S.vy);
  if(S.py>=ARENA_H-AM-9) S.vy=0;

  // Drive zone timer
  S.atkTimer=S.corSSTimer;
  updateZones();

  // Collision
  const hit=S.zones.some(z=>{
    if(!z.active) return false;
    if(z.type==='wave_lr') return S.px+6>z.x&&S.px-6<z.x+z.w&&S.py+6>z.y&&S.py-6<z.y+z.h;
    return S.px+6>z.x&&S.px-6<z.x+z.w&&S.py+6>z.y&&S.py-6<z.y+z.h;
  });
  if(hit&&S.pHitFlash<=0&&S.pSilentFlash<=0){
    S.playerHP=Math.max(0,S.playerHP-1); S.pHitFlash=30; updateHP();
    if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.corSSPhase=false;setTimeout(loseGame,500);}
  }

  if(S.corSSTimer>=S._corSSDur){
    S.corSSPhase=false;
    S.zones=[];
    S.gravity=false; S.vy=0;
    S.corSSRotation=0;
    elArena.style.transform='';
    // Start blindchase → compulsion sequence
    S.corBCPullPhase=true;
    S.px=ARENA_W/2; S.py=ARENA_H/2;
    beginBlindchase();
  }
}
