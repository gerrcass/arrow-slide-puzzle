# 03: Level select, stars, unlocks, and saved progress

**What to build:** A level-select screen with chapter grouping, per-level best stars, lock states, and a direct link back into any completed level. Best results, completion, last played, and the tutorial flag persist locally across reloads; level *n* unlocks when *n−1* is completed.

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] Level select shows all twelve levels grouped by chapter with stars, lock state, and current level emphasis.
- [ ] Only level 1 is open at first; completing a level unlocks the next; completed levels are replayable.
- [ ] Stars equal hearts remaining on a win; best stars persist and can only improve.
- [ ] A versioned local save stores best stars, completion, tutorial flags, settings, and last played; corrupt/unavailable storage falls back safely.
- [ ] Reloading restores stars and unlock state; a private-mode-style storage failure does not crash the game.
- [ ] Deep links to locked or unknown levels resolve safely.
- [ ] Save round-trip, migration/default, corrupt-data, and storage-unavailable tests pass.
