<img src="assets/icon.svg" width="64" height="64" alt="" />

# Nana Pearl’s Arrow Slide Puzzle

A quiet, deep-violet browser puzzle. Tap a ribbon that can slide all the way
off the board; a blocked ribbon bumps and costs one heart. Three hearts, up to
three stars, and a constellation waiting underneath every tangle.

**Status:** the core loop, the twelve-level campaign, and local progress are in
progress on `feat/arrow-slide-puzzle`. See `.scratch/arrow-slide-puzzle/spec.md`
for the full product and `docs/adr/` for the decisions.

## Development

```sh
npm install
npm run dev        # Vite dev server
npm run typecheck  # strict TypeScript
npm run test       # Vitest: engine, solver, content, progress
npm run build      # production build
npm run preview    # serve the production build
```

## Where things live

- `src/engine/` — pure rules: geometry, full-exit clearance, attempt state,
  greedy solver, metrics. No DOM, storage, clocks, or randomness.
- `src/content/` — chapter bands, constellation data, and the committed levels.
- `src/generator/` — the offline, seeded reverse-construction generator.
- `src/app/` — hash router, screens, SVG renderer, progress store.
- `src/styles/` — tokens and the deep-violet visual system.
- `docs/evidence/` — mobile screenshots captured from the built app.

The rule engine is the source of truth. Read `GLOSSARY.md` and `ADR-0002`
before changing rules: removal is monotonic and the game has no dead ends.
