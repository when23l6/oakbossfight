import { S } from '../state/gameState.js';
import { D } from '../state/dialogue.js';
import { say, pick, clearSub, updateHP } from '../ui/menu.js';
import { elBossMad } from '../core/canvasRefs.js';
import { ARENA_W, ARENA_H, AM } from '../state/constants.js';
import { bossAttack } from '../boss/ai.js';
import { makeZone } from '../boss/zones.js';
import { isInputBlocked } from '../ui/inputBlock.js';

export function doAct(type){
  if(S.turn!=='player'||S.gameOver||S.actionLocked||isInputBlocked()) return;
  if(S.phase>=9){ say('This is the moment.'); S.actionLocked=false; return; }
  S.actionLocked=true;
  clearSub();
  if(type==='run'){
    S.runCount++;
    const n=S.runCount;
    if(n===1) say("You run away. It's a locked room.");
    else if(n===2) say("He watches you, and sighs.");
    else if(n===3) say("He feels embarrassed for you.");
    else if(n===4) say("If you got a plan, make sure you do it now.");
    else {
      // 5th+ : straight-line blitz attack, 10x speed, 1000 bullets
      say("Even the boss can't endure the embarrassment.");
      S.runCount=0;
      bossAttack(); // trigger immediately so the attack fires
      // Schedule a special blitz zone flood
      setTimeout(()=>{
        S.zones=[];
        const IW=ARENA_W-AM*2, IH=ARENA_H-AM*2;
        for(let i=0;i<1000;i++){
          const row=Math.floor(i/20);
          const col=i%20;
          S.zones.push(makeZone({
            x:AM+col*(IW/20), y:AM,
            w:Math.floor(IW/20), h:IH,
            color:'#ff0000',
            warnDur:2, activeDur:3,
            startTick:S.atkTimer+row*2,
          }));
        }
        S.atkDur=S.atkTimer+200*2+60;
        // one shot: if player is hit, instantly kill
        S._runBlitz=true;
      },200);
      return;
    }
    bossAttack();
    return;
  }

  if(type==='taunt'){
    S.tauntCount++;
    const n=S.tauntCount;
    const p=S.phase;
    let msg=null;

    if(n===1) msg="He doesn't care.";
    else if(n===2) msg="He still doesn't care.";
    // n=3/5/8/11 have no line of their own — they're pure pacing filler
    // between the phase-gated real lines. If the player is already past
    // the NEXT real line's phase requirement (e.g. taunted rarely but
    // fought a lot in between), show that line early instead of wasting
    // the press on filler they've already earned past.
    else if(n===3){ if(p>=2) msg="He sighs."; else msg="Try doing it later."; }
    else if(n===4){ if(p>=2) msg="He sighs."; else msg="Try doing it later."; }
    else if(n===5){ if(p>=3) msg="He doesn't know how to react."; else msg="Try doing it later."; }
    else if(n===6){ if(p>=3) msg="He doesn't know how to react."; else msg="Try doing it later."; }
    else if(n===7){ if(p>=3) msg="Even the narrator knows this won't work."; else msg="Try doing it later."; }
    else if(n===8){ if(p>=4) msg="You clearly need a doctor."; else msg="Try doing it later."; }
    else if(n===9){ if(p>=4) msg="You clearly need a doctor."; else msg="Try doing it later."; }
    else if(n===10){ if(p>=4) msg="I guess the boss is mad?"; else msg="Try doing it later."; }
    else if(n===11){ if(p>=5) msg="You've beaten a hard part, but this strat clearly doesn't work."; else msg="Try doing it later."; }
    else if(n===12){ if(p>=5) msg="You've beaten a hard part, but this strat clearly doesn't work."; else msg="Try doing it later."; }
    else if(n===13){ if(p>=5) msg="Don't even try again later."; else msg="Try doing it later."; }
    else if(n===14){ if(p>=6) msg="I guess your dream is to be a ragebaiter."; else msg="Try doing it later."; }
    else if(n===15){ if(p>=6) msg="This clearly doesn't work."; else msg="Try doing it later."; }
    else if(n===16){ if(p>=6) msg="Stop trying."; else msg="Try doing it later."; }
    else if(n===17){ if(p>=6) msg="I won't even narrate this for you."; else msg="Try doing it later."; }
    else if(n===18){ if(p>=6) msg="..."; else msg="Try doing it later."; }
    else if(n===19){ if(p>=6) msg="Stop trying..."; else msg="Try doing it later."; }
    else if(n===20){ if(p>=7) msg="Why?"; else msg="Try doing it later."; }
    else if(n===21){ if(p>=7) msg="There is no secret ending for this."; else msg="Try doing it later."; }
    else if(n===22){ if(p>=7) msg="Nor a secret prize."; else msg="Try doing it later."; }
    else if(n===23){ if(p>=7) msg="We did an IQ test before letting you in."; else msg="Try doing it later."; }
    else if(n===24){ if(p>=7) msg="Why?"; else msg="Try doing it later."; }
    else if(n===25){
      if(p>=7){
        msg="Finally, the boss is mad. Congrats.";
        elBossMad.style.display='block';
        S.playerMax=10;
        S.playerHP=Math.min(S.playerHP,10);
        S._madMode=true;
        updateHP();
      } else msg="Try doing it later.";
    }
    else { if(p>=7) msg="Nothing more..."; else msg="Try doing it later."; }

    say(msg);
    setTimeout(()=>{ bossAttack(); }, 1000);
    return;
  }

  if(type==='compliment'){
    S.flattered++;
    say(pick(D.compliment));
    bossAttack();
  }
}
