// Portable save code: encodes {phase, items, deathCount, totalPlayTimeMs,
// usedTestGui, madMode, phaseDeathCounts} into a compact, copy-pasteable
// string, and decodes it back. Not real cryptography — an XOR scramble +
// checksum so a pasted-in code round-trips reliably and casual tampering is
// caught, without needing any library. usedTestGui and madMode are carried
// along silently (not surfaced anywhere in the UI, see state/gameState.js's
// S._usedTestGui / S._madMode) — decoding a code is the only way to recover
// them. phaseDeathCounts is an object keyed 1-9 (death count per phase, see
// state/stats.js).
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

// Portable summary key: encodes end-of-game stats {phaseTimesMs, totalPlayTimeMs,
// deathCount} for sharing/display purposes only. Deliberately distinct from the
// save code above (different marker + field count) so it can never be mistaken
// for a resumable save, and is NOT accepted by decodeSaveCode.
const SUMMARY_MARKER = 'SUMMARY';
const SUMMARY_PHASE_COUNT = 9;

export function encodeSummaryKey({ phaseTimesMs, totalPlayTimeMs, deathCount }){
  const phaseTimes = [];
  for(let p=1; p<=SUMMARY_PHASE_COUNT; p++){
    phaseTimes.push(phaseTimesMs[p]);
  }
  const payload = [SUMMARY_MARKER, ...phaseTimes, totalPlayTimeMs, deathCount].join('|');
  const full = `${payload}|${checksum(payload)}`;
  const scrambled = xorString(full, XOR_KEY);
  return btoa(unescape(encodeURIComponent(scrambled)));
}

export function decodeSummaryKey(code){
  try{
    const scrambled = decodeURIComponent(escape(atob(code.trim())));
    const full = xorString(scrambled, XOR_KEY);
    const parts = full.split('|');
    // marker + 9 phase times + totalPlayTimeMs + deathCount + checksum
    if(parts.length !== SUMMARY_PHASE_COUNT + 4) return null;
    const marker = parts[0];
    const cs = parts[parts.length - 1];
    const fields = parts.slice(1, parts.length - 1);
    if(marker !== SUMMARY_MARKER) return null;
    const payload = [marker, ...fields].join('|');
    if(String(checksum(payload)) !== cs) return null;
    const nums = fields.map(n=>parseInt(n,10));
    if(nums.some(n=>Number.isNaN(n))) return null;
    const phaseNums = nums.slice(0, SUMMARY_PHASE_COUNT);
    const totalPlayTimeMs = nums[SUMMARY_PHASE_COUNT];
    const deathCount = nums[SUMMARY_PHASE_COUNT + 1];
    const phaseTimesMs = {};
    phaseNums.forEach((ms, idx) => { phaseTimesMs[idx + 1] = ms; });
    return { phaseTimesMs, totalPlayTimeMs, deathCount };
  }catch(e){
    return null;
  }
}
