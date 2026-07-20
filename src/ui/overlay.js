import { S, initState } from '../state/gameState.js';
import { D } from '../state/dialogue.js';
import { CS } from '../state/cutsceneState.js';
import { elBossBg, elBossMad, elArena, elMenu, elStats, elOverlay } from '../core/canvasRefs.js';
import { say, updateHP, highlightMain, buildSub } from './menu.js';
import { beginMeditate } from '../boss/attacks/meditate.js';
import { recordDeath } from '../state/stats.js';
import { refreshStatsDisplay } from './statsDisplay.js';

function showOverlay(title,sub,col){
  document.getElementById('overlay-title').textContent=title;
  document.getElementById('overlay-title').style.color=col;
  document.getElementById('overlay-sub').textContent=sub;
  elOverlay.classList.add('show');
}
function winFight(){S.gameOver=true;say(D.kill[0]);setTimeout(()=>showOverlay('YOU WON','Professor Oak has been defeated.','#ffff44'),1000);}
function loseGame(){
  recordDeath(S.phase);
  refreshStatsDisplay();
  // Frenzy quad death → meditate (only once)
  if(S._quadFrenzy && S.phase>=8 && !S._meditateUsed){
    S.gameOver=false;
    elArena.style.transform='';
    beginMeditate();
    return;
  }
  // Phase 2+: respawn at start of phase with full HP
  if(S.phase>=2){
    // Keep gameOver=true during the delay so the loop doesn't run stale attack logic
    S.gameOver=true;
    S.playerHP=S.playerMax;
    S.pHitFlash=0;
    S.pSilentFlash=90; // silent iframes on respawn — no flash animation
    if(S.phase===2) S.bossHP=250;      // phase 2 resets to 250
    else if(S.phase===3) S.bossHP=200; // phase 3 resets to 200
    else if(S.phase===4) S.bossHP=150; // phase 4 resets to 150
    else if(S.phase===5) S.bossHP=100; // phase 5 resets to 100
    else if(S.phase===6) S.bossHP=50;  // phase 6 resets to 50
    if(S.phase>=7) S.bossHP=25; // phase 7 resets to 25
    if(S.phase>=8) S.bossHP=1;  // phase 8 resets to 1
    updateHP();
    // Reset all sub-phase state
    S.zones=[]; S.quadSlabs=[];
    S.quadPhase=false; S.platPhase=false; S.splitPhase=false; S.dropperPhase=false; S.wallsPhase=false; S.riflePhase=false; S.ricochetPhase=false; S.rapidfirePhase=false; S.grenadePhase=false; S.possessionPhase=false; S.compulsionPhase=false; S.blindchasePhase=false; S.corMultiRicPhase=false; S.corMultiRicBalls=[]; S.corBlocksPhase=false; S.corRGPhase=false; S.corSpinRapidPhase=false; S.corSpinBullets=[]; S.bossOffsetX=0; S.corSSPhase=false; S.corSSRotation=0; elArena.style.transform=''; S.corBCPullPhase=false; S.healOrbs=[]; S.corQuadPhase=false; S.healOrbsPhase=false; S.corMRSPhase=false; S.corMRSBalls=[]; S.corMRSCircles=[]; S.cor10Phase=false; S.cor10Balls=[]; S.cor10FloorDmg=false;
    S.meditatePhase=false; S.meditateRicBullets=[]; S.meditateGrenades=[]; S.meditateBeamTimer=0; S.meditateSpinners=[]; S.meditateZigzags=[];
    document.getElementById('meditate-text').style.display='none';
    S.quadBlackout=false; S.quadBlackTimer=0; S.quadRotation=0;
    S.rifleWalls=[]; S.rifleBullet=null; S.rifleShot=0; S.rifleState='aim'; S.ricochetBullet=null; S.rapidfireBullets=[]; S.rapidfireShotCount=0; S.grenades=[]; S.possessionBeams=[]; S.possessionInverted=false; S.possessionFlash=0; S.blindchaseBullets=[]; S._bcSpawnCount=0; S._bcInverted=false; S._bcInvertFlash=0;
    S.gravity=false; S.vy=0; S.vy2=0;
    S.splitPlats=[]; S.splitXbeamCount=0; S.splitRotStart=0;
    S.platforms=[]; S.floorDmg=false;
    S.attack=null; S.atkTimer=0; S.platStart=0; S.stompStart=-1; S.stompEnd=-1;
    S.arenaRotating=false; S.arenaRotation=0; S.rotStart=0; S.rotEnd=0; S.shakeFrames=0;
    S.dropperBoxes=[]; S.dropperFlipped=false; S.dropperDone=false;
    elArena.style.transform='';
    elMenu.style.display='none';
    say('...You rise.');
    setTimeout(()=>{
      S.gameOver=false;
      S.actionLocked=false;
      S.turn='player';
      elMenu.style.display='';
      say('What will you do?');
      S.inSub=false;S.subIdx=0;highlightMain();buildSub(S.selAction);
    }, 800);
    return;
  }
  S.gameOver=true;
  say(D.lose[0]);
  setTimeout(()=>showOverlay('YOU DIED','But somewhere, a door remains open.','#ff2222'),1200);
}
function resetGame(){
  elOverlay.classList.remove('show');
  elBossBg.style.background='';
  CS.active=false;
  document.getElementById('battle-box').classList.remove('phase8-horror');
  const dlg=document.getElementById('dialogue');
  dlg.style.cursor=''; dlg.onclick=null;
  elArena.style.display='';
  elMenu.style.display='';
  elStats.style.display='';
  initState();updateHP();
  elBossMad.style.display='none';
  // Belt-and-suspenders: re-show the SAVE button in case resetGame() is
  // ever reached after the ending sequence hid it (see actions/fight.js).
  document.getElementById('save-btn').style.display='';
  say('The greed of yours has turned the card againest you.');
  highlightMain();buildSub('FIGHT');
}

export { showOverlay, winFight, loseGame, resetGame };

// Referenced from inline onclick="resetGame()" in index.html.
window.resetGame = resetGame;
