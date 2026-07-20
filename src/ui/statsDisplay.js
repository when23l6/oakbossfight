// Ticks total play time once per second and renders the "TIME .. · DEATHS .."
// corner readout (#stats-readout in index.html). Side-effect module — import
// it once from main.js to start the ticker; ui/overlay.js calls
// refreshStatsDisplay() right after a death so the count updates immediately
// instead of waiting for the next tick.
import { getTotalPlayTimeMs, getDeathCount, addPlayTimeMs } from '../state/stats.js';
import { S } from '../state/gameState.js';

const TICK_MS = 1000;
let el = null;

export function formatTime(ms){
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2,'0');
  const ss = String(s).padStart(2,'0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export function refreshStatsDisplay(){
  if(!el) el = document.getElementById('stats-readout');
  if(!el) return;
  el.textContent = `TIME ${formatTime(getTotalPlayTimeMs())} · DEATHS ${getDeathCount()}`;
}

refreshStatsDisplay();
setInterval(()=>{
  addPlayTimeMs(TICK_MS);
  if(S.phaseTimesMs) S.phaseTimesMs[S.phase] = (S.phaseTimesMs[S.phase]||0) + TICK_MS;
  refreshStatsDisplay();
}, TICK_MS);
