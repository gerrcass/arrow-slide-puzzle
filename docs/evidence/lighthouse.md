# Lighthouse evidence

**Date:** 2026-10-28
**Build:** production `npm run build`, served by `vite preview`
**Tool:** Lighthouse 13 (mobile defaults)
**Page:** `http://127.0.0.1:4321/`

| Category | Score |
| --- | --- |
| Performance | **100** |
| Accessibility | **100** |
| Best practices | **100** |
| SEO | **100** |

Core metrics: LCP **0.8 s**, CLS **0**, TBT **10 ms**.

Command:

```sh
CHROME_PATH=/usr/bin/chromium-browser npx lighthouse http://127.0.0.1:4321/ \
  --chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage" \
  --output=json --output-path=lighthouse.json \
  --only-categories=performance,accessibility,best-practices,seo \
  --form-factor=mobile --quiet
```

Scores vary slightly with runner speed; the checked-in result is a local
production-build measurement, not a lab guarantee.
