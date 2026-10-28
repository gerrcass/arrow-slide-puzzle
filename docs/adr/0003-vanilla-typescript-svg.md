# ADR 0003 — Vanilla TypeScript, SVG, and Vite

**Status:** Accepted (2026-10-27)

## Context

The game is one interactive board, a handful of overlays, and a small router. It has no server, no data fetching, and no complex shared state.

## Decision

Use Vite + strict TypeScript. Render the board as a single SVG with one group per piece. Use plain DOM for screens and overlays, CSS custom properties for the design system, and the Web Animations API for slides. Ship zero runtime dependencies.

Vitest covers the engine and controller. Playwright covers the browser seam.

## Consequences

- Small bundle, fast start, no framework upgrade treadmill.
- The team owns the accessibility and animation details; there is no component library to lean on.
- Rendering is deliberately imperative and isolated behind a renderer interface, so the rules stay pure and testable.
- Any new runtime dependency requires an ADR that justifies its weight.
