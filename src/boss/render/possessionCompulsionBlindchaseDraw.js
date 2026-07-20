// possessionCompulsionBlindchaseDraw.js — barrel re-export.
//
// The combined possession + compulsion + blindchase render code exceeded
// the 300-line-per-file limit (321 lines), so the implementations live in
// two sibling modules and are re-exported here under the module path the
// orchestrator (drawArena.js) expects:
//   - possessionCompulsionDraw.js  → drawPossession, drawCompulsion
//   - blindchaseDraw.js            → drawBlindchase
export { drawPossession, drawCompulsion } from './possessionCompulsionDraw.js';
export { drawBlindchase } from './blindchaseDraw.js';
