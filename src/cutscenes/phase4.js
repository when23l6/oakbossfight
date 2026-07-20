// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 1103-1110.
import { S } from '../state/gameState.js';
import { updateHP, say } from '../ui/menu.js';
import { bossAttack } from '../boss/ai.js';

export function phase4(){
  if(S.phase>=4) return;
  S.phase=4;
  S.playerHP=S.playerMax;
  updateHP();
  say('Something shifts. The air cracks.');
  bossAttack();
}
