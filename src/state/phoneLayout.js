// Custom phone-mode layout overrides for the D-pad, arena, dialogue box, and
// GAMESPEED button (position + scale), set via the in-game layout editor
// (ui/layoutEditor.js) and persisted to localStorage independent of the
// save key. This is a device/UI preference, not game progress, so — unlike
// stats.js — it's untouched by CLEAR KEY and the every-join stats reset in
// main.js.
const STORAGE_KEY = 'ironFistBattle_phoneLayout';
const ELEMENTS = ['dpad', 'arena', 'dialogue', 'gamespeedBtn'];

function emptyLayout(){
  return {
    dpad:         { x: 0, y: 0, scale: 1 },
    arena:        { x: 0, y: 0, scale: 1 },
    dialogue:     { x: 0, y: 0, scale: 1 },
    gamespeedBtn: { x: 0, y: 0, scale: 1 },
  };
}

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      const def = emptyLayout();
      const out = {};
      for(const name of ELEMENTS) out[name] = { ...def[name], ...(parsed[name] || {}) };
      return out;
    }
  }catch(e){}
  return emptyLayout();
}

const layout = load();

function save(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(layout)); }catch(e){}
}

export function getLayout(){ return layout; }

export function setElementLayout(name, partial){
  Object.assign(layout[name], partial);
  save();
}

export function resetLayout(){
  const def = emptyLayout();
  for(const name of ELEMENTS) Object.assign(layout[name], def[name]);
  save();
}
