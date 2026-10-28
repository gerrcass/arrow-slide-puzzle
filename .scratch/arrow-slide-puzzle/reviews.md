# Pre-PR review log

The branch went through two independent review rounds before the PR. Each round
used two subagents with different briefs; their findings were compared, the
shared P0/P1 items were fixed first, and the second round was dispatched at the
gaps left by the first.

## Round 1 — two reviewers, same audit brief

Both reviewers independently cleared the pure engine, solver, level data, save
migration, and the offline shell. Both returned **no-ship** until the release
surface was hardened.

### Confirmed by both

| Finding | Severity | Resolution |
| --- | --- | --- |
| 320×568 guide/win content clipped the footer/actions | P0/P2 | Compact short-height guide + win dialog; E2E asserts footer and every win action are in view. |
| Landscape collapsed the board to 22–86 px | P1 | Two-column landscape layout; board is 366 px at 844×390; orientation lock removed. |
| 44 px target claim was false | P1 | README/docs now give measured 50/44/39 px (390) and 34/30/26 px (320); WCAG 2.2 AA 24 px floor stated. Buttons stay 44 px. |
| Reset progress wiped motion/assistive/sound/tips | P1 | Reset preserves settings; copy and tests updated. |
| Service worker deleted caches from other Pages projects | P1 | Cache namespaced by prefix; deletion scoped; asset lookups use this cache only. |
| Locked gallery cards had no name hint | P1 | Twelve original riddles added to gallery and level cards; name still hidden. |
| Focus order skipped the skip link and Back | P1 | Screen container focused on entry; Tab reaches skip link, then Back. |
| Guide bubble shifted the board | P1 | Guide slot reserves its height; board position is stable. |
| CI picked system Chromium over Playwright's | P2 | System path gated on `!process.env.CI`; HTML reporter added. |
| E2E wrote tracked evidence | P2 | Screenshots go to gitignored `test-results/evidence`. |

### Unique to reviewer A

- Landscape orientation restriction (WCAG 1.3.4) — fixed by removing the manifest lock.
- Level select spoiled unlocked-but-uncompleted constellations — now veiled art + riddle.
- Animation failure could leave the board locked — catch now settles and unlocks.
- `hintTipSeen` was dead — first-hint tip implemented.

### Unique to reviewer B

- Skip link navigated to `#/` and lost the attempt — now preventDefault + focus board.
- Nana's bubble overwrote clear announcements — separate guide live channel; render only on state change.
- Held Enter/Space could activate multiple ribbons — `event.repeat` guard in both handlers.
- Selected radio state was colour-only — gold check mark added.
- Settings panel had horizontal overflow at 320 — halo capped and overflow clipped.
- Focus restore excluded SVG ribbon triggers — widened to `Element`.

## Round 2 — refined verification + adversarial brief

Two fresh reviewers checked every claimed fix, then attacked the remaining
surface: full-campaign state, PWA update lifecycle, audio, screen-reader order,
forced colours, CI/Pages, licensing, and test quality.

### Reviewer C — verification pass

All fifteen round-one items were re-checked against the current build. Fourteen
were verified fixed; the layout item was partially fixed and surfaced three new
release-surface defects. All were fixed:

| Finding | Severity | Resolution |
| --- | --- | --- |
| Win/campaign dialogs overflowed at 375×667 and short landscape; autofocus scrolled the title/close off-screen | P1 | Result panels are scroll containers at every height; compact layout applies ≤700px; landscape hides decorative art/body first; focus uses `preventScroll` and resets scrollTop. E2E covers 375×667, 844×390, and 568×320, asserting title, close, and every action are visible. |
| 390×844 guide bubble moved the board 7.1 px | P2 | Guide slot reserve raised to 8.5rem; desktop board budget reduced to match. E2E asserts <2 px movement across a tutorial beat. |
| 375×667 play footer was below the fold | P2 | Compact guide/footer band now starts at 700px. E2E asserts the footer is in view. |
| Radio tick leaked “✓” into every option's accessible name | P2 | Tick is now an `aria-hidden` span; E2E asserts the radio's accessible name is exactly the option label. |
| Settings section titles were plain paragraphs | P2 | Promoted to `<h3>` for heading navigation; axe re-run at 390 and 320. |
| Welcome dialog clipped on short phones/landscape | P1/P2 | Portrait is hidden and the panel is compact on short screens; E2E at 320×568 and 844×390 asserts title and actions in view. |

Reviewer C found no P0 and recommended no-ship only for the result-dialog
overflow, which is now covered by tests.

### Reviewer D — adversarial pass

Reviewer D played the campaign and attacked PWA, focus, zoom, and spoiler surfaces.
It found no engine/content defect and confirmed the recent 375×667/390 fixes. It
did find three release blockers and several smaller gaps. All were fixed:

| Finding | Severity | Resolution |
| --- | --- | --- |
| Dialog close X was painted over by the eyebrow and unclickable | P1 | Close control gets `z-index`, eyebrow loses pointer events; E2E clicks the X on Settings and the welcome card, and checks focus returns to the board. |
| Narrow landscape / 400% zoom collapsed the board to ~12 px | P1 | At ≤560×420 the play screen stacks, scrolls vertically, and enforces a 240 px board floor; E2E covers 360×225, 320×320, and 667×375. |
| Level-select art still showed the full star pattern | P1 | Muted constellation art now hides line, star, and orbit groups; gallery locked cards use the same veil. E2E checks the silhouette only. |
| Nana’s dismiss control vanished when the head hid | P2 | The dismiss button moved outside the head and is absolute-positioned; 320 and landscape E2E click it. |
| Settings Tab escaped the dialog; welcome Escape/X ended on `<main>` | P2 | Explicit Tab loop; dialogs close before `onCancel` so the welcome can hand focus to the board. E2E covers both. |
| Cold-tab offline asset requests missed because of `Vary: Origin` | P2 | Cache matches use `ignoreVary`; E2E opens a fresh tab offline. The cache name now includes a per-build timestamp, so old hashed assets are cleaned up. |
| Level 12 title (“Nana’s Sky”) spoiled the final constellation | P2 | Renamed to “The Last Light”; the constellation name stays hidden until the reveal. |
| Test/docs gaps: close buttons only viewport-checked, locked-card test targeted an unlocked card, axe target-size rule disabled, dead timer set | P2 | Close-click tests, locked-card assertions, manual 24 px target floor at 320/390, settings copy fixed, dead timer set removed. |

Reviewer D also confirmed the engine, persistence boundary, zero-runtime
dependency budget, manifest installability under `/arrow-slide-puzzle/`, and
OFL font licensing. Its final recommendation was no-ship at the commit it
reviewed; the fixes above were made immediately afterwards.

## Outcome

Both round-two reviewers' remaining P0/P1 findings were fixed before the PR:

- Every dialog X is clickable and keyboard-reachable; the Tab loop wraps.
- 375×667, 844×390, 568×320, 667×375, 320×320, and 360×225 are covered by browser tests.
- The 320/390/landscape target-size claims match measured hit areas.
- Level-select and gallery previews show only a silhouette until completion.
- Nana's dismiss control stays visible at every supported size.
- The service worker matches with `ignoreVary`, and a cold offline tab is tested.
- Level 12 is titled “The Last Light”, so the final constellation name is not spoiled.

Final verification on the branch: **127 unit tests, 40 Playwright tests, typecheck,
production build, and Lighthouse mobile 100/100/100/100.**
