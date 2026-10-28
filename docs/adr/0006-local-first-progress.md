# ADR 0006 — Local-first progress

**Status:** Accepted (2026-10-27)

## Context

The game is a static site. Accounts, sync, and analytics are out of scope. Players still expect their stars, gallery, settings, and tutorial state to survive a reload.

## Decision

Persist a single versioned record in `localStorage`: best stars per level, completion timestamps, gallery unlocks, settings (sound, reduced motion, assistive mode, tips), and tutorial flags. Reads and writes are wrapped; unavailable or corrupt storage degrades to an in-memory session. A schema version gates migrations.

No runtime network calls, no cookies, no tracking.

## Consequences

- Zero backend cost and no privacy surface.
- Progress is per browser profile; clearing site data resets it.
- The save schema is a public contract and needs a migration test whenever it changes.
- Sharing progress means sharing a screenshot, not a link.
