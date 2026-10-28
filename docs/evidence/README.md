# Evidence

Screenshots and measurements in this folder are generated from the production
build, not hand-edited.

## README and PR captures

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4321 &
npx tsx scripts/capture-evidence.ts
```

This writes the README composite to `docs/screenshots/` and the desktop,
mobile, win, and settings captures to this folder. The 320 px guide/win,
landscape, and reduced-motion screenshots come from the Playwright suite and
land in the gitignored `test-results/evidence/`.

## Browser suite evidence

```sh
npm run test:e2e
```

The suite also fails on serious/critical axe violations at 390 and 320 widths,
covers offline reload after one visit, reduced motion, the desktop guide/footer
fit, and the landscape layout. Its screenshots are deliberately kept out of the
tracked tree.

## Lighthouse

```sh
CHROME_PATH=/usr/bin/chromium-browser npx lighthouse http://127.0.0.1:4321/ \
  --chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage" \
  --output=json --output-path=lighthouse.json \
  --only-categories=performance,accessibility,best-practices,seo \
  --form-factor=mobile --quiet
```

The checked-in result is a local production measurement; see
[`lighthouse.md`](./lighthouse.md).

## Target sizes

The ribbon target measurements in `docs/accessibility.md` are computed from the
rendered SVG: `cell = boardSvgWidth / viewBoxWidth`, then `target = 1.02 * cell`.
Re-measure at 320×568, 390×844, and 844×390 after any board or font change.
