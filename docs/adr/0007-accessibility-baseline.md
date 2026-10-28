# ADR 0007 — Accessibility baseline and assistive mode

**Status:** Accepted (2026-10-27)

## Context

The game is visual by nature: clearance depends on seeing a bent ribbon's swept footprint. Keyboard and screen-reader support still matter, and pretending the default experience is fully nonvisual would be dishonest.

## Decision

Baseline: every ribbon is a focusable button with a meaningful name, Enter/Space activates it, H hints, R resets, Esc opens the menu; focus is visible; a live region announces collisions, clears, hearts, and wins; colour is never the sole signal; reduced motion is respected and overridable.

Assistive mode (off by default) adds clear/blocked state to each ribbon's accessible name and announces the list of clear ribbons on request. It makes the game playable nonvisually at the cost of revealing the puzzle's core information.

## Consequences

- The default game preserves the visual challenge; assistive mode trades it for access.
- Accessibility is designed in, not patched on.
- Automated axe checks plus keyboard E2E runs guard the baseline.
- Copy and labels become part of the product surface and need review like any other UI.
