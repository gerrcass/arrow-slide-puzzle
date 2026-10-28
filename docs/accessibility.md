# Accessibility notes

Nana Pearl's Arrow Slide Puzzle is visual by nature. The default game preserves
that visual challenge; assistive mode, the keyboard path, and the live regions
make it completable without sight. This page records the measurements and
exceptions behind `ADR-0007`.

## Keyboard and focus

- On screen entry focus lands on the `<main>` container, so the first `Tab`
  reaches the **Skip to the board** link. Activating it focuses the board
  without changing the route or discarding the attempt.
- Tab order: skip link → play header (back, sound, settings) → board ribbons in
  piece order → Nana Pearl's dismiss control → hint/describe/reset.
- Enter and Space activate a ribbon. `H` hints, `R` resets, Escape closes a
  dialog or opens settings from the play screen. Held keys are ignored
  (`event.repeat`) so one press cannot activate two ribbons.
- Focus rings are 3 px `#fff0b8` (`--color-focus`) on a dark offset. Ribbon focus
  uses the SVG halo at full opacity because `outline` on an SVG `<g>` is not
  reliable across browsers.
- Every dialog captures the invoking control and restores focus on close, even
  when the screen's DOM is replaced by navigation. The fallback covers SVG
  ribbon triggers as well as HTML controls.

## Assistive mode

Off by default. Turning it on appends “Clear.” or “Blocked.” to each ribbon's
name and shows **Describe clear ribbons** beside Hint. Activating it announces
one sentence listing every clear ribbon, in board order.

The board SVG itself is a labelled group; each ribbon is `role="button"` with
`tabindex="0"` and a name like “Rose ribbon, 3 cells, pointing up.”

## Live announcements

- Clears: polite, once per clear, with cleared/total progress.
- Collisions: assertive, once, naming the blocker and hearts remaining.
- Hearts: included in the collision sentence; the heart row's accessible label
  also updates.
- Hints: polite, naming the ribbon and heading.
- Wins: assertive, once, with stars and the constellation's gallery status.
- Gallery: polite collection count on entry.
- Nana Pearl: a third, polite live channel. Guide copy is announced only when
  the bubble changes, so it never overwrites a clear or collision message.

## Contrast and selection

Design tokens were audited against their real backgrounds. Locked level cards no
longer reduce the whole card's opacity (which dropped their text below AA);
the artwork dims instead while text keeps its token colour. Disabled buttons
keep a readable 0.58 opacity.

Selected motion and guide-copy options show a gold check mark in addition to
their colour change, so a selection is never conveyed by colour alone. The
settings panel clips its decorative halo and keeps a vertical scrollbar on short
screens; all preference rows remain at least 44 px.

Automated axe-core scans run in Playwright for home, levels, play, gallery, and
the settings dialog at both 390 and 320 widths against WCAG 2.0, 2.1, and 2.2
A/AA. The suite fails on any serious or critical violation. There are no
documented exceptions at the time of writing.

## Touch targets

- Every button control (`btn`, `icon-button`, gallery/level cards, guide dismiss,
  dialog close, settings rows) is at least 44 × 44 px.
- Ribbon hit areas cover the ribbon's full length plus a halo stroke of 1.02
  cells. Measured target widths:

| Viewport | 6 × 6 | 7 × 7 | 8 × 8 |
| --- | --- | --- | --- |
| 390 × 844 portrait | 50 px | 44 px | 39 px |
| 320 × 568 portrait | 34 px | 30 px | 26 px |
| 844 × 390 landscape | 50 px | 43 px | 39 px |
| 667 × 375 landscape | 47 px | 41 px | 36 px |
| 320 × 320 reflow (stacked) | 33 px | 29 px | 26 px |

All values exceed the WCAG 2.2 AA **Target Size (Minimum)** of 24 × 24 px. The
44 px project target is met by buttons and by ribbons on the gentler boards; the
densest boards are deliberately capped at a one-cell halo so adjacent ribbons do
not steal taps. Those boards offer the full ribbon length as a target, keyboard
play, and assistive mode as the alternative route required by the exception. At
a 400% browser zoom (about 360×225 CSS px) the play screen stacks and allows
vertical scrolling; the board keeps a 240 px floor instead of collapsing.
