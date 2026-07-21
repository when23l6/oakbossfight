import { S } from '../state/gameState.js';
import { encodeSummaryKey } from '../state/saveCode.js';
import { getTotalPlayTimeMs, getDeathCount, getPhaseDeathCounts } from '../state/stats.js';

// ── CREDITS ────────────────────────────────────
export function beginCredits(){
  const div=document.createElement('div');
  div.style.cssText='position:fixed;inset:0;background:#000;z-index:400;overflow:hidden;';

  const HEADERS=['A GAME BY','CHIEF VIBE OFFICER','DIRECTOR OF QUESTIONABLE DECISIONS',
    'HEAD OF BANDAGE LOGISTICS','MINISTER OF LOUD EXPLOSION NOISES','PROFESSIONAL BUTTON MASHER',
    'SPECIAL THANKS'];

  const lines=[
    '','','','',
    'A GAME BY',
    'when',
    '','',
    'CHIEF VIBE OFFICER',
    'when',
    '',
    'DIRECTOR OF QUESTIONABLE DECISIONS',
    'when',
    '',
    'HEAD OF BANDAGE LOGISTICS',
    'when',
    '',
    'MINISTER OF LOUD EXPLOSION NOISES',
    'when',
    '',
    'PROFESSIONAL BUTTON MASHER',
    'when',
    '',
    'SPECIAL THANKS',
    'when (again)',
    'when (still)',
    'when (yes, still)',
    '',
    '','',
    'Thank you for playing.',
    '','','','',
  ];

  const inner=document.createElement('div');
  inner.style.cssText=`
    position:absolute;left:0;right:0;top:0;
    text-align:center;font-family:'VT323',monospace;
    color:#aaa;font-size:22px;line-height:2.2;
    letter-spacing:2px;
  `;
  inner.innerHTML=lines.map(l=>{
    if(HEADERS.includes(l))
      return `<div style="color:#fff;font-size:18px;letter-spacing:4px;margin-top:10px;">${l}</div>`;
    if(l==='Thank you for playing.')
      return `<div style="color:#fff;font-size:28px;letter-spacing:3px;margin-top:20px;">${l}</div>`;
    return `<div>${l||'&nbsp;'}</div>`;
  }).join('');

  div.appendChild(inner);
  document.body.appendChild(div);

  // Scroll over exactly 30 seconds
  const DURATION=30000;
  const start=performance.now();

  function scroll(now){
    const elapsed=Math.min(now-start, DURATION);
    const prog=elapsed/DURATION;
    // totalH computed after layout — use requestAnimationFrame to let it render first
    const totalH=inner.scrollHeight;
    inner.style.transform=`translateY(-${prog*totalH}px)`;


    if(elapsed<DURATION) requestAnimationFrame(scroll);
    else showSummaryKey();
  }
  requestAnimationFrame(scroll);
}

// Shown once the credits finish scrolling — the literal end of the game.
// Read-only stats snapshot, never meant to be loaded back in (see
// state/saveCode.js decodeSummaryKey / ui/saveLoad.js's popup for that path).
function showSummaryKey(){
  const summaryKey=encodeSummaryKey({
    phase: S.phase,
    items: S.items,
    deathCount: getDeathCount(),
    totalPlayTimeMs: getTotalPlayTimeMs(),
    usedTestGui: S._usedTestGui,
    madMode: S._madMode,
    phaseDeathCounts: getPhaseDeathCounts(),
    phaseTimesMs: S.phaseTimesMs,
  });

  const wrap=document.createElement('div');
  wrap.style.cssText='position:fixed;inset:0;z-index:410;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:#000;font-family:Georgia,serif;opacity:0;transition:opacity 1.2s ease;';

  const endText=document.createElement('div');
  endText.textContent='The End';
  endText.style.cssText='font:italic 26px Georgia,serif;color:#c8c8c8;margin-bottom:10px;';

  const label=document.createElement('div');
  label.textContent='Your Summary Key:';
  label.style.cssText='font:italic 13px Georgia,serif;color:#c8c8c8;';

  const keyInput=document.createElement('input');
  keyInput.type='text'; keyInput.readOnly=true; keyInput.value=summaryKey;
  keyInput.style.cssText='display:block;padding:4px 8px;background:transparent;border:1px solid rgba(200,200,200,0.35);color:#c8c8c8;font:italic 13px Georgia,serif;text-align:center;width:min(80vw,340px);cursor:pointer;';

  const hint=document.createElement('div');
  hint.textContent='(click to copy)';
  hint.style.cssText='font:italic 11px Georgia,serif;color:rgba(200,200,200,0.65);cursor:pointer;';

  function copyKey(){
    const revert=()=>{ hint.textContent='(click to copy)'; };
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(summaryKey).then(()=>{
        hint.textContent='(copied!)';
        setTimeout(revert,1500);
      }).catch(()=>{
        keyInput.select();
        hint.textContent='(select the code above and copy manually)';
      });
    } else {
      keyInput.select();
      hint.textContent='(select the code above and copy manually)';
    }
  }
  keyInput.addEventListener('click',copyKey);
  hint.addEventListener('click',copyKey);

  wrap.appendChild(endText);
  wrap.appendChild(label);
  wrap.appendChild(keyInput);
  wrap.appendChild(hint);
  document.body.appendChild(wrap);
  requestAnimationFrame(()=>{ wrap.style.opacity='1'; });
}
