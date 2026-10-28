# ADR 0008 — Static hosting, hash routing, and a hand-rolled service worker

**Status:** Accepted (2026-10-27)

## Context

GitHub Pages serves static files from a subpath and has no rewrite rules. Deep links must work, and the game should load offline after the first visit without adding a PWA framework.

## Decision

Set Vite's base to `./` and route with URL hashes (`#/play/3`), so every route resolves to `index.html` on any static host. Ship a small manifest and a hand-written service worker that precaches the shell and caches hashed assets cache-first, with a network fallback. Register the worker only in production builds.

## Consequences

- Deep links, refreshes, and the GitHub Pages subpath all work with no server.
- Offline play works after one visit and updates on the next visit.
- No Workbox dependency or build magic; the caching strategy is small enough to audit.
- Hash URLs are less pretty than paths, which is an acceptable trade for zero infrastructure.
