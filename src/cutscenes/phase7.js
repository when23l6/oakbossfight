// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 871-912
// (function phase7() through the end of function csEnd7()).
import { S } from '../state/gameState.js';
import { CS } from '../state/cutsceneState.js';
import { say, updateHP, buildSub, highlightMain } from '../ui/menu.js';
import { csAdvance, endCutscene } from './engine.js';
import { elArena, elMenu, elStats, elCsSkip, elBossBg } from '../core/canvasRefs.js';

export function phase7(){
  if(S.phase>=7) return;
  S.phase=7;
  S.bossHP=25;
  S.bossHitFlash=18;
  updateHP();
  S.gameOver=true;
  S.zones=[]; S.particles=[];
  elArena.style.display='none';
  elMenu.style.display='none';
  elStats.style.display='none';
  elCsSkip.style.display='block';
  elBossBg.style.background='radial-gradient(ellipse at 50% 95%, #001a33 0%, #000 55%)';

  CS.active=true;
  CS.idx=0;
  CS.animTick=0;
  CS.onEnd=csEnd7;
  CS.events={
    2: ()=>{ S.bossCoilOpen=true; } // torso opens on line 2
  };
  CS.lines=[
    "I've never said all I made was making people buffed.",
    "Impressive you forced me to use this.",
    "*He opens his torso. A antenna hums inside.*",
    "A mini antenna. Cool, isn't it.",
    "Not everyone can see this in their entire life.",
    "Let's not waste too much time.",
  ];
  CS.poses=['idle','idle','holding','holding','idle','fists_up'];
  CS.speakers=['professor','professor','narrator','professor','professor','professor'];
  csAdvance();
}

export function csEnd7(){
  endCutscene();
  S.playerHP=S.playerMax;
  updateHP();
  S.turn='player';
  S.actionLocked=false;
  say('What will you do?');
  highlightMain(); buildSub('FIGHT');
}
