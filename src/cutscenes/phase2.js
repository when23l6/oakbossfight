// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 679-683.
import { S } from '../state/gameState.js';
import { D } from '../state/dialogue.js';
import { say } from '../ui/menu.js';
import { elBossBg } from '../core/canvasRefs.js';

export function phase2(){
  S.phase=2;
  elBossBg.style.background='radial-gradient(ellipse at 50% 85%, #2a0000 0%, #000 68%)';
  say(D.phase2[0]);
}
