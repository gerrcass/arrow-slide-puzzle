# AGENTS.md

Nana Pearl's Arrow Slide Puzzle: a static, deep-violet browser puzzle game with twelve curated levels, constellation reveals, and a local-first save. Read `README.md` for the product.

## Start here

- `GLOSSARY.md` — the domain language. Use these words.
- `docs/adr/` — decisions. **`ADR-0002` is a load-bearing invariant: removal is monotonic; do not add stateful moves.**
- `CODING_STANDARDS.md` — the review bar.
- `.scratch/arrow-slide-puzzle/spec.md` and `.scratch/arrow-slide-puzzle/issues/` — current work and acceptance criteria.
- `docs/agents/issue-tracker.md` — how work is tracked.
- `docs/agents/domain.md` — reading rules for the docs above.

## Commands

- `npm run dev` — Vite dev server.
- `npm run typecheck` — strict TypeScript.
- `npm run test` — Vitest, including solver verification of every level.
- `npm run build` — production build.
- `npm run verify` — the full local gate: check plus browser tests.
- `npm run preview` — serve the production build.
- `npm run test:e2e` — Playwright against the production preview.

The environment is the source of truth for scripts; read `package.json` before assuming a command exists.

## Working agreements

- Model policy: use **DeepSeek V4.1 Flash** for every agent in this project.
- Zero runtime dependencies. A new one needs an ADR.
- The rules engine is pure: no DOM, storage, timers, or network.
- Every rule change lands with a test, and every shipped level stays solver-verified.
- Accessibility is part of done, not a follow-up ticket.
- Evidence over assertion: capture the failing/passing command or a before/after screenshot.
