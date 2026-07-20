// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 832-869
// (function phase6() through the end of function csEnd6()).
import { S } from '../state/gameState.js';
import { CS } from '../state/cutsceneState.js';
import { say, updateHP, buildSub, highlightMain } from '../ui/menu.js';
import { csAdvance, endCutscene } from './engine.js';
import { elArena, elMenu, elStats, elCsSkip, elBossBg } from '../core/canvasRefs.js';

export function phase6(){
  if(S.phase>=6) return;
  S.phase=6;
  S.bossHP=50;
  S.bossHitFlash=18;
  updateHP();
  S.gameOver=true;
  S.zones=[]; S.particles=[];
  elArena.style.display='none';
  elMenu.style.display='none';
  elStats.style.display='none';
  elCsSkip.style.display='block';
  elBossBg.style.background='radial-gradient(ellipse at 50% 95%, #110022 0%, #000 60%)';

  CS.active=true;
  CS.idx=0;
  CS.animTick=0;
  CS.onEnd=csEnd6;
  CS.events={
    1: ()=>{ S.bossBandaged=true; } // skin switches to phase 6 when gun comes out
  };
  CS.lines=[
    'I guess guns are better.',
    '*He reaches behind him and draws the rifle.*',
  ];
  CS.poses=['idle','holding'];
  CS.speakers=['professor','narrator'];
  csAdvance();
}

export function csEnd6(){
  endCutscene();
  S.playerHP=S.playerMax;
  updateHP();
  S.turn='player';
  S.actionLocked=false;
  say('What will you do?');
  highlightMain(); buildSub('FIGHT');
}
