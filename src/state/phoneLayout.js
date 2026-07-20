// Custom phone-mode layout overrides for the D-pad and arena (position +
// scale), set via the in-game layout editor (ui/layoutEditor.js) and
// persisted to localStorage independent of the save key. This is a device/
// UI preference, not game progress, so — unlike stats.js — it's untouched
// by CLEAR KEY and the every-join stats reset in main.js.
const STORAGE_KEY = 'ironFistBattle_phoneLayout';

function emptyLayout(){
  return {
    dpad:  { x: 0, y: 0, scale: 1 },
    arena: { x: 0, y: 0, scale: 1 },
  };
}

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      const def = emptyLayout();
      return {
        dpad:  { ...def.dpad,  ...(parsed.dpad  || {}) },
        arena: { ...def.arena, ...(parsed.arena || {}) },
      };
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
  Object.assign(layout.dpad, def.dpad);
  Object.assign(layout.arena, def.arena);
  save();
}
