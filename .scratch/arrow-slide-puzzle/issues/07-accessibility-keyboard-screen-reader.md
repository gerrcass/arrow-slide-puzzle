# 07: Accessibility — keyboard, screen reader, assistive mode

**What to build:** The whole game is playable and understandable from the keyboard, screen readers receive meaningful names and live feedback, and an optional assistive mode exposes clear/blocked state so a nonvisual player can finish the campaign. Focus is managed in every overlay and contrast meets AA.

**Blocked by:** 04, 05, 06.

**Status:** done

- [x] Every ribbon is a focusable button with a name like "Pink ribbon, 4 cells, pointing up"; assistive mode appends clear/blocked.
- [x] Enter/Space activates; H hints; R resets; Esc closes overlays/opens settings; focus order follows the board.
- [x] Live region announces clears, collisions, hearts, hints, and wins with polite/assertive timing.
- [x] All overlays trap focus, set initial focus, restore focus on close, and support Escape.
- [x] Colour is never the only cue; focus rings are strong; text/UI meet WCAG AA; hit targets are ≥44 px at 320 px.
- [x] Assistive mode has a settings toggle and a "describe clear ribbons" action.
- [x] Automated axe checks and a keyboard-only Playwright run pass.
