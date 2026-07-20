// Tick-based alternative to setTimeout() for gameplay pacing that should
// scale with gamespeed (state/gameSpeed.js) instead of staying tied to
// wall-clock time. Callbacks registered here fire after N logic TICKS
// have elapsed (core/loop.js calls tickTimers() once per tick), not N
// milliseconds — so a "300ms" attack windup takes proportionally less real
// time once gamespeed is cranked up, same as everything else already
// governed by the tick loop (attack timers, i-frames, etc.), instead of
// staying a fixed real-world pause no matter how fast the game is set to
// run.
const pending = [];

// ms is calibrated against a 60-ticks/sec reference — this project's
// frame-based counters (S.pHitFlash=30, S.atkDur=190, etc.) were already
// implicitly calibrated against ~60fps long before gamespeed existed, so
// reusing that same baseline keeps every converted "300ms" call site
// meaning the same real-world duration it always did whenever gamespeed is
// off (the default floor only kicks in below 15fps; render is usually
// close enough to 60 that this baseline holds).
export function msToTicks(ms){
  return Math.max(1, Math.round(ms / 1000 * 60));
}

export function scheduleTicks(ticks, callback){
  pending.push({ ticks, callback });
}

// Called once per logic tick from core/loop.js's updateOnce(), gated the
// same way as the rest of active simulation there (paused while a popup is
// open) — an attack windup shouldn't keep counting down underneath a save
// menu any more than the attack itself would.
export function tickTimers(){
  for(let i = pending.length - 1; i >= 0; i--){
    const p = pending[i];
    p.ticks--;
    if(p.ticks <= 0){
      pending.splice(i, 1);
      p.callback();
    }
  }
}
