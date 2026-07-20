import { S } from '../state/gameState.js';
import { D } from '../state/dialogue.js';
import { CS } from '../state/cutsceneState.js';
import { say, updateHP, pick } from '../ui/menu.js';
import { elMenu, elArena, elStats, elCsSkip, elSpeaker } from '../core/canvasRefs.js';
import { winFight } from '../ui/overlay.js';
import { bossAttack } from '../boss/ai.js';
import { csAdvance } from '../cutscenes/engine.js';
import { phase2 } from '../cutscenes/phase2.js';
import { phase3 } from '../cutscenes/phase3.js';
import { phase4 } from '../cutscenes/phase4.js';
import { phase6 } from '../cutscenes/phase6.js';
import { phase7 } from '../cutscenes/phase7.js';
import { phase8 } from '../cutscenes/phase8.js';
import { beginSecurityScene } from '../minigames/securityScene.js';
import { isInputBlocked } from '../ui/inputBlock.js';

export function doFight(){
  if(S.turn!=='player'||S.gameOver||S.actionLocked||isInputBlocked()) return;
  S.actionLocked=true;
  if(S.phase===4){say('Your attacks do nothing. He doesn\'t even flinch.');bossAttack();return;}

  // Phase 9: final strike — boss drops to 0, enter ending cutscene
  if(S.phase>=9){
    S.bossHP=0;
    S.bossHitFlash=20;
    updateHP();
    S.gameOver=true;
    elMenu.style.display='none';
    elArena.style.display='none';
    elStats.style.display='none';
    elCsSkip.style.display='block';
    // This is the point of no return — the ending cutscene, security-cam
    // scene, and credits all run from here with no way back to gameplay.
    // Hide the SAVE button so it can't interrupt any of it (those scenes
    // run their own independent animation loops with no cancel path);
    // resetGame() re-shows it as a belt-and-suspenders check.
    document.getElementById('save-btn').style.display='none';

    setTimeout(()=>{
      CS.active=true;
      CS.idx=0;
      CS.animTick=0;
      CS.onEnd=()=>{
        S.bossDeadEyes=true;
        S.bossHorror=false;
        CS.active=false;
        elCsSkip.style.display='none';
        elSpeaker.style.display='none';
        say('...');
        // Wait for boss to fully fade (~3s), then show terminal
        setTimeout(beginSecurityScene, 3000);
      };
      CS.events={
        10: ()=>{ /* player line */ },
      };
      CS.lines=[
        'I... I lost...',
        'I gave it everything I had.',
        'Heh.',
        'Honestly... I\'m relieved.',
        'Relieved to see that you tried so hard instead of begging one.',
        'I still remember those days...',
        'Back when trading just released.',
        'When trading was fair and just for fun.',
        'I miss them.',
        'I trust you, you came here for the fun and not for the oak right?',
        '',
        'Yeah...',
        'I\'ll count that as a yes.',
        'People with greed only can\'t go this far.',
        'You deserve the rewards.',
        'Go on then.',
        'There are no more twists.',
        'You won',
        'You defeated me.',
        'But you better hurry.',
        'The greedy ones might be faster.',
        'Goodbye...',
      ];
      CS.poses=[
        'idle','idle','idle','idle','idle',
        'idle','idle','idle','idle','idle',
        'idle', // player line
        'idle','idle','idle',
        'idle','idle','idle','idle',
        'idle','idle','idle','idle',
      ];
      CS.speakers=[
        'professor','professor','professor','professor','professor',
        'professor','professor','professor','professor','professor',
        'player',
        'professor','professor','professor',
        'professor','professor','professor','professor',
        'professor','professor','professor','professor',
      ];
      csAdvance();
    }, 800);
    return;
  }

  // Phase 8: always launch boss attack (corridor etc.), no more cutscene
  if(S.phase>=8){
    say('...');
    S.bossHitFlash=12;
    bossAttack();
    return;
  }

  // Phase 7+
  if(S.phase>=7){
    // At 1 HP → phase 8, no damage, no heal
    if(S.bossHP<=1){
      say('...');
      S.bossHitFlash=12;
      phase8();
      return;
    }
    // At 5 HP or below → exactly 1 dmg, floor at 1
    let finalDmg;
    if(S.bossHP<=5){
      finalDmg=1;
    } else {
      // Above 5 HP → 75% deal 2, 25% deal 1, never drop below 1
      finalDmg=Math.random()<0.75?2:1;
      if(S.bossHP-finalDmg<1) finalDmg=S.bossHP-1;
    }
    S.bossHP=Math.max(1, S.bossHP-finalDmg);
    S.bossHitFlash=12;
    say(pick(D.fight)+'  ['+finalDmg+' DMG]'); updateHP();
    bossAttack();
    return;
  }

  const dmg=S.phase>=5?2+Math.floor(Math.random()*3):S.phase===2?2+Math.floor(Math.random()*3):3+Math.floor(Math.random()*4);
  const finalDmg=S.phase>=6?Math.max(1,Math.floor(dmg*0.5)):dmg;
  S.bossHP=Math.max(0,S.bossHP-finalDmg); S.bossHitFlash=12;
  say(pick(D.fight)+'  ['+finalDmg+' DMG]'); updateHP();
  if(S.bossHP<=0){setTimeout(winFight,600);return;}
  if(S.bossHP<250&&S.phase===1) phase2();
  if(S.bossHP<=200&&S.phase===2){phase3();return;}
  if(S.bossHP<=150&&S.phase===3){phase4();return;}
  if(S.bossHP<=50&&S.phase===5){phase6();return;}
  if(S.bossHP<=25&&S.phase===6){phase7();return;}
  bossAttack();
}
