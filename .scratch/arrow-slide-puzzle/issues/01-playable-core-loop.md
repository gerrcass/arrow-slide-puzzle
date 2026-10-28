# 01: Playable core loop on one tangle

**What to build:** A player can open the game, see a deep-violet board with one handcrafted tangle, tap a ribbon, and watch it either slide fully off or bump and cost a heart. Three hearts, a win state, a failure/retry state, and a live HUD. This is the vertical spine every later ticket hangs from: strict TypeScript + Vite + Vitest, the pure rules engine, one SVG board renderer, and one level's worth of content.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Vite + strict TypeScript + Vitest project with `dev`, `build`, `preview`, `typecheck`, and `test` commands.
- [x] Domain engine supports pieces as ordered cell paths with a heading, full-exit clearance sweeps, removal, hearts, and win/loss, with no DOM imports.
- [x] One handcrafted level is playable by mouse, touch, and keyboard; clear ribbons animate fully off the board; blocked ribbons lurch, flash the blocker, and do not move.
- [x] HUD shows level name, three hearts, and cleared/total progress; hearts update exactly once per collision.
- [x] Win and failure overlays offer replay/retry and are focus-managed; the board locks during animation and unlocks when resolution ends.
- [x] Engine tests cover straight, bent, partially off-board, immediate block, late block, edge, single-cell, win, loss, and retry cases.
- [x] Layout fits a 320 px viewport without horizontal scrolling; a 390×844 mobile check is captured as evidence.
- [x] `typecheck`, `test`, and production build pass.
