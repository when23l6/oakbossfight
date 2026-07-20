// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 268-314.
// NOTE: original line 315 (`initState();` auto-invoked at module scope) was
// intentionally NOT copied here — per docs/architecture.md, main.js is
// responsible for calling initState() once during startup.
import { ARENA_W, ARENA_H } from './constants.js';

export let S={};
export function initState(){
  S={
    phase:1, bossHP:300, bossMax:300,
    phaseTimesMs:{1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0},
    playerHP:20, playerMax:20,
    px:ARENA_W/2, py:ARENA_H-28,
    turn:'player', _prevTurn:'player',
    pSilentFlash:0, actionLocked:false,
    selAction:'FIGHT', mainIdx:0,
    subIdx:0, inSub:false, subList:[],
    flattered:0, runCount:0, tauntCount:0, _runBlitz:false,
    bossHitFlash:0, pHitFlash:0,
    items:10,
    bullets:[], attack:null, atkTimer:0, atkDur:190,
    keys:{}, tick:0, gameOver:false, gravity:false, vy:0, zones:[], particles:[], csSkip:false, arenaRotation:0, arenaRotating:false, rotStart:0, rotEnd:0, stompStart:-1, stompEnd:-1, platforms:[], floorDmg:false, platPhase:false, platTimer:0, platStart:0, shakeFrames:0, splitPhase:false, splitTimer:0, px2:0, py2:0, vy2:0, p2HitFlash:0,
    quadPhase:false, quadTimer:0, quadSafe:0, quadPrev:-1, quadRound:0, quadSlabs:[], _quadMaxRounds:0, _quadSlowAfter:0,
    quadPlayerQuad:0, quadKeyHeld:false, quadShowPrevTimer:0, quadNextSafe:undefined,
    quadBlackout:false, quadBlackTimer:0, quadRotation:0,
    cs1items:undefined, bossHealFlash:0, bossBandaged:false, dropperPhase:false, wallsPhase:false,
    riflePhase:false, rifleTimer:0, rifleShot:0, rifleWalls:[], rifleBullet:null, rifleAimAngle:0, rifleState:'aim',
    ricochetPhase:false, ricochetBullet:null,
    rapidfirePhase:false, rapidfireBullets:[], rapidfireTimer:0, rapidfireShotCount:0,
    grenadePhase:false, grenades:[], grenadeTimer:0,
    bossCoilOpen:false,
    possessionPhase:false, possessionTimer:0, possessionRound:0, possessionBeams:[], possessionInverted:false, possessionChargeTimer:0, possessionFlash:0,
    compulsionPhase:false, compulsionTimer:0, compulsionPulse:0, compulsionZoneX:0, compulsionZoneY:0, compulsionZoneR:0, compulsionZoneSide:0, _cmpStun:0, _cmpGlitchFlash:0, _cmpLastPulse:0,
    blindchasePhase:false, blindchaseTimer:0, blindchaseBullets:[], blindchaseFlash:0, _bcSpawnCount:0, _bcInverted:false, _bcInvertFlash:0,
    bossOld:false, bossHorror:false, bossBloodDrip:false, bossDeadEyes:false, _bossDeadAlpha:null,
    corMultiRicPhase:false, corMultiRicTimer:0, corMultiRicBalls:[],
    corBlocksPhase:false, corBlocksTimer:0,
    corRGPhase:false, corRGTimer:0, corRGStage:'rifle', corRGDodged:false, corRGButtonActive:false, corRGCycle:0, corRGGravTimer:0, corRGDodgeTimer:0,
    bossOffsetX:0,
    corSpinRapidPhase:false, corSpinTimer:0, corSpinAngle:0, corSpinBullets:[],
    corSSPhase:false, corSSTimer:0, corSSRotation:0,
    corBCPullPhase:false,
    healOrbs:[], healOrbsPhase:false, healOrbsTimer:0, _healVfxTimer:0,
    corQuadPhase:false,
    corMRSPhase:false, corMRSTimer:0, corMRSBalls:[], corMRSCircles:[],
    cor10Phase:false, cor10Timer:0, cor10Angle:0, cor10Balls:[], cor10Stage:'spin', cor10PlatTimer:0, cor10FloorDmg:false,
    _quadFrenzy:false, _quadFrenzyRound:0, _meditateUsed:false, _medKeyHeld:{},
    preMeditatePhase:false, preMeditateTimer:0, preMeditatePresses:0, preMeditateShineTimer:0, preMeditateKeyHeld:false,
    meditatePhase:false, meditateTimer:0, meditateHP:12, meditatePressCooldown:0, meditateFlash:0,
    meditateRicBullets:[], meditateGrenades:[], meditateBeamTimer:0,
    meditateSpinners:[], meditateZigzags:[],
    corEVPhase:false, corEVTimer:0, corEVBall:null, corEVPullTimer:0, corEVPullActive:false, corEVPullSide:0, corPhase:'up', corWorldX:0, corWorldY:0, corVx:0, corVy:0, corCamX:0, corCamY:0, corCeilingHit:false, corPurpleGone:false, corPauseTimer:0, corChaseWallX:0, corChaseDelay:0, corSqueezeCamX:0, corSqWallL:0, corSqWallR:0, corSqWallT:0, corSqWallB:0, corSqLX:0, corSqRX:0, corSqTY:0, corSqLWorldX:0, corSqR:0, corSqT:0, corSqB:0, corSqTgt:null, corSqueezeDelay:0, corRicTimer:0, corRicBCX:0, corRicBCY:0, corRicHalf:0, corRicVX:0, corRicVY:0, corVBoxes:[], corHBoxes:[],
    // Set true the moment the hidden dev phase-jump GUI (ui/secretTestGui.js)
    // is used to jump to a phase. Carried into every save code generated for
    // the rest of this playthrough (see state/saveCode.js) — not shown
    // anywhere in the UI, only recoverable by decoding a code.
    _usedTestGui:false,
    // Set true the moment "mad mode" activates (taunt #25 at phase>=7,
    // see actions/act.js's doAct('taunt')), which drops playerMax to 10.
    // Carried into every save code generated for the rest of this
    // playthrough (see state/saveCode.js) so reloading a save doesn't
    // silently undo the debuff.
    _madMode:false,
  };
}
