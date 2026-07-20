// Lifetime play stats — persisted to localStorage so they survive closing
// and reopening the page (not reset by resetGame()/initState(), unlike S).
const STORAGE_KEY = 'ironFistBattle_stats';
const PHASE_COUNT = 9;

function emptyPhaseDeathCounts(){
  const o = {};
  for(let p=1; p<=PHASE_COUNT; p++) o[p] = 0;
  return o;
}

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      const phaseDeathCounts = emptyPhaseDeathCounts();
      if(parsed.phaseDeathCounts){
        for(let p=1; p<=PHASE_COUNT; p++) phaseDeathCounts[p] = parsed.phaseDeathCounts[p] || 0;
      }
      return {
        totalPlayTimeMs: parsed.totalPlayTimeMs || 0,
        deathCount: parsed.deathCount || 0,
        phaseDeathCounts,
      };
    }
  }catch(e){}
  return { totalPlayTimeMs: 0, deathCount: 0, phaseDeathCounts: emptyPhaseDeathCounts() };
}

const stats = load();

function save(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); }catch(e){}
}

export function getTotalPlayTimeMs(){ return stats.totalPlayTimeMs; }
export function getDeathCount(){ return stats.deathCount; }
export function getPhaseDeathCounts(){ return stats.phaseDeathCounts; }

export function addPlayTimeMs(ms){
  stats.totalPlayTimeMs += ms;
  save();
}

// phase is whatever S.phase was at the moment of death — the same value
// ui/overlay.js's loseGame() already has on hand when it calls this.
export function recordDeath(phase){
  stats.deathCount++;
  if(phase>=1 && phase<=PHASE_COUNT) stats.phaseDeathCounts[phase]++;
  save();
}

// Overwrites all three directly — used when loading a save code, as
// opposed to addPlayTimeMs()/recordDeath() which increment during normal
// play. phaseDeathCounts is optional so callers restoring an older-format
// decode (without it) don't need to fabricate one.
export function setStats(deathCount, totalPlayTimeMs, phaseDeathCounts){
  stats.deathCount = deathCount;
  stats.totalPlayTimeMs = totalPlayTimeMs;
  if(phaseDeathCounts) stats.phaseDeathCounts = phaseDeathCounts;
  save();
}

// Wipes everything a save code encodes back to zero — used by the SAVE
// menu's CLEAR KEY button (ui/saveLoad.js).
export function resetStats(){
  stats.deathCount = 0;
  stats.totalPlayTimeMs = 0;
  stats.phaseDeathCounts = emptyPhaseDeathCounts();
  save();
}
