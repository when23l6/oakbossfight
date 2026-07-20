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
                    (352 lines — over the 300-line/file guideline; flagged rather than split,
                    since a single-page no-build-step HTML entry point has no clean equivalent
                    to JS's import/re-export for markup without adding runtime fetch()-and-inject
                    complexity for little benefit)
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
                     silently carries usedTestGui + madMode + per-phase death counts), phoneLayout.js
                     (custom D-pad/arena/dialogue position+scale overrides set via
                     ui/layoutEditor.js, persisted to localStorage separately from the save key — a
                     device/UI preference, not game progress, so CLEAR KEY and the every-join stats
                     reset above don't touch it), gameSpeed.js (custom simulation tick rate —
                     {enabled, rate, keybind} — set via ui/gameSpeedPanel.js, same localStorage-
                     separate-from-save-key treatment as phoneLayout.js; rate is clamped to
                     MIN_RATE=15..MAX_RATE=120 in setRate() itself, not by callers)
  core/              canvasRefs.js (DOM/canvas refs), particles.js, input.js (listeners), loop.js
                     (fixed-timestep accumulator: loop(now) runs updateOnce() 1+ times per rAF
                     callback — more than once if the render-frame gap implies fps<15, capped at
                     MAX_STEPS_PER_FRAME — then draws once via loopDraw.js's drawOnce(); floors
                     simulation at ~15 ticks/sec without changing behavior at fps>=15, UNLESS
                     state/gameSpeed.js's `enabled` flag is on, in which case that floor becomes a
                     hard cap at the custom rate instead (no forced minimum tick per frame, so a
                     high render fps no longer means a faster game). Also calls
                     ui/phaseSavePopup.js's checkPhaseChange() as the last thing in every tick, not
                     just once per frame — see that file for why the ordering matters), loopDraw.js
                     (drawOnce() — pure rendering, split out of loop.js to stay under 300 lines)
  ui/                menu.js (say/updateHP/buildSub/selectAction/...), overlay.js (win/lose/reset),
                     statsDisplay.js (ticks + renders the TIME/DEATHS corner readout),
                     saveLoad.js (save/load popup — generates/applies a saveCode.js code; also
                     detects+displays a pasted-in summary key via the read-only popup; exports
                     applyDecodedSave(data), shared by both its own LOAD button and
                     autoSavePopup.js's, and setBackdrop(), shared by settingsMenu.js; CLEAR KEY
                     sends the player back to the start of phase 1, not just resetting the
                     displayed code's stats/flags), settingsMenu.js (#settings-btn — visible in both
                     modes, unlike the phone-only buttons below — opens #settings-menu, currently
                     just a GAMESPEED launcher but its own popup so future settings don't have to
                     live inside the SAVE/LOAD menu; openGameSpeedFromSettings() closes this menu
                     before opening the gamespeed panel, same reason as the chooseMode() ordering
                     below — gameSpeedPanel.js's open refuses to run "underneath another popup"),
                     phaseJump.js (jumpToPhase() — shared "reset to the start of phase N" used by
                     saveLoad.js, secretTestGui.js, and CLEAR KEY), modeSelect.js (Computer/Phone
                     gate, shown every page load; chooseMode() also calls autoSavePopup.js's
                     checkAutoSave() right after hiding the gate — not run any earlier, since the
                     gate's z-index sits above every popup and would hide it until dismissed; also
                     calls layoutEditor.js's applyPhoneLayout() when phone mode is chosen; exports
                     getPhoneScale(), the last #game-wrapper fit-to-screen scale, which
                     layoutEditor.js needs to convert a screen-pixel drag into local movement),
                     touchControls.js (wires the on-screen d-pad to S.keys[...], phone mode only),
                     layoutEditor.js (phone-mode-only: drag-to-move + resize-handle logic for the
                     D-pad, #gamespeed-btn, #arena-layout-wrap, and #dialogue-layout-wrap — the
                     latter two are dedicated wrappers around #arena-section and #dialogue, since
                     core/loopDraw.js already writes the arena's own .style.transform every frame
                     for gameplay VFX and ui/menu.js's say() replaces #dialogue's children wholesale
                     on every line, either of which would otherwise fight/destroy a persistent layout
                     transform or resize handle living directly on those two elements (#dpad and
                     #gamespeed-btn have no such conflict, so they're targeted directly); exports
                     isLayoutEditActive(), checked by inputBlock.js so normal input pauses while
                     editing, and applyPhoneLayout(), called from modeSelect.js's chooseMode()),
                     gameSpeedPanel.js (GAMESPEED popup — +/- the custom tick rate, toggle it on/off,
                     and on computer rebind which key opens the panel — own dedicated keydown
                     listener rather than folding into core/input.js's, since isInputBlocked()
                     already makes that whole handler bail out while this panel/rebind-capture is
                     open; #gamespeed-btn opens it directly on phone instead, no keyboard there;
                     exports isGameSpeedPanelOpen(), checked by inputBlock.js),
                     phaseSavePopup.js (exports checkPhaseChange(), called from core/loop.js; on any
                     S.phase change, pops up a save code reminder, and also persists that same code
                     to localStorage under saveCode.js's AUTOSAVE_KEY for autoSavePopup.js to offer
                     back later), autoSavePopup.js (exports checkAutoSave(), called from
                     modeSelect.js's chooseMode(); checks localStorage under that same key and, if
                     present, offers the decoded code back via a popup with Copy/Load/Close — the
                     entry is left in place afterward, not deleted, so it keeps being offered on
                     every future join regardless of which URL/link is used, until it's naturally
                     overwritten by a newer phase-change save or explicitly wiped by CLEAR KEY),
                     secretTestGui.js (hidden dev tool — a phase-jump popup + a P8
                     corridor-chain attack picker, unlocked only by loading the page with the
                     correct secret code as a ?k= URL param; the code is stored here only as a
                     SHA-256 hash, no visible trigger anywhere), inputBlock.js
                     (isInputBlocked() — true while any of the 6 popups above is open, or while
                     layoutEditor.js's edit mode or gameSpeedPanel.js's panel is active; checked by
                     input.js + touchControls.js so keyboard/D-pad can't drive the game underneath
                     one — CSS stacking alone only blocks mouse/touch clicks). All 6 popups +
                     #popup-backdrop (shared click-blocker for the 3 that aren't already
                     full-screen) + the layout editor's toolbar live outside #game-wrapper, like
                     #mode-select — see index.html comments for why.
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
