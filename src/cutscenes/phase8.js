// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 914-961
// (function phase8() through the end of function csEnd8()).
import { S } from '../state/gameState.js';
import { CS } from '../state/cutsceneState.js';
import { say, updateHP, buildSub, highlightMain } from '../ui/menu.js';
import { csAdvance, endCutscene } from './engine.js';
import { elArena, elMenu, elStats, elCsSkip, elBossBg } from '../core/canvasRefs.js';

export function phase8(){
  if(S.phase>=8) return;
  S.phase=8;
  // HP stays at 1 — no heal
  S.gameOver=true;
  S.zones=[]; S.particles=[];
  elArena.style.display='none';
  elMenu.style.display='none';
  elStats.style.display='none';
  elCsSkip.style.display='block';
  elBossBg.style.background='radial-gradient(ellipse at 50% 90%, #0a0010 0%, #000 55%)';

  CS.active=true;
  CS.idx=0;
  CS.animTick=0;
  CS.onEnd=csEnd8;
  CS.events={
    2: ()=>{ S.bossBloodDrip=true; },
    4: ()=>{ S.bossOld=true; },
    6: ()=>{ S.bossHorror=true; document.getElementById('battle-box').classList.add('phase8-horror'); },
  };
  CS.lines=[
    'Not even the mind control?',
    'The durability issue got me...',
    '*He coughs up blood.*',
    'This could be fantastic experimental data.',
    '*He shrinks. The mass leaves him all at once.*',
    "It's only been 8 minutes. Though I know you felt much longer.",
    "Let's not waste the last 2 minutes.",
    'And have some fun.',
  ];
  CS.poses=[
    'idle','idle','idle','idle',
    'old','old','horror','horror',
  ];
  CS.speakers=[
    'professor','professor','narrator','professor',
    'narrator','professor','professor','professor',
  ];
  csAdvance();
}

export function csEnd8(){
  endCutscene();
  S.turn='player';
  S.actionLocked=false;
  say('What will you do?');
  highlightMain(); buildSub('FIGHT');
}
