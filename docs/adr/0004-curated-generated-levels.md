# ADR 0004 — Curated generated levels, solver-verified

**Status:** Accepted (2026-10-27)

## Context

Hand-authoring twelve dense, interlocking ribbon tangles is slow and error-prone. Pure procedural generation makes difficulty and visual quality hard to guarantee.

## Decision

A seeded, offline generator builds candidate boards by reverse construction: start empty and add ribbons that can exit past the pieces already present. The reverse of the addition order is a solution. Candidates are filtered by solver verification and by difficulty metrics (board size, piece count, ribbon length, bends, initial clear count). Twelve accepted levels are committed as content, each with its seed and metrics.

A test re-runs the solver on every committed level on every CI run, and rejects overlapping cells, out-of-bounds cells, invalid headings, or metrics outside the declared band.

The generator is a development tool, not shipped runtime code.

## Consequences

- Every shipped level is provably clearable.
- Difficulty is explicit and reviewable, not vibes.
- Regenerating content is deterministic and auditable.
- The curated ladder can still be hand-tuned by changing seeds or selection thresholds.
