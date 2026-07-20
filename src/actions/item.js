import { S } from '../state/gameState.js';
import { say, updateHP, selectAction } from '../ui/menu.js';
import { bossAttack } from '../boss/ai.js';
import { isInputBlocked } from '../ui/inputBlock.js';

export function doItem(){
  if(S.turn!=='player'||S.gameOver||S.actionLocked||isInputBlocked()) return;
  if(S.phase>=9){ say('This is the moment.'); S.actionLocked=false; return; }
  S.actionLocked=true;
  if(S.phase>=5){
    S.playerHP=Math.min(S.playerMax,S.playerHP+5);
    say('You meditate. Recovered 5 HP.');updateHP();selectAction('ITEM');bossAttack();
  } else {
    if(S.items<=0){say("No items left!"); S.actionLocked=false; return;}
    S.items--;S.playerHP=Math.min(S.playerMax,S.playerHP+8);
    say('Used a Bandage. Recovered 8 HP.');updateHP();selectAction('ITEM');bossAttack();
  }
}
