// Portable save code: encodes {phase, items, deathCount, totalPlayTimeMs,
// usedTestGui, madMode, phaseDeathCounts} into a compact, copy-pasteable
// string, and decodes it back. Not real cryptography — an XOR scramble +
// checksum so a pasted-in code round-trips reliably and casual tampering is
// caught, without needing any library. usedTestGui and madMode are carried
// along silently (not surfaced anywhere in the UI, see state/gameState.js's
// S._usedTestGui / S._madMode) — decoding a code is the only way to recover
// them. phaseDeathCounts is an object keyed 1-9 (death count per phase, see
// state/stats.js). See encodeSummaryKey/decodeSummaryKey below for the
// read-only counterpart that carries these same fields plus phaseTimesMs.
const XOR_KEY = 'IRONFIST';
const SAVE_PHASE_COUNT = 9;

// localStorage key the auto-save feature persists the latest code under —
// written by ui/phaseSavePopup.js on every S.phase change, read/offered by
// ui/autoSavePopup.js on every join, and cleared by ui/saveLoad.js's
// clearSaveKey(). Defined here (rather than in any of those three) since all
// three need it and none of them should import from each other for just a
// string constant.
export const AUTOSAVE_KEY = 'ironFistBattle_autosave';

function xorString(str, key){
  let out = '';
  for(let i=0;i<str.length;i++){
    out += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return out;
}

function checksum(str){
  let sum = 0;
  for(let i=0;i<str.length;i++) sum = (sum + str.charCodeAt(i) * (i+1)) % 9973;
  return sum;
}

export function encodeSaveCode({ phase, items, deathCount, totalPlayTimeMs, usedTestGui, madMode, phaseDeathCounts }){
  const pdc = [];
  for(let p=1; p<=SAVE_PHASE_COUNT; p++) pdc.push((phaseDeathCounts && phaseDeathCounts[p]) || 0);
  const payload = [phase, items, deathCount, totalPlayTimeMs, usedTestGui?1:0, madMode?1:0, ...pdc].join('|');
  const full = `${payload}|${checksum(payload)}`;
  const scrambled = xorString(full, XOR_KEY);
  return btoa(unescape(encodeURIComponent(scrambled)));
}

export function decodeSaveCode(code){
  try{
    const scrambled = decodeURIComponent(escape(atob(code.trim())));
    const full = xorString(scrambled, XOR_KEY);
    const parts = full.split('|');
    // phase, items, deathCount, totalPlayTimeMs, usedTestGui, madMode, 9x phaseDeathCounts, checksum
    if(parts.length !== 6 + SAVE_PHASE_COUNT + 1) return null;
    const cs = parts[parts.length - 1];
    const fields = parts.slice(0, -1);
    const payload = fields.join('|');
    if(String(checksum(payload)) !== cs) return null;
    const nums = fields.map(n=>parseInt(n,10));
    if(nums.some(n=>Number.isNaN(n))) return null;
    const [phaseNum, itemsNum, deathNum, timeNum, testGuiNum, madModeNum, ...pdcNums] = nums;
    const phaseDeathCounts = {};
    pdcNums.forEach((c, idx)=>{ phaseDeathCounts[idx+1] = c; });
    return {
      phase: phaseNum, items: itemsNum, deathCount: deathNum, totalPlayTimeMs: timeNum,
      usedTestGui: !!testGuiNum, madMode: !!madModeNum, phaseDeathCounts,
    };
  }catch(e){
    return null;
  }
}

// Portable summary key: encodes the exact same fields as the regular save
// code above (phase, items, deathCount, totalPlayTimeMs, usedTestGui,
// madMode, phaseDeathCounts) PLUS phaseTimesMs (per-phase time spent,
// unique to this format) — full parity for sharing/display/decoding
// purposes, while remaining permanently unloadable: deliberately distinct
// from the save code (different marker + a different field count, 26 parts
// here vs. 16 there) so decodeSaveCode() always rejects it outright — no
// special-case check needed, the shapes just don't match. usedTestGui and
// madMode stay unsurfaced in the visible summary popup UI (ui/saveLoad.js's
// showSummaryPopup()), same as they are for the regular save code —
// decoding is still the only way to recover them.
const SUMMARY_MARKER = 'SUMMARY';
const SUMMARY_PHASE_COUNT = 9;

export function encodeSummaryKey({ phase, items, deathCount, totalPlayTimeMs, usedTestGui, madMode, phaseDeathCounts, phaseTimesMs }){
  const pdc = [];
  for(let p=1; p<=SAVE_PHASE_COUNT; p++) pdc.push((phaseDeathCounts && phaseDeathCounts[p]) || 0);
  const ptm = [];
  for(let p=1; p<=SUMMARY_PHASE_COUNT; p++) ptm.push((phaseTimesMs && phaseTimesMs[p]) || 0);
  const payload = [SUMMARY_MARKER, phase, items, deathCount, totalPlayTimeMs, usedTestGui?1:0, madMode?1:0, ...pdc, ...ptm].join('|');
  const full = `${payload}|${checksum(payload)}`;
  const scrambled = xorString(full, XOR_KEY);
  return btoa(unescape(encodeURIComponent(scrambled)));
}

export function decodeSummaryKey(code){
  try{
    const scrambled = decodeURIComponent(escape(atob(code.trim())));
    const full = xorString(scrambled, XOR_KEY);
    const parts = full.split('|');
    // marker, phase, items, deathCount, totalPlayTimeMs, usedTestGui, madMode,
    // 9x phaseDeathCounts, 9x phaseTimesMs, checksum
    if(parts.length !== 1 + 6 + SAVE_PHASE_COUNT + SUMMARY_PHASE_COUNT + 1) return null;
    const marker = parts[0];
    if(marker !== SUMMARY_MARKER) return null;
    const cs = parts[parts.length - 1];
    const fields = parts.slice(0, -1);
    const payload = fields.join('|');
    if(String(checksum(payload)) !== cs) return null;
    const numFields = fields.slice(1); // drop the marker before parsing as numbers
    const nums = numFields.map(n=>parseInt(n,10));
    if(nums.some(n=>Number.isNaN(n))) return null;
    const [phaseNum, itemsNum, deathNum, timeNum, testGuiNum, madModeNum, ...rest] = nums;
    const pdcNums = rest.slice(0, SAVE_PHASE_COUNT);
    const ptmNums = rest.slice(SAVE_PHASE_COUNT, SAVE_PHASE_COUNT + SUMMARY_PHASE_COUNT);
    const phaseDeathCounts = {};
    pdcNums.forEach((c, idx)=>{ phaseDeathCounts[idx+1] = c; });
    const phaseTimesMs = {};
    ptmNums.forEach((ms, idx)=>{ phaseTimesMs[idx+1] = ms; });
    return {
      phase: phaseNum, items: itemsNum, deathCount: deathNum, totalPlayTimeMs: timeNum,
      usedTestGui: !!testGuiNum, madMode: !!madModeNum, phaseDeathCounts, phaseTimesMs,
    };
  }catch(e){
    return null;
  }
}
