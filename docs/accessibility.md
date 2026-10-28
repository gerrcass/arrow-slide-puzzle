# Accessibility notes

Nana Pearl's Arrow Slide Puzzle is visual by nature. The default game preserves
that visual challenge; assistive mode, the keyboard path, and the live regions
make it completable without sight. This page records the measurements and
exceptions behind `ADR-0007`.

## Keyboard and focus

- Tab order: skip link → play header (back, sound, settings) → board ribbons in
  piece order → Nana Pearl's dismiss control → hint/describe/reset.
- The play screen's first focusable element is a skip link to `#tangle-board`.
- Enter and Space activate a ribbon. `H` hints, `R` resets, Escape closes a
  dialog or opens settings from the play screen.
- Focus rings are 3 px `#fff0b8` (`--color-focus`) on a dark offset. Ribbon focus
  uses the SVG halo at full opacity because `outline` on an SVG `<g>` is not
  reliable across browsers.
- Every dialog captures the invoking control and restores focus on close, even
  when the screen's DOM is replaced by navigation.

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

The play screen no longer clears the opposite live region when announcing, so an
assertive collision message is not cut off by a polite guide line.

## Contrast

Design tokens were audited against their real backgrounds. Locked level cards no
longer reduce the whole card's opacity (which dropped their text below AA);
the artwork dims instead while text keeps its token colour. Disabled buttons
keep a readable 0.58 opacity.

Automated axe-core scans run in Playwright for home, levels, play, gallery, and
the settings dialog against WCAG 2.0, 2.1, and 2.2 A/AA. The suite fails on any
serious or critical violation. There are no documented exceptions at the time
of writing.

## Touch targets

- Every button control (`btn`, `icon-button`, gallery/level cards, guide dismiss,
  dialog close) is at least 44 × 44 px.
- Ribbon hit areas cover the ribbon's full length plus a halo stroke of 1.02
  cells, enough to include the arrowhead.

### The dense-board geometric exception

On the densest board (8 × 8) at the smallest supported viewport (320 × 568), the
board frame is 248 px wide. Its inner SVG is about 238 px across a 9.1-unit
viewBox (8 cells plus the 0.55-cell edge margin), so one cell is about 26.2 px.
The ribbon body is 0.58 cell ≈ 15.2 px; the full ribbon-plus-halo target stroke
is 1.02 cells ≈ 26.7 px.

That target is above the WCAG 2.2 AA Target Size (Minimum) of 24 × 24 px, but
below our normal 44 px button target. We do not enlarge the halo further because
adjacent ribbons can be one cell apart: a halo wider than one cell would overlap
its neighbour and steal taps. The exact target is documented here, and assistive
mode, the keyboard path, focus rings, and the describe action provide the
alternative route required by the exception.

At 390 × 844 the same 8 × 8 board is about 362 px wide, giving a 1.02-cell target
of roughly 40 px.
