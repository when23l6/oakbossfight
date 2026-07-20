// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 963-1101.
import { S } from '../state/gameState.js';
import { CS } from '../state/cutsceneState.js';
import { elArena, elMenu, elStats, elCsSkip } from '../core/canvasRefs.js';
import { csAdvance } from './engine.js';

export function phase3(){
  if(S.phase>=3) return;
  S.cs1items=S.items; // snapshot bandage count for cutscene 2 reference
  S.phase=3;
  S.gameOver=true;
  S.zones=[]; S.particles=[];
  elArena.style.display='none';
  elMenu.style.display='none';
  elStats.style.display='none';
  elCsSkip.style.display='block';

  CS.active=true;
  CS.idx=0;
  CS.animTick=0;
  CS.events={};
  S.phase=2; // keep ph2 visuals during cutscene

  // Fixed cutscene script (no longer branches on remaining bandage count)
  const _lines=[
    "The greed of the players.",
    "Has turned me into a monster.",
    "How much time you have spent for Oaks.",
    "How many days waiting for the whale.",
    "How many giveaways you had missed.",
    "All this greed.",
    "Has gathered you here.",
    "And I will stop you.",
    "I will stop you from going foward.",
    " ",
    "You will not get the points or the items.",
    "I won't just stop you, you miserable creature —",
    "I will stop you from ever thinking you had a chance for getting an oak.",
    "...",
  ];
  const _poses=[
    'idle','idle','idle','idle','idle','idle','idle',
    'rage','rage','rage','rage','rage','rage','rage',
  ];
  const _speakers=[
    'professor','professor','professor','professor','professor','professor','professor','professor','professor',
    'narrator',
    'professor','professor','professor',
    'narrator',
  ];
  CS.lines=_lines;
  CS.poses=_poses;
  CS.speakers=_speakers;
  csAdvance();
}
