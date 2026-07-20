// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 747-830
// (function phase5cs() through the end of function csEnd5()).
import { S } from '../state/gameState.js';
import { CS } from '../state/cutsceneState.js';
import { say, updateHP, buildSub, highlightMain } from '../ui/menu.js';
import { csAdvance, endCutscene } from './engine.js';
import { elArena, elMenu, elStats, elCsSkip, elBossBg } from '../core/canvasRefs.js';

export function phase5cs(){
  S.gameOver=true;
  S.zones=[]; S.particles=[];
  elArena.style.display='none';
  elMenu.style.display='none';
  elStats.style.display='none';
  elCsSkip.style.display='block';

  CS.active=true;
  CS.idx=0;
  CS.animTick=0;
  CS.onEnd=csEnd5;

  // Dynamic lines based on bandages player had when cs1 triggered (S.items)
  // Note: S.items is 0 if they used all, since meditate is now infinite but items
  // tracks original bandage count snapshot stored at cs1 trigger (S.cs1items)
  const _bi = (S.cs1items!==undefined) ? S.cs1items : S.items;
  let _l5, _p5, _s5, _healIdx;

  if(_bi===0){
    // Used all — boss got them from elsewhere, offers some to player
    _l5=[
      'As I thought, this is nothing more than a prototype.',
      'It clearly has some durability issues.',
      "Oh, that's right — I got some bandages back there.",
      'Hmm, not much. But enough.',
      'You need some?',
      '*He tosses a few over without waiting for an answer.*',
      'Might as well put them to use.',
      '...',
      'The fact that you made it this far...',
      'when must have played a part in it.',
      'He said this was a fun giveaway didnt he.',
      'He is a fraud.',
      'This is never a giveaway, you deserve the prize.',
      'Shall we continue?',
    ];
    _healIdx=6;
    _p5=['idle','idle','idle','idle','idle','holding','holding','idle','idle','idle','idle','idle','idle','fists_up'];
    _s5=['professor','professor','professor','professor','professor','narrator','professor','narrator','professor','professor','professor','professor','professor','professor'];
  } else {
    // 1-2 bandages: boss found them elsewhere; 3+: dropped from bag
    const bandageLine = _bi<=2
      ? "Oh, that's right — I got some bandages back there."
      : "Oh, that's right — some bandages dropped back there.";
    _l5=[
      'As I thought, this is nothing more than a prototype.',
      'It clearly has some durability issues.',
      bandageLine,
      'Hmm, not much. But enough.',
      '*He picks them up. Wraps his knuckles slowly, methodically.*',
      'Might as well put them to use.',
      '...',
      'The fact that you made it this far...',
      'when must have played a part in it.',
      'He said this was a fun giveaway didnt he.',
      'He is a fraud.',
      'This is never a giveaway, you deserve the prize.',
      'Shall we continue?',
    ];
    _healIdx=5;
    _p5=['idle','idle','idle','idle','holding','holding','idle','idle','idle','idle','idle','idle','fists_up'];
    _s5=['professor','professor','professor','professor','narrator','professor','narrator','professor','professor','professor','professor','professor','professor'];
  }

  CS.lines=_l5;
  CS.poses=_p5;
  CS.speakers=_s5;
  CS.events={ [_healIdx]: ()=>{ S.bossHP=Math.min(S.bossMax, S.bossHP+50); S.bossHealFlash=40; S.bossBandaged=true; updateHP(); } };
  csAdvance();
}

export function csEnd5(){
  endCutscene();
  S.phase=5;
  S.bossHP=100;
  S.bossHealFlash=0;
  S.bossBandaged=true;
  S.bossHitFlash=8;
  // Unlike csEnd()'s default (phase3) branch, this cutscene is reached from
  // phase 4's real-time gauntlet (quadPhase.js -> phase5cs()), where
  // S.turn is 'boss' the whole time (phase4() kicks it off via
  // bossAttack() and nothing in the stomp/platform/split/quad chain ever
  // sets it back). Without this, doFight()'s S.turn!=='player' guard would
  // silently block every FIGHT press forever after phase 4 completes.
  S.turn='player';
  S.actionLocked=false;
  updateHP();
  elBossBg.style.background='radial-gradient(ellipse at 50% 95%, #001133 0%, #000 60%)';
  say('He rolls his shoulders. Something feels different.');
  highlightMain(); buildSub('FIGHT');
}
