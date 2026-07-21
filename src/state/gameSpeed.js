// Player-customizable game simulation speed (ticks/sec), toggled via a
// custom keybind (computer mode) or a dedicated button (phone mode) — see
// ui/gameSpeedPanel.js. When enabled, core/loop.js uses `rate` as a hard
// target tick rate instead of its default fps-adaptive 15/sec floor.
// Persisted to localStorage independent of the save key, same reasoning as
// state/phoneLayout.js: a device/UI preference, not game progress, so
// CLEAR KEY and the every-join stats reset (main.js) don't touch it.
//
// setEnabled(true) below also taints S._usedGameSpeed (state/gameState.js)
// — unlike this module's own on/off state, that flag lives on S because
// it's baked into every save code from that point on (state/saveCode.js),
// same permanent-taint treatment as S._usedTestGui/_madMode.
import { S } from './gameState.js';

const STORAGE_KEY = 'ironFistBattle_gameSpeed';
export const MIN_RATE = 15;
export const MAX_RATE = 120;
export const RATE_STEP = 5;
const DEFAULT_RATE = 30;

function clampRate(n){
  return Math.max(MIN_RATE, Math.min(MAX_RATE, n));
}

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      return {
        enabled: !!parsed.enabled,
        rate: clampRate(parsed.rate || DEFAULT_RATE),
        keybind: typeof parsed.keybind === 'string' ? parsed.keybind : null,
      };
    }
  }catch(e){}
  return { enabled: false, rate: DEFAULT_RATE, keybind: null };
}

const state = load();

function save(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
}

export function getGameSpeed(){ return state; }

export function setRate(n){
  state.rate = clampRate(n);
  save();
}

export function setEnabled(on){
  state.enabled = on;
  if(on) S._usedGameSpeed = true;
  save();
}

export function setKeybind(key){
  state.keybind = key;
  save();
}
