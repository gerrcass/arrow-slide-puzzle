# ADR 0002 — Removal is monotonic; the game has no dead ends

**Status:** Accepted (2026-10-27)

## Context

Many puzzle games hide a trap: a move that is legal now but makes the board unsolvable. With ribbons that only ever leave the board, that trap cannot exist. Removing a piece frees cells; it never adds an obstacle. Therefore a clear piece remains clear, and clearing it cannot make another piece less clear.

## Decision

Do not add stateful moves, temporary storage, or order penalties. The only failure mode is tapping a blocked ribbon, which costs a heart. Difficulty comes from perceiving clearance, not from guessing a hidden order.

The solver may remove any clear piece greedily. Hints may highlight any clear piece.

## Consequences

- A level is solvable iff the greedy clear loop removes every piece.
- The level generator can guarantee solvability by reverse construction (add pieces only when they can leave), then verify.
- "Which order?" is the wrong player question; "which ribbons are actually free?" is the right one. Onboarding and hints should teach that.
- Future contributors must not "fix" this by adding moves that change occupancy.
