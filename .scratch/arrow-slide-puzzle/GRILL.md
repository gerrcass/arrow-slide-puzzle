# Grill session — Nana Pearl's Arrow Slide Puzzle

**Date:** 2026-10-27
**Format:** `/grill-with-docs`, three rounds.
**Mode:** The brief explicitly asks the facilitator to choose the recommended answer for every question rather than waiting on the user. The recommendations below were accepted and became the ADRs and glossary.

---

## Research notes (facts, not decisions)

Sources:

- [Arrow Slide Puzzle on Google Play](https://play.google.com/store/apps/details?id=com.cleverapps.arrowsaway) — Slimmerbits LLC; "slide arrows across the board to clear the field and reveal a hidden picture"; tap an arrow to move it in the direction it points; empty spaces avoid collisions.
- [Arrow Slide Puzzle on the App Store](https://apps.apple.com/us/app/arrow-slide-puzzle/id6758202109) — same rules, clear-the-board reveal.
- [Addicting Games listing](https://www.addictinggames.com/puzzle/arrow-slide-puzzle) — four-step instructions and "hundreds of puzzles" positioning.
- [Play Store screenshots](/tmp/opencode/refs) — the shipping mobile build uses a warm off-white board, glossy multicoloured intertwined ribbons, a level-number pill, and three X-shaped life markers.
- [Full walkthrough, levels 1–15](https://vimeo.com/1177893829) — difficulty ramps from short straight arrows to dense S/U-shaped entanglements; collisions are the failure mode.
- [Arrow Puzzle help centre](https://arrowpuzzleios.easybrain.com/hc/en-us/articles/10064624659738-How-do-I-play) — corroborates the "clear path / tap in order / lose a life" family of rules.

The brief overrides the shipping build's visual skin: **deep purple, hearts, an elderly guide, and a visible hidden-picture payoff**. The mechanics follow the researched family.

**Key mechanical fact discovered while modelling:** removing a piece only ever frees space. A piece that is clear now stays clear, and removing it cannot make another piece less clear. Therefore a board has **no dead ends**: any sequence of legal slides that reaches the end is a solution, and the puzzle lives in *perceiving* which ribbons are clear, not in guessing an order. The design leans into that rather than inventing an artificial order penalty.

---

## Round 1 — the axes

❓ **Q1 — Identity: clone or original?**
Faithfully copy the shipping game's art, or reproduce the mechanic with an original identity?

➡️ **Original identity, faithful mechanic.** The brief's purple/guide/hidden-picture direction is already distinct from the shipping build. We use original SVG art, an original guide ("Nana Pearl"), original constellation rewards, and no copied assets. The *rules* are the genre.

---

❓ **Q2 — Slide semantics: rigid translation or path-following?**
Does a bent ribbon slide as one rigid body in its heading direction, or does it crawl cell-by-cell along its own curve?

➡️ **Rigid translation.** The whole piece translates in the arrowhead direction; it exits if every intermediate offset is free. This matches the interlocked-ribbon look and gives bent pieces a genuinely surprising footprint. It also makes the collision preview honest.

---

❓ **Q3 — Failure economy: hearts, global lives, or timer?**
Global lives across the campaign, per-attempt hearts, or a countdown?

➡️ **Three hearts per attempt.** A collision costs one heart; at zero the attempt fails and can be retried immediately. No global life economy, no timer, no energy gates. Stars are the hearts you kept, so a flawless clear is 3 stars.

---

❓ **Q4 — Content model: campaign, daily, or endless?**
Fixed campaign, date-seeded daily, or endless procedural boards?

➡️ **A fixed 12-level campaign in three chapters.** Levels are generated offline from seeds, curated for measured difficulty, and committed. Daily/endless is explicitly out of scope for v1 so the shipped content can be verified and polished. The generator stays in the repo as a tool.

---

❓ **Q5 — Visual direction**
Follow the shipping build's light minimal look, or the brief's deep purple?

➡️ **Deep purple twilight.** Glossy pastel ribbons (lavender, pink, honey, cyan, mint, coral) over a dark violet board, with a faint lattice, soft bloom, and constellations hiding under a frosted overlay. Warm cream guide bubbles. This is the brief and gives the reveal a reason to exist.

---

❓ **Q6 — Stack**
React/Next, a game engine, or vanilla TypeScript?

➡️ **Vanilla TypeScript + SVG + Vite.** The game is one SVG board and a small state machine. A framework would add weight without buying anything. Zero runtime dependencies, strict TypeScript, Vitest, Playwright for the browser seam. Deployed as a static site on GitHub Pages.

---

## Round 2 — the game

❓ **Q7 — Board geometry and piece shapes**
Free-form vector ribbons, or pieces on a square grid?

➡️ **Square grid, orthogonal self-avoiding ribbons.** Boards are 6×6 to 8×8; a piece is 1–8 cells, never shares a cell, and its heading is the last segment's direction. Corners render round; the hit target is the ribbon plus a forgiving halo. The grid makes generation, collision, and screen-reader descriptions tractable.

---

❓ **Q8 — Clearance rule**
Is a piece clear when the *next* cell is empty, or only when it can travel all the way out?

➡️ **Full-exit clearance.** The engine simulates every intermediate translation until the piece is entirely off-board; any overlap with another piece means blocked. A long bent ribbon can look free at the tip and still clip something three cells later. That is the core "look twice" moment.

---

❓ **Q9 — Dead ends**
Should a legal move ever be a trap that makes the board unsolvable?

➡️ **No dead ends.** Removal is monotonic, so a clear piece is always safe to remove. The player's error is tapping a *blocked* ribbon, which costs a heart; there is no hidden order puzzle. This is stated in the domain docs so nobody "fixes" it later by adding stateful moves. Difficulty comes from visual entanglement, long footprints, and a small number of initially clear ribbons.

---

❓ **Q10 — Difficulty ladder**
How do 12 levels ramp, and how is "difficulty" measured?

➡️ **Three chapters of four.** Metrics: board size, piece count, ribbon length, bend count, number of ribbons clear at the start, total solution length, and the share of pieces whose clearance is non-obvious. Chapter 1 (6×6, 6–9 pieces, 2–4 clear at start) teaches; chapter 2 (7×7, 9–12, 2–3 clear) bends; chapter 3 (8×8, 12–16, 1–2 clear) entangles. Levels are accepted only if the solver clears them and the metrics fall in band.

---

❓ **Q11 — Stars and hints**
What earns stars, and do hints cost anything?

➡️ **Stars = hearts remaining.** Complete with 3 hearts → 3 stars, 2 → 2, 1 → 1; fail at 0. The best result per level persists. Hints are unlimited and free: pulse one currently-clear ribbon (not necessarily the *only* one). Accessibility outranks artificial scarcity.

---

❓ **Q12 — Guide behaviour**
A modal tutorial wall, a chatty mascot, or something in between?

➡️ **Nana Pearl, contextual and dismissible.** She appears on a first-run card, then in a small speech bubble for a handful of teachable moments: first collision, first near-empty board, first win, out of hearts. She is never blocking during play, has a "skip tips" switch, and can be replayed from settings. Her voice is warm, brief, and never scolding.

---

## Round 3 — craft and delivery

❓ **Q13 — Hidden picture reveal**
Show the art only at the end, or reveal it progressively?

➡️ **Progressive reveal, full reveal at the end.** Each cleared ribbon punches a soft hole in a frosted overlay along the path it vacated, exposing a constellation. When the last ribbon leaves, the frost dissolves, the constellation lines draw themselves, stars twinkle, and the piece name appears. The art is the reward for the whole attempt, not just the final tap.

---

❓ **Q14 — Accessibility baseline**
Keyboard only, or full assistive support?

➡️ **Full baseline plus an assistive mode.** Every ribbon is a focusable button with a name; Enter/Space slides; H hints, R resets, Esc opens the menu. A live region announces hearts lost, ribbons cleared, and wins. `prefers-reduced-motion` is honoured and overridable. Colour is never the only carrier of meaning. An optional assistive mode adds "clear/blocked" to ribbon labels for screen-reader players, because the default game is intensely visual.

---

❓ **Q15 — Persistence**
Backend accounts, cloud sync, or local-first?

➡️ **Local-first only.** Versioned `localStorage` record for best stars, completion, gallery, settings, and tutorial flags. Wrapped so private mode and quota failures degrade to a session-only game. No accounts, no tracking, no network calls at runtime.

---

❓ **Q16 — Test seams**
Test every component, only the engine, or only the browser?

➡️ **One high domain seam plus one browser seam.** The pure engine (geometry, clearance, scoring, solver, generator) gets exhaustive unit tests and is the primary seam. The controller gets state-transition tests with a fake renderer. Playwright covers the real UI: tutorial, keyboard play, collision, solve, persistence, mobile viewport, reduced motion. Level data is verified by the solver on every CI run. No snapshots of SVG markup.

---

❓ **Q17 — Budgets**
What does "done" mean for speed and weight?

➡️ **No runtime dependencies; ≤150 KB gzipped initial JS+CSS; 60 fps slide animations; Lighthouse mobile ≥95 in performance, accessibility, best practices, and SEO; no layout shift after fonts load; works at 320 px wide.** The font is self-hosted and subset; art is inline SVG. PWA offline after the first visit.

---

❓ **Q18 — Delivery**
How does the work become real?

➡️ **GitHub issues + one integration branch + PR + merge + Pages.** A spec issue, eight tracer-bullet tickets with blocking edges and `ready-for-agent` labels, a feature branch, a PR that closes the tickets and carries before/after evidence, merge to `main`, then the Pages workflow deploys. No open issues or PRs left behind. README gets the live link and a representative screenshot.

---

❓ **Q19 — Tutorial depth**
Teach by tooltip, by a scripted level, or by a modal?

➡️ **A scripted first level, lightly gated.** Level 1 opens with Nana Pearl's three-beat intro (tap a clear arrow → the board clears a path → hearts are for mistakes). The beats advance on real actions, not a timer, and are skippable. The same beats never auto-repeat after the first completion; settings can replay them.

---

❓ **Q20 — Out of scope**
What are we deliberately not building?

➡️ **No accounts, leaderboards, ads, IAP, timers, daily/endless mode, level editor, multiplayer, backend, native wrappers, localisation, or copied assets.** One excellent campaign, not a content platform.

---

## Resulting design tree

```text
Nana Pearl's Arrow Slide Puzzle
├── Identity
│   ├── Original art + guide + constellations
│   └── Faithful ribbon-slide rules
├── Rules
│   ├── Square grid, orthogonal ribbons, heading from last segment
│   ├── Rigid translation, full-exit clearance
│   ├── Three hearts per attempt; collision = -1
│   ├── Monotonic removal → no dead ends
│   └── Stars = hearts remaining; free hints
├── Content
│   ├── 12 curated levels, 3 chapters × 4
│   ├── Seeded offline generator + solver verification
│   └── One constellation per level
├── Experience
│   ├── Deep purple twilight, glossy pastel ribbons
│   ├── Progressive frost reveal → full constellation
│   ├── Nana Pearl contextual coaching
│   ├── Level select + constellation gallery
│   └── Synthesised sound, settings, reduced motion
├── Craft
│   ├── Vanilla TS + SVG + Vite, zero runtime deps
│   ├── Pure engine + controller + browser seams
│   ├── Keyboard, screen reader, assistive mode
│   └── 60 fps, ≤150 KB gzip, Lighthouse ≥95
└── Delivery
    ├── GitHub issues → integration branch → PR → merge
    └── GitHub Pages + PWA + README evidence
```

## Domain documents produced

- `GLOSSARY.md` — the shared vocabulary.
- `docs/adr/0001-rigid-translation-and-full-exit-clearance.md`
- `docs/adr/0002-removal-is-monotonic.md`
- `docs/adr/0003-vanilla-typescript-svg.md`
- `docs/adr/0004-curated-generated-levels.md`
- `docs/adr/0005-progressive-frost-reveal.md`
- `docs/adr/0006-local-first-progress.md`
- `docs/adr/0007-accessibility-baseline.md`
- `docs/adr/0008-static-hosting-and-hash-routing.md`

The frontier is empty: every branch above has a decision, an owner, and a testable acceptance surface. The spec synthesises this session without further interview.
