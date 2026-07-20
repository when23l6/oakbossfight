// Extracted verbatim from "iron_fist_battle_v8 (2).html" lines 317-320,
// 323-324, and 365-372 (DOM lookups only — the bxParticles array and
// spawnBxParticle/drawBxParticles functions that originally sat between
// these two blocks, lines 325-362, belong to a later subtask: core/particles.js).
export const bossCanvas=document.getElementById('boss-canvas');
export const bCtx=bossCanvas.getContext('2d');
export const arenaCanvas=document.getElementById('arena-canvas');
export const aCtx=arenaCanvas.getContext('2d');

export const pCanvas=document.getElementById('particle-canvas');
export const pCtx=pCanvas.getContext('2d');

// Cached DOM elements (never change after load)
export const elBossBg    = document.getElementById('boss-bg');
export const elBossMad   = document.getElementById('boss-mad');
export const elCsSkip    = document.getElementById('cs-skip');
export const elSpeaker   = document.getElementById('speaker-label');
export const elArena     = document.getElementById('arena-section');
export const elMenu      = document.getElementById('menu-area');
export const elStats     = document.getElementById('stats-row');
export const elOverlay   = document.getElementById('overlay');
