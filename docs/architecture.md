# Architecture

Boss-fight browser game, modularized from a single 9,302-line HTML file
(`iron_fist_battle_v8 (2).html`, preserved as git history at commit `d7dc853`).
All JS files are ES modules (`type="module"`); state is a shared mutable
object (`S`) imported by reference everywhere it's needed. Hard limit: 300
lines/file — a few source functions exceeded that and were split into
`*Helpers.js` / `*Variants.js` / `*Detail.js` siblings, re-exported from the
main file so the import path consumers use doesn't change.

## Directory layout

```
index.html          Markup shell + <link> to styles + <script type=module src=src/main.js>
src/
  main.js            Entry point: initState() -> resetStats() -> updateHP/highlightMain/buildSub
                     ('FIGHT') -> loop(). resetStats() here wipes the key clean on every join —
                     see state/stats.js and ui/autoSavePopup.js below.
  styles/            base.css (reset/layout/boss/HP bars), ui.css (menu/dialogue/overlay/animations),
                     responsive.css (phone-mode layout/mode-select gate, driven by a body.computer-
                     mode/phone-mode class; styles #arena-row, which flanks the arena canvas with the
                     d-pad control so it scales/moves with the layout, not a fixed corner)
  state/             constants.js, gameState.js (S + initState, incl. S._usedTestGui — set by the
                     hidden dev GUI below — and S._madMode — set when taunt #25 unlocks at
                     phase>=7, drops S.playerMax to 10 — neither surfaced in the UI), cutsceneState.js
                     (CS), dialogue.js (D), stats.js (this session's play-time/death-count + per-
                     phase death counts, persisted to localStorage so they survive within a session
                     but not reset by initState() itself — main.js explicitly calls resetStats()
                     right after initState() on every join instead, so the key always starts clean;
                     the only way old stats come back is loading a code), saveCode.js
                     (encode/decode the portable save-code + summary-key strings; save code
                     silently carries usedTestGui + madMode + per-phase death counts)
  core/              canvasRefs.js (DOM/canvas refs), particles.js, input.js (listeners), loop.js
                     (fixed-timestep accumulator: loop(now) runs updateOnce() 1+ times per rAF
                     callback — more than once if the render-frame gap implies fps<15, capped at
                     MAX_STEPS_PER_FRAME — then draws once via loopDraw.js's drawOnce(); floors
                     simulation at ~15 ticks/sec without changing behavior at fps>=15. Also calls
                     ui/phaseSavePopup.js's checkPhaseChange() as the last thing in every tick, not
                     just once per frame — see that file for why the ordering matters), loopDraw.js
                     (drawOnce() — pure rendering, split out of loop.js to stay under 300 lines)
  ui/                menu.js (say/updateHP/buildSub/selectAction/...), overlay.js (win/lose/reset),
                     statsDisplay.js (ticks + renders the TIME/DEATHS corner readout),
                     saveLoad.js (save/load popup — generates/applies a saveCode.js code; also
                     detects+displays a pasted-in summary key via the read-only popup; exports
                     applyDecodedSave(data), shared by both its own LOAD button and
                     autoSavePopup.js's; CLEAR KEY sends the player back to the start of phase 1,
                     not just resetting the displayed code's stats/flags),
                     phaseJump.js (jumpToPhase() — shared "reset to the start of phase N" used by
                     saveLoad.js, secretTestGui.js, and CLEAR KEY), modeSelect.js (Computer/Phone
                     gate, shown every page load; chooseMode() also calls autoSavePopup.js's
                     checkAutoSave() right after hiding the gate — not run any earlier, since the
                     gate's z-index sits above every popup and would hide it until dismissed),
                     touchControls.js (wires the on-screen d-pad to S.keys[...], phone mode only),
                     phaseSavePopup.js (exports checkPhaseChange(), called from core/loop.js; on any
                     S.phase change, pops up a save code reminder, and also persists that same code
                     to localStorage under 'ironFistBattle_autosave' for autoSavePopup.js to offer
                     back later), autoSavePopup.js (exports checkAutoSave(), called from
                     modeSelect.js's chooseMode(); checks localStorage for that key, and if present,
                     deletes it immediately — delete-on-show — and offers the decoded code back via
                     a popup with Copy/Load/Close, so closing the tab without manually saving isn't
                     a dead end), secretTestGui.js (hidden dev tool — a phase-jump popup + a P8
                     corridor-chain attack picker, unlocked only by loading the page with the
                     correct secret code as a ?k= URL param; the code is stored here only as a
                     SHA-256 hash, no visible trigger anywhere), inputBlock.js
                     (isInputBlocked() — true while any of the 5 popups above is open; checked by
                     input.js + touchControls.js so keyboard/D-pad can't drive the game underneath
                     one — CSS stacking alone only blocks mouse/touch clicks). All 5 popups +
                     #popup-backdrop (shared click-blocker for the 2 that aren't already
                     full-screen) live outside #game-wrapper, like #mode-select — see index.html
                     comments for why.
  actions/           fight.js item.js usb.js act.js mercy.js — one player action handler each
  cutscenes/         engine.js (csAdvance/csEnd) + phase2.js..phase8.js (per-phase scripts)
  boss/
    ai.js            bossAttack() dispatch
    zones.js         makeZone/scheduleZones (dispatches to zonesLegacyA/B.js)/scheduleSlashRotateZones;
                      re-exports updateZones from zonesUpdate.js
    attacks/         begin*/update* logic, one file per attack (rifle, ricochet, rapidfire, grenade,
                      possession, compulsion, blindchase, corridor, corMultiRic, corBlocks,
                      corRifleGrenade, corSpinRapid, corStompSwipe, healOrbs, corQuad, corMRS, cor10,
                      meditate, platforms, quadPhase, dropper, walls)
    render/          All canvas drawing, orchestrated by drawArena.js. Per-attack draw fns live in
                      one file each or small groups (group1/2/3Draw.js) where the original was tiny;
                      rifleGrenadeDraw.js and quadDraw.js each cover 2-3 attacks whose render
                      conditions were combined/entangled in the original and can't be split cleanly.
                      zoneEngine.js is the shared hazard-rendering loop (used by corBlocks/
                      corStompSwipe, which have no draw code of their own). playerRender.js draws the
                      player heart/hit-flash, shared across nearly every attack.
    preMeditate.js   drawPreMeditate (standalone, not part of drawArena)
  minigames/         securityScene.js (flashlight/fall cinematic before credits), credits.js
                     (scrolling credits; once done, shows the summary key — see state/saveCode.js
                     encodeSummaryKey — as the literal final screen, click-to-copy)
```

## Data flow

`main.js` loads state modules first, then core/UI, then calls `initState()` ->
`buildSub('FIGHT')` -> `loop()`. Each frame, `core/loop.js` calls `updateZones`,
the active attack's `update*()`, `updateParticles`, and `drawArena()`, which
delegates to the per-attack/per-phase render modules. Player actions and
cutscenes mutate `S`/`CS` directly; the render layer reads the result next
frame. Everything shares the one `S` object by import reference — no
message-passing layer.
