# Coding standards

Review-time rules for judgement calls. A mechanical rule that can be checked belongs in CI, not here.

## Domain

- Use the glossary. A "ribbon" is the visual, a "piece" is the model; "clear" is a state, "slide" is the action.
- Rules stay pure and deterministic. No DOM, storage, clocks, or randomness inside the engine. Seeds enter as arguments.
- Do not add moves that change occupancy. `ADR-0002` is not a suggestion; it is what makes the solver, generator, hints, and tutorial coherent.
- Prefer computed state over cached state. If a value can be derived from the remaining pieces and hearts, derive it.

## TypeScript

- Strict mode stays on. No `any`, no non-null assertions over external data, no floating promises.
- Model states with discriminated unions; make illegal states unrepresentable where practical.
- Keep public module surfaces small. A module owns one noun: geometry, clearance, board rules, levels, progress, renderer, guide, audio.
- Validate persisted and content data at the boundary, then trust it inside.

## UI

- Every interactive element has a visible focus style, an accessible name, and a keyboard path.
- Colour is never the only signal. Motion is never the only feedback.
- Board copy, guide copy, and button labels are product surface: short, warm, and consistent with Nana Pearl's voice.
- Use design tokens for colour, spacing, radius, and elevation. A raw hex value outside the token file is a review failure unless it is inside an SVG artwork palette.
- Respect `prefers-reduced-motion` and the in-app motion setting at the animation call site, not only in CSS.
- Animations must not block input longer than their stated duration, and the board must ignore input while resolving.

## Tests

- Test observable behaviour, not structure. No SVG/CSS snapshots.
- Name tests after the domain rule they protect, e.g. "a bent ribbon blocked three cells ahead is not clear".
- Use deterministic fixtures and seeds. No sleeps in unit tests; drain the controller's event queue.
- Every committed level is covered by the solver and metric test. A new level without green verification is not shippable.
- Browser tests cover the player journey, not every component.

## Delivery

- Zero runtime dependencies. Dev dependencies need a reason and a lockfile update.
- CI must be green on typecheck, unit, build, and E2E before merge.
- Commits are small, conventional, and explain why. PR bodies follow the `/pr` template and carry evidence.
- Clean up branches, worktrees, and open issues before declaring done.

## Release surface

- A claim about a measurement (target size, Lighthouse, viewport fit, offline)
  comes from the current build. Record the command or capture in `docs/evidence/`.
- Every dialog close control is clicked in a browser test, not only checked with
  `toBeInViewport`. A visible X that cannot be clicked is still broken.
- Before calling a layout responsive, cover 320×568, 375×667, 390×844, 568×320,
  667×375, 844×390, and 1440×900. Assert no horizontal overflow, the footer and
  primary actions in view, and a stable board position.
- Offline evidence includes a cold new tab, not only a reload of the warm tab.
- Generated content is regenerated with `npm run levels:generate`; a diff means
  the committed seed and the checked-in levels disagree.
