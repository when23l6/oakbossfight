import { S } from '../state/gameState.js';
import { say } from '../ui/menu.js';
import { bossAttack } from '../boss/ai.js';

export function doCardMaker(){
  if(S.turn!=='player'||S.gameOver||S.actionLocked) return;
  if(S.phase>=9){ say('This is the moment.'); return; }
  S.actionLocked=true;
  say("You tried to turn Oak into a card, he blocks it.");
  // can't use it — just wastes the turn
  bossAttack();
}
