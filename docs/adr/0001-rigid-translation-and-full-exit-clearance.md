# ADR 0001 — Rigid translation with full-exit clearance

**Status:** Accepted (2026-10-27)

## Context

A ribbon is bent. Two readings of "slide in the direction it points" are possible:

1. The whole ribbon translates rigidly along its heading.
2. The ribbon crawls along its own curve, following the path.

The shipping game's intertwined S/U ribbons read as rigid bodies, and the brief describes a forward path being blocked by another piece.

## Decision

A slide translates the entire piece by one cell at a time along its heading. The clearance sweep continues until the piece is entirely outside the board. If any intermediate translation overlaps another piece, the slide is blocked.

## Consequences

- Bent and long ribbons have a large, non-obvious swept area. This is the core "look twice" moment.
- Clearance is O(cells × steps × pieces), trivially fast.
- A ribbon can look clear at its tip and still clip a piece several cells later.
- Collision feedback can point at the first blocking offset, which makes the rule legible.
