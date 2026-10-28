# 02: Twelve curated, solver-verified levels

**What to build:** The single tangle becomes a campaign. A deterministic generator builds candidate boards by reverse construction; a solver proves every candidate; difficulty metrics place it in a chapter band. Twelve accepted levels ship with seeds and metrics, and the player can move through them in order with chapter titles and a "next level" flow.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] Level content schema includes board size, pieces, chapter, index, title, constellation reference, seed, and metrics.
- [ ] Generator is deterministic from a seed and uses reverse construction, so the reverse addition order clears the board.
- [ ] Solver clears every shipped level and detects unsolvable fixtures; tests fail on any unsolvable, out-of-bounds, overlapping, non-contiguous, or heading-inconsistent level.
- [ ] Twelve levels ship in three chapters: 6×6/6–9 pieces/2–4 initially clear; 7×7/9–12/2–3; 8×8/12–16/1–2.
- [ ] Difficulty metrics are computed and asserted against the chapter bands in tests.
- [ ] Completing a level advances to the next via a visible action; the last level has a campaign-complete state.
- [ ] A chapter interstitial or label makes the ramp legible without adding a blocking modal.
- [ ] Generator/solver/level tests and the production build pass.
