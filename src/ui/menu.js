import { S } from '../state/gameState.js';
import { ACTIONS } from '../state/constants.js';
import { doFight } from '../actions/fight.js';
import { doAct } from '../actions/act.js';
import { doItem } from '../actions/item.js';
import { doCardMaker } from '../actions/cardMaker.js';
import { doMercy } from '../actions/mercy.js';
import { isInputBlocked } from './inputBlock.js';

function say(t){ document.getElementById('dialogue').textContent=t; }
function updateHP(){
  document.getElementById('boss-hp-bar').style.width=(S.bossHP/S.bossMax*100)+'%';
  document.getElementById('boss-hp-text').textContent=S.bossHP+' / '+S.bossMax;
  document.getElementById('player-hp-bar').style.width=(S.playerHP/S.playerMax*100)+'%';
  document.getElementById('hp-text').textContent=S.playerHP+'/'+S.playerMax;
}
function highlightMain(){
  document.querySelectorAll('.act-btn').forEach((b,i)=>{
    b.classList.toggle('sel',i===S.mainIdx);
    b.style.display=(S.phase>=9 && i!==0)?'none':'';
  });
}
function renderSub(){
  const sub=document.getElementById('sub-actions');
  if(!S.subList.length){sub.innerHTML='';return;}
  sub.innerHTML=S.subList.map((item,i)=>
    `<button class="sub-btn${i===S.subIdx?' sub-sel':''}" onclick="fireSub(${i})">${item.label}</button>`
  ).join('');
}
function buildSub(action){
  S.inSub=false; S.subIdx=0;
  if(S.phase>=9){
    S.subList=action==='FIGHT'?[{label:'Attack',fn:doFight}]:[];
    renderSub();
    return;
  }
  if(action==='FIGHT')      S.subList=[{label:'Attack',fn:doFight}];
  else if(action==='ACT')   S.subList=[{label:'Run',fn:()=>doAct('run')},{label:'Taunt',fn:()=>doAct('taunt')},{label:'Compliment',fn:()=>doAct('compliment')}];
  else if(action==='ITEM')  S.subList=[{label:S.phase>=5?'Meditate':`Bandage (${S.items})`,fn:doItem},{label:'Card Maker',fn:doCardMaker}];
  else if(action==='MERCY') S.subList=[{label:'Spare',fn:doMercy}];
  renderSub();
}
function selectAction(a){
  if(S.turn!=='player'||S.gameOver||S.actionLocked||isInputBlocked()) return;
  if(S.phase>=9 && a!=='FIGHT') return;
  S.selAction=a; S.mainIdx=ACTIONS.indexOf(a);
  S.inSub=false; S.subIdx=0;
  highlightMain(); buildSub(a);
}
function fireSub(i){
  if(S.turn!=='player'||S.gameOver||S.actionLocked||isInputBlocked()) return;
  S.subList[i].fn();
}
function clearSub(){ S.subList=[]; S.inSub=false; renderSub(); }
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}

export { say, updateHP, highlightMain, renderSub, buildSub, selectAction, fireSub, clearSub, pick };

// Referenced from inline onclick="" attributes in index.html / dynamically generated markup.
window.selectAction = selectAction;
window.fireSub = fireSub;
