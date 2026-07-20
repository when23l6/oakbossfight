// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 3032-3327.
// Split into this file + corRifleGrenadeHelpers.js to stay under the
// 300-line limit; helpers are re-exported so `import ... from
// './corRifleGrenade.js'` still exposes every original name.
// Logic only (begin/update) — rendering is entangled with the plain `rifle`
// and `grenade` attacks via combined if-conditions in the original file and
// is handled by a separate render subtask (see src/boss/render/rifleGrenadeDraw.js).
import { S } from '../../state/gameState.js';
import { ARENA_W, ARENA_H, AM } from '../../state/constants.js';
import { say, updateHP } from '../../ui/menu.js';
import { elMenu } from '../../core/canvasRefs.js';
import { loseGame } from '../../ui/overlay.js';
import { _rifleAimOrigin, _rifleAngleToPlayer } from './rifle.js';
import { GRN_WAIT_DUR, GRN_ARC_DUR, GRN_WARN_DUR, GRN_BLAST_DUR, GRN_BLAST_R } from './grenade.js';
import { beginCorSpinRapid } from './corSpinRapid.js';
import { CRG_SPD, _spawnCorGrenades, _corRGMove, _startCorRifleShot } from './corRifleGrenadeHelpers.js';

export { CRG_SPD, _spawnCorGrenades, _corRGMove, _startCorRifleShot } from './corRifleGrenadeHelpers.js';

export function beginCorRifleGrenade(){
  if(S.corRGPhase) return;
  S.corRGPhase=true;
  S.corRGTimer=0;
  S.corRGStage='grenade'; // start with grenades
  S.corRGDodged=false;
  S.corRGButtonActive=false;
  S.corRGCycle=0; // which rifle shot we're on (0,1,2)
  S.gravity=false; S.vy=0;
  S.rifleBullet=null;
  S.rifleWalls=[];

  // Spawn first grenade volley
  _spawnCorGrenades();
  say('Grenades!');
  elMenu.style.display='none';
}

export function updateCorRifleGrenade(){
  if(!S.corRGPhase) return;
  S.corRGTimer++;
  if(S.corRGStage!=='drop') _corRGMove();

  // ── GRENADE STAGE ──
  if(S.corRGStage==='grenade'){
    S.grenadeTimer++;
    let allDone=true;
    for(const g of S.grenades){
      if(g.state==='done') continue;
      allDone=false;
      g.timer++;
      const waitDur=GRN_WAIT_DUR+(g._waitOffset||0);
      if(g.state==='wait'){
        if(g.timer>=waitDur){g.state='arc';g.timer=0;}
      } else if(g.state==='arc'){
        if(g.timer>=GRN_ARC_DUR){g.state='warn';g.timer=0;}
      } else if(g.state==='warn'){
        if(g.timer>=GRN_WARN_DUR){g.state='blast';g.timer=0;S.shakeFrames=6;}
      } else if(g.state==='blast'){
        if(S.pHitFlash<=0&&S.pSilentFlash<=0){
          const dx=S.px-g.lx,dy=S.py-g.ly;
          if(Math.sqrt(dx*dx+dy*dy)<GRN_BLAST_R+6){
            S.playerHP=Math.max(0,S.playerHP-7);S.pHitFlash=40;updateHP();
            if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.corRGPhase=false;setTimeout(loseGame,500);}
          }
        }
        if(g.timer>=GRN_BLAST_DUR){g.state='done';}
      }
    }
    // Wall collision during grenade stage
    for(const w of S.rifleWalls){
      if(!w.alive) continue;
      const r=6;
      if(S.px+r>w.x&&S.px-r<w.x+w.w&&S.py+r>w.y&&S.py-r<w.y+w.h){
        const oT=Math.abs((S.py+r)-w.y),oB=Math.abs(w.y+w.h-(S.py-r));
        if(oT<oB) S.py=w.y-r; else S.py=w.y+w.h+r;
      }
    }
    if(allDone){
      S.grenades=[];
      // Gravity drop for 1 second before next rifle shot
      S.corRGStage='drop';
      S.corRGGravTimer=0;
      S.gravity=true; S.vy=0;
      say('...');
    }
    return;
  }

  // ── DROP STAGE — gravity on for 60 frames (1 sec) then rifle again ──
  if(S.corRGStage==='drop'){
    S.corRGGravTimer++;
    S.vy+=0.28;
    S.py=Math.min(ARENA_H-AM-9, S.py+S.vy);
    if(S.py>=ARENA_H-AM-9){ S.vy=0; }
    // Wall collision — resolve and zero vy when landing on top
    for(const w of S.rifleWalls){
      if(!w.alive) continue;
      const r=6;
      if(S.px+r>w.x&&S.px-r<w.x+w.w&&S.py+r>w.y&&S.py-r<w.y+w.h){
        const oT=Math.abs((S.py+r)-w.y), oB=Math.abs(w.y+w.h-(S.py-r));
        if(oT<oB){ S.py=w.y-r; if(S.vy>0) S.vy=0; } // landed on top
        else      { S.py=w.y+w.h+r; if(S.vy<0) S.vy=0; } // hit underside
      }
    }
    // Determine if on any ground (floor or wall top)
    const onWall=S.rifleWalls.some(w=>w.alive&&Math.abs(S.py+6-w.y)<2&&S.px+6>w.x&&S.px-6<w.x+w.w);
    const onGround=S.py>=ARENA_H-AM-9||onWall;
    const spd=3.2*CRG_SPD;
    if(!S.gameOver){
      if((S.keys['ArrowUp']||S.keys['w']||S.keys[' ']||S.keys['Enter'])&&onGround) S.vy=-5.5;
      if(S.keys['ArrowLeft'] ||S.keys['a']) S.px=Math.max(AM+9,S.px-spd);
      if(S.keys['ArrowRight']||S.keys['d']) S.px=Math.min(ARENA_W-AM-9,S.px+spd);
    }
    if(S.corRGGravTimer>=60){
      S.gravity=false; S.vy=0;
      if(S.corRGCycle>=3){
        S.corRGStage='finish';
        S.corRGButtonActive=true;
        say('...');
      } else {
        _startCorRifleShot();
      }
    }
    return;
  }

  // ── FINISH STAGE — player touches button, boss dodges to side ──
  if(S.corRGStage==='finish'){
    if(S.corRGButtonActive){
      const bx=ARENA_W/2-22, by=AM+4, bw=44, bh=20;
      const onBtn=S.px+6>bx&&S.px-6<bx+bw&&S.py+6>by&&S.py-6<by+bh;
      if(onBtn){
        S.corRGButtonActive=false;
        S.corRGStage='dodge';
        S.corRGDodgeTimer=0;
        say('...');
      }
    }
    return;
  }

  // ── DODGE STAGE — boss slides to side over 40 frames, then walks back ──
  if(S.corRGStage==='dodge'){
    S.corRGDodgeTimer++;
    const t=S.corRGDodgeTimer;
    const TARGET=80;
    const SLIDE=20, PAUSE=15, WALKBACK=25;
    if(t<=SLIDE){
      S.bossOffsetX=Math.round(TARGET*(t/SLIDE));
    } else if(t<=SLIDE+PAUSE){
      S.bossOffsetX=TARGET;
    } else if(t<=SLIDE+PAUSE+WALKBACK){
      const p=(t-SLIDE-PAUSE)/WALKBACK;
      S.bossOffsetX=Math.round(TARGET*(1-p));
    } else {
      S.bossOffsetX=0;
      // Walk back done — start spin rapid attack
      S.corRGPhase=false;
      S.rifleWalls=[];
      S.rifleBullet=null;
      beginCorSpinRapid();
    }
    return;
  }

  // ── RIFLE STAGE ──
  if(S.corRGStage==='rifle'){
    S.rifleTimer++;
    const t=S.rifleTimer;
    const AIM_DUR=Math.round(60/1.3), BULLET_SPX=80, RELOAD=40;

    // Check attack button — triggers dodge and goes straight to next attack
    if(S.corRGButtonActive && S.rifleState==='aim'){
      const bx=ARENA_W/2-22, by=AM+4, bw=44, bh=20;
      const onBtn=S.px+6>bx&&S.px-6<bx+bw&&S.py+6>by&&S.py-6<by+bh;
      if(onBtn){
        S.corRGButtonActive=false;
        S.rifleBullet=null;
        S.shakeFrames=6;
        say('He sidesteps!');
        // Go straight to dodge → next attack, regardless of cycle count
        S.corRGStage='dodge';
        S.corRGDodgeTimer=0;
        return;
      }
    }

    // Move walls
    for(const w of S.rifleWalls){
      if(!w.alive){if(w.shatterTimer>0)w.shatterTimer--;continue;}
      w.x+=w.vx;
      if(w.x<=AM){w.x=AM;w.vx=Math.abs(w.vx);}
      if(w.x+w.w>=ARENA_W-AM){w.x=ARENA_W-AM-w.w;w.vx=-Math.abs(w.vx);}
    }
    // Wall push player
    for(const w of S.rifleWalls){
      if(!w.alive) continue;
      const r=6;
      if(S.px+r>w.x&&S.px-r<w.x+w.w&&S.py+r>w.y&&S.py-r<w.y+w.h){
        const oT=Math.abs((S.py+r)-w.y),oB=Math.abs(w.y+w.h-(S.py-r));
        if(oT<oB) S.py=w.y-r; else S.py=w.y+w.h+r;
      }
    }

    if(S.rifleState==='aim'){
      const target=_rifleAngleToPlayer();
      let diff=target-S.rifleAimAngle;
      while(diff>Math.PI)diff-=Math.PI*2;
      while(diff<-Math.PI)diff+=Math.PI*2;
      S.rifleAimAngle+=diff*0.18;
      if(t>=AIM_DUR){
        S.corRGButtonActive=false;
        S.rifleState='fire'; S.rifleTimer=0;
        const o=_rifleAimOrigin();
        const angle=S.rifleAimAngle;
        const len=Math.sqrt(ARENA_W*ARENA_W+ARENA_H*ARENA_H);
        const cos=Math.cos(angle),sin=Math.sin(angle);
        let hitWall=null,hitDist=Infinity;
        for(const w of S.rifleWalls){
          if(!w.alive) continue;
          const tX1=(w.x-o.x)/cos,tX2=(w.x+w.w-o.x)/cos;
          const tY1=(w.y-o.y)/sin,tY2=(w.y+w.h-o.y)/sin;
          const tXmin=Math.min(tX1,tX2),tXmax=Math.max(tX1,tX2);
          const tYmin=Math.min(tY1,tY2),tYmax=Math.max(tY1,tY2);
          const tEnter=Math.max(tXmin,tYmin),tExit=Math.min(tXmax,tYmax);
          if(tEnter<tExit&&tEnter>0&&tEnter<hitDist){hitDist=tEnter;hitWall=w;}
        }
        if(hitDist===Infinity)hitDist=len;
        const playerDist=(S.px-o.x)*cos+(S.py-o.y)*sin;
        const playerShielded=hitWall&&hitDist<playerDist-6;
        if(!playerShielded&&S.pHitFlash<=0&&S.pSilentFlash<=0){
          S.playerHP=Math.max(0,S.playerHP-6);S.pHitFlash=40;updateHP();
          if(S.playerHP<=0&&!S.gameOver){S.gameOver=true;S.corRGPhase=false;setTimeout(loseGame,500);}
        }
        S.rifleBullet={ox:o.x,oy:o.y,bx:o.x,by:o.y,angle,cos,sin,dist:0,hitDist,hitWall,done:false};
      }
    } else if(S.rifleState==='fire'){
      const b=S.rifleBullet;
      if(!b.done){
        b.dist=Math.min(b.dist+BULLET_SPX,b.hitDist);
        b.bx=b.ox+b.cos*b.dist; b.by=b.oy+b.sin*b.dist;
        if(b.dist>=b.hitDist){b.done=true;if(b.hitWall){b.hitWall.alive=false;b.hitWall.shatterTimer=40;}S.shakeFrames=5;}
      }
      if(b.done&&t>=4){S.rifleState='reload';S.rifleTimer=0;}
    } else if(S.rifleState==='reload'){
      if(t>=RELOAD){
        S.corRGCycle++;
        S.rifleBullet=null;
        if(S.corRGCycle>=3){
          // Last shot done — skip grenades, go straight to drop then finish
          S.corRGStage='drop';
          S.corRGGravTimer=0;
          S.gravity=true; S.vy=0;
          say('...');
        } else {
          _spawnCorGrenades();
          S.corRGStage='grenade';
          say('Grenades!');
        }
      }
    }
  }
}
