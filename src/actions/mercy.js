import { S } from '../state/gameState.js';
import { say } from '../ui/menu.js';
import { bossAttack } from '../boss/ai.js';
import { isInputBlocked } from '../ui/inputBlock.js';

export function doMercy(){
  if(S.turn!=='player'||S.gameOver||S.actionLocked||isInputBlocked()) return;
  if(S.phase>=9){ say('This is the moment.'); S.actionLocked=false; return; }
  S.actionLocked=true;
  say("He doesn't acknowledge the gesture.");
  bossAttack();
}
