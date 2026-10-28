# Spec — Nana Pearl's Arrow Slide Puzzle

**Status:** implemented
**Source:** `.scratch/arrow-slide-puzzle/GRILL.md`
**Domain vocabulary:** `GLOSSARY.md`
**Decisions:** `docs/adr/0001`–`0008`

## Challenge objective

Ship a game that feels like a small studio release, not a demo: **twelve curated, solver-verified levels** across three chapters, each hiding an original constellation; glossy ribbon-arrows on a deep-violet board; three hearts and a legible collision rule; Nana Pearl's contextual coaching; stars, level select, a constellation gallery, local-first progress, synthesised sound, keyboard and screen-reader support, reduced motion, offline PWA play, and a zero-runtime-dependency build under 150 KB gzipped — deployed to GitHub Pages, evidenced in the README, and guarded by unit, solver-verification, and browser tests in CI.

## Problem Statement

Casual puzzle players want a short-session game that is beautiful, fair, and immediately understandable on a phone or laptop. The arrow-slide genre delivers a satisfying loop — read the tangle, spot a clear ribbon, watch it leave — but web clones tend to be visually rough, ambiguous about why a move failed, punishing without teaching, and inaccessible or unusable offline. Players need a version that makes the rule legible, gives them a reason to keep playing, and respects their time and abilities.

## Solution

A static browser game with a single, honest rule: **tap a ribbon whose path is clear; it slides off the board. If anything is in the way, it bumps and costs a heart.** Players clear twelve tangles, one per constellation, with three hearts per attempt and up to three stars for a flawless clear. Nana Pearl teaches the rule in the first minute and appears only at teachable moments afterwards. Every cleared ribbon peels back a frosted layer to reveal a constellation; finishing the board completes the picture and adds it to the gallery. Progress, best stars, and settings persist locally. The whole experience installs as a PWA and works offline after the first visit.

## User Stories

### First run and learning

1. As a first-time player, I want a short, skippable introduction from Nana Pearl, so that I understand tapping, clear paths, and hearts before I lose one.
2. As a first-time player, I want the tutorial beats to advance when I actually clear a ribbon or bump one, so that I learn by playing rather than reading a wall of text.
3. As a first-time player, I want the first level to be small and forgiving, so that I can succeed in under a minute.
4. As a returning player, I want the tutorial not to replay automatically, so that I can get straight to the puzzle.
5. As a player, I want to replay the tutorial from settings, so that I can refresh the rules without creating a new save.

### Reading the board

6. As a player, I want every ribbon to point clearly in one of four directions, so that I can predict where it will go.
7. As a player, I want bent ribbons to read as one rigid piece, so that I understand what "forward" means.
8. As a player, I want the board to show my hearts, level name, and cleared/total progress at a glance, so that I always know the stakes.
9. As a player, I want the board to fit my screen without scrolling or accidental zoom, so that one-handed mobile play is comfortable.
10. As a player, I want colours and shapes to make ribbons distinguishable without relying on colour alone, so that colour-vision differences do not block me.

### Sliding and failing

11. As a player, I want to tap or click a clear ribbon and watch it slide fully off the board, so that the core interaction feels satisfying.
12. As a player, I want a blocked ribbon to visibly bump into the blocker and return, so that the failure is explained by the animation.
13. As a player, I want a collision to cost exactly one heart, so that the rule is predictable.
14. As a player, I want the blocker to flash and the heart to animate away, so that I can see which ribbon caused the collision.
15. As a player, I want a small screen shake and a distinct sound on collision, so that feedback is immediate even if I looked away.
16. As a player, I want to retry instantly after running out of hearts, so that I can apply what I learned without friction.
17. As a player, I want completing with all three hearts to earn three stars, two hearts two stars, and one heart one star, so that flawless play is rewarded.
18. As a player, I want my best star result to persist, so that replaying a level can improve but never damage my record.
19. As a player, I want to reset the current attempt at any time, so that I can start over deliberately.
20. As a player, I want a free hint that pulses a clear ribbon, so that I can get unstuck without losing a life or a star.

### Progression and collection

21. As a player, I want a level select that shows chapter, level, best stars, and lock state, so that I know where I am and what is next.
22. As a player, I want levels to unlock in order, so that the difficulty ramp is guaranteed.
23. As a player, I want to replay any completed level, so that I can chase three stars.
24. As a player, I want each clear to punch a hole in the frost and expose part of a constellation, so that progress is visible during play.
25. As a player, I want the final ribbon to trigger a full constellation reveal with its name and my stars, so that completion feels like a reward.
26. As a player, I want a gallery of collected constellations, so that I can revisit the art I earned.
27. As a player, I want uncollected gallery entries shown as silhouettes with a hint of their name, so that I know there is more to find.
28. As a player, I want a clear "next level" action after a win, so that I can keep the session flowing.

### Nana Pearl

29. As a player, I want Nana Pearl to explain hearts the first time I lose one, so that I understand the cost without being scolded.
30. As a player, I want her to react to a win and to running out of hearts, so that the game has warmth.
31. As a player, I want her tips to appear in a small bubble that never blocks the board, so that I can ignore them and keep playing.
32. As a player, I want to turn tips off and back on in settings, so that the guide never becomes noise.

### Feel, sound, and control

33. As a player, I want soft, synthesised slide, bump, heart, and win sounds, so that the game feels tactile without downloading audio.
34. As a player, I want a persistent mute control, so that I can play quietly.
35. As a player, I want a settings panel with sound, motion, assistive mode, tips, and reset progress, so that the experience fits me.
36. As a player with motion sensitivity, I want reduced motion respected automatically and overridable, so that slides and reveals stay comfortable.
37. As a player, I want quick keyboard shortcuts for hint and reset, so that desktop play does not require the mouse.
38. As a player, I want the app to remember my settings, so that I do not reconfigure it every visit.

### Accessibility

39. As a keyboard player, I want to tab to each ribbon and activate it with Enter or Space, so that I can play without a pointer.
40. As a screen-reader user, I want each ribbon announced with its colour, heading, and length, so that I can build a mental model of the board.
41. As a screen-reader user, I want an optional assistive mode that announces clear/blocked state, so that the game is completable nonvisually.
42. As a screen-reader user, I want live announcements for clears, collisions, hearts, and wins, so that I receive feedback after every action.
43. As a keyboard or screen-reader user, I want focus to stay visible and modals to trap and restore focus, so that I never lose my place.
44. As a player, I want text and UI to meet WCAG AA contrast, so that the game is readable in poor light.
45. As a player using a small screen, I want tap targets of at least 44 px and safe-area padding, so that I do not mis-tap.

### Reliability and delivery

46. As a returning player, I want stars, unlocks, gallery, and settings to survive reloads, so that progress feels real.
47. As a player in private mode, I want the game to keep working for the session even when storage fails, so that nothing crashes.
48. As an offline player, I want the game to open and play after one visit, so that a commute without signal is not a dead end.
49. As a visitor on a slow connection, I want a fast first paint and no layout shift, so that the game feels light.
50. As the developer, I want every level verified by the solver in CI, so that no unsolvable board can ship.
51. As the developer, I want typecheck, unit tests, and browser tests on every push, so that regressions are caught before merge.
52. As the developer, I want a one-command local dev loop and a one-command production build, so that iteration stays cheap.
53. As a visitor to the repository, I want a README with a live link and a representative screenshot, so that I can play and understand the project immediately.
54. As the maintainer, I want the game deployed automatically from `main`, so that shipping is boring.

## Implementation Decisions

### Domain model

- A **level** is a rectangular board, an ordered list of pieces, a constellation, a chapter, an index, and a title.
- A **piece** is a stable id, an ordered self-avoiding path of grid cells (tail → head), a heading, a colour token, and a cell length. Pieces never share a cell.
- A **board state** is the immutable set of remaining pieces plus the current attempt's hearts. Cleared pieces are removed by id.
- A **clearance sweep** translates the piece one cell at a time along its heading until every cell is outside the board. The first overlap with a remaining piece at any offset makes the move blocked. A successful sweep returns the number of steps to full exit for animation timing.
- **Removal is monotonic** (`ADR-0002`). No move changes occupancy other than removing a piece. There are no dead ends; hints may choose any clear piece.
- An **attempt** starts at three hearts. A collision decrements once and never moves a piece. A clear records the path for the reveal and increments cleared count. Zero hearts ends the attempt in failure; zero remaining pieces ends it in a win.
- **Stars** equal hearts remaining on a win. Best stars per level are saved monotonically.
- The **controller** is a pure state machine: `idle → resolving → idle | won | lost`, with actions `tap`, `hint`, `reset`, `retry`, `next`. It exposes an event list for the renderer, the audio layer, and the live region. Animation completion is signalled back as an event; tests can drain the queue synchronously.

### Content and generation

- Twelve levels in three chapters of four. Chapter 1 is 6×6 with 6–9 pieces and 2–4 initially clear; chapter 2 is 7×7 with 9–12 pieces and 2–3 clear; chapter 3 is 8×8 with 12–16 pieces and 1–2 clear.
- The generator uses reverse construction: add a ribbon only if it can exit past the pieces already placed. The reverse addition order is a solution. Candidates are filtered by solver and metrics, and the accepted twelve are committed with seeds and metrics.
- Each level has one original constellation illustration, a name, and a short caption. Art is inline SVG data, not remote assets.
- Constellation art uses a small shared visual language: a nebula wash, gold/cyan line work, star nodes, and optional silhouette accents. Each must be recognisable at gallery-card size.
- Level data and art are public content modules with a stable schema; tests validate bounds, contiguity, self-avoidance, heading consistency, uniqueness of ids, and solvability.

### Rendering

- One SVG board, one `<g>` per ribbon, a frost mask layer beneath, and a background nebula. Ribbons are round-joined paths with a soft drop shadow, a darker underside, a main gradient, and a small specular highlight. The arrowhead is a filled triangle aligned to the last segment.
- Board sizing is responsive: the playfield is the largest square that fits the available space, with a minimum tap halo per ribbon even on dense boards. Cell size is derived from the viewport.
- Slot layout: header (back, level title, hearts, settings), board, footer (hint, reset). A chapter accent tints the frame.
- Screens are DOM: home, level select, play, gallery. Hash routes: `#/`, `#/levels`, `#/play/:index`, `#/gallery`. Modals: settings, tutorial card, win, failure, confirm reset.
- Transition between levels preserves the board frame to avoid layout shift.
- The reveal mask uses `mask` with white holes punched along cleared ribbon paths. On win, the remaining frost fades, constellation lines draw with `stroke-dashoffset`, stars pop, and confetti plays (unless reduced motion).
- Nana Pearl is an original inline-SVG portrait with a small set of expressions (neutral, warm, concerned, delighted) and a cream speech bubble. Copy is short and warm.
- Sound is synthesised with Web Audio: a short filtered whoosh scaled by slide length, a low bump, a heart-loss blip, a soft UI tick, and a five-note win arpeggio. The audio context is created on the first gesture. Mute is persisted.
- All animation respects `prefers-reduced-motion` and the in-app motion setting; reduced motion keeps state changes but removes shake, confetti, and long travel.

### Interaction

- A ribbon is a single hit target across its stroke and arrowhead, with a generous invisible halo. Hover/focus lifts it slightly and shows a subtle glow.
- Tapping a resolving board is ignored. A blocked slide plays a short lurch toward the blocker (never changing occupancy), flashes the blocker, shakes the heart row, announces the collision, and returns.
- A clear slide animates the ribbon off-board along its heading, fades it, punches the frost, updates progress, then returns to idle. Win detection happens after the last animation.
- Keyboard focus order follows piece order. Enter/Space activates. `H` hints, `R` resets (with confirm only if at least one clear has occurred and hearts remain), `Esc` closes overlays or opens settings.
- Hint pulses a clear ribbon and announces it; it does not auto-solve.
- Reset/retry are always available and restore full hearts. Leaving a level mid-attempt is allowed; progress is only saved on completion.
- Settings persist: sound on/off, motion system/reduced/full, assistive mode on/off, tips on/off, replay tutorial, reset all progress (double confirm).
- Assistive mode adds clear/blocked to ribbon labels and exposes a "describe clear ribbons" action.

### Persistence and state

- A versioned save record: schema version, best stars and completion timestamp per level, gallery unlocks derived from completions, settings, tutorial flags, and last played level.
- Guarded storage adapter; failures fall back to memory. Corrupt data is discarded with a safe default. Migrations are explicit.
- Level unlocking: level 1 open; level *n* open when level *n−1* is completed. The gallery unlock follows completion, not stars.
- URL hash is the source of truth for the current screen; an unknown route redirects home. Direct links to locked levels show the level-select lock state.

### Accessibility

- Every ribbon is `role="button"`, `tabindex="0"`, with an accessible name like "Pink ribbon, 4 cells, pointing up." Assistive mode appends "clear" or "blocked."
- The board container has a label and instructions; the live region is polite for clears and assertive for collisions and wins.
- Overlays use native `<dialog>` semantics or equivalent focus management: initial focus, trap, restore, and Escape.
- Colour is never the only cue: headings are shape; focus is a thick light ring; blocked feedback has motion, sound, and text.
- Hit targets ≥44 px at the smallest supported viewport; layout supports 320 px width and safe-area insets.
- Text meets AA; decorative art is hidden from assistive tech; constellation art has a text alternative with its name and caption.

### Performance and hosting

- Zero runtime dependencies. Self-hosted, subsetted display font with `font-display: swap` and a metric-compatible fallback. Total initial JS+CSS ≤150 KB gzipped.
- Static build with a relative base; GitHub Actions deploys `main` to GitHub Pages.
- A hand-written service worker precaches the shell and caches hashed assets cache-first, with navigation fallback. Registered only in production.
- Manifest, theme colour, SVG favicon, 192/512 PNG icons, and an apple touch icon.
- SEO/identity: title, description, Open Graph tags, and a social image.

### Delivery

- One integration branch, a spec issue, and eight ticket issues with `ready-for-agent`.
- The PR closes all ticket issues, includes a summary diagram and before/after evidence, and is merged only when CI is green.
- After merge: delete branches/worktrees, confirm no open issues or PRs, update README with the live URL and screenshot, and verify the deployed site.

## Testing Decisions

Good tests assert **observable domain behaviour**, not implementation shape. A test should fail when the rule changes and pass when the rendering is refactored. Use deterministic seeds and named level fixtures. Do not snapshot SVG markup or CSS.

Primary seam — **pure engine**:

- Geometry: bounds, contiguity, self-avoidance, heading from the final segment, path-to-SVG independence.
- Clearance: straight, bent, partially off-board, blocked at first offset, blocked several offsets later, fully exiting, single-cell pieces, pieces against every edge.
- Board rules: hearts, collision does not mutate pieces, clear removes exactly one piece, stars, failure at zero, win at zero pieces, reset/retry.
- Solver: greedy clearing is sound; unsolvable fixtures are detected; accepted levels return a full order.
- Generator: deterministic by seed; every produced level is solvable; reverse order solves; difficulty metrics are computed as specified.
- Content: every committed level is in bounds, non-overlapping, heading-consistent, has valid art/name, and meets its chapter's metric band.
- Progress: unlocking, best-star monotonicity, gallery derivation, persistence round-trip, corrupt save fallback, storage-unavailable fallback.

Second seam — **controller**:

- `tap` on clear emits slide events and transitions; animations resolve before the next action.
- `tap` while resolving is ignored.
- Collision emits exactly one heart loss, one collision event, and no removal.
- A win emits reveal/win events exactly once; retry resets; hint only chooses clear pieces; reset restores hearts and pieces.

Browser seam — **Playwright**:

- First run shows the tutorial; dismissing it reveals level 1.
- Keyboard: Tab to a ribbon, Enter clears it, hearts update, live region text changes.
- Collision: tapping a known blocked ribbon drops a heart and does not remove it.
- Solve level 1 via its committed solution, see the constellation reveal, stars, and gallery unlock.
- Reload preserves stars and unlocks.
- Mobile viewport (390×844) screenshot and no horizontal overflow; 320 px smoke test.
- Reduced-motion emulation completes the flow without confetti.
- Service worker registers in a production preview and the shell loads offline.

CI runs typecheck, unit tests, solver verification (part of unit tests), production build, and Playwright against the built preview.

## Out of Scope

- Accounts, cloud sync, leaderboards, social sharing, analytics, ads, IAP.
- Daily puzzle, endless/procedural runtime levels, level editor, user-generated content.
- Timers, move limits, boosters beyond the free hint, currencies, energy.
- Multiplayer, native iOS/Android wrappers, desktop packaging.
- Localisation beyond English.
- Copying any shipped game's art, audio, copy, or characters.

## Further Notes

- **References:** Google Play listing, App Store listing, Addicting Games listing, and a levels 1–15 walkthrough (linked in `GRILL.md`). The brief's purple/hearts/guide/hidden-picture direction overrides the shipping build's light skin.
- **Originality:** all art, copy, characters, audio synthesis, and code are original to this repository. The font will be an OFL-licensed rounded family with its licence committed.
- **Difficulty honesty:** the solver proves clearance, not fun. The curation step is where the human judgement lives; the metrics are a floor, not a substitute.
- **Accessibility honesty:** the default game is intentionally visual; assistive mode is the accessible path, and the README should say so plainly.
- **No dead ends:** contributors should read `ADR-0002` before touching the rule engine. Adding a stateful move would invalidate the solver, generator, hints, and tutorial.
- **Deployment target:** `https://gerrcass.github.io/arrow-slide-puzzle/` (GitHub Pages, project path).
