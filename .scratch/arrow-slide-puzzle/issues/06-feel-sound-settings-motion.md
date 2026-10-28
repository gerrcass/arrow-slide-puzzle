# 06: Feel — sound, settings, motion, responsive polish

**What to build:** The game feels tactile on first tap: synthesised slide, bump, heart, and win sounds; a persistent mute; a settings panel for sound, motion, tips, and reset progress; reduced-motion handling; and a responsive layout that is comfortable from 320 px phones to desktop.

**Blocked by:** 03.

**Status:** done

- [x] Web Audio synthesises slide (scaled by travel), bump, heart-loss, UI tick, and win arpeggio; context unlocks on first gesture; mute persists.
- [x] Settings panel exposes sound, motion (system/reduced/full), tips, replay tutorial, and reset all progress with a double confirm.
- [x] `prefers-reduced-motion` is honoured automatically and can be overridden; reduced motion removes shake, confetti, and long travel but keeps state feedback.
- [x] Board, HUD, overlays, and guide fit 320 px width and 390×844 with safe-area padding; desktop is centred with a max board size.
- [x] Self-hosted display font with a metric-compatible fallback and no layout shift; design tokens cover colour, spacing, radius, and elevation.
- [x] Hover/focus lift, heart animation, and win confetti are in place and cheap; no runtime dependency is added.
- [x] Settings persistence and motion-mode tests pass; a reduced-motion browser run is captured as evidence.
