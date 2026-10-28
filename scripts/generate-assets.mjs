/**
 * Regenerate the PWA icons and the social card from the in-repo brand mark.
 * Uses the Chromium already installed for Playwright; no image libraries.
 *
 *   node scripts/generate-assets.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';

const icon = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8');
const font = readFileSync(
  new URL('../public/fonts/fredoka-latin-variable.woff2', import.meta.url),
).toString('base64');
const out = new URL('../public/icons/', import.meta.url);
mkdirSync(out, { recursive: true });

const candidates = [
  process.env.PLAYWRIGHT_CHROMIUM,
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
].filter(Boolean);
const executablePath = candidates.find((candidate) => existsSync(candidate));
if (!executablePath) throw new Error('No Chromium found for asset generation');

const browser = await chromium.launch({
  executablePath,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function renderSvg(size, file, { background = null, inset = 0 } = {}) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  const bg = background ? `background:${background};` : 'background:transparent;';
  const inner = size - inset * 2;
  await page.setContent(
    `<!doctype html><meta charset="utf-8"><style>
      html,body{margin:0;width:${size}px;height:${size}px;${bg}overflow:hidden}
      .mark{position:absolute;left:${inset}px;top:${inset}px;width:${inner}px;height:${inner}px}
      svg{display:block;width:100%;height:100%}
    </style><div class="mark">${icon}</div>`,
  );
  await page.screenshot({
    path: new URL(file, out).pathname,
    omitBackground: background === null,
  });
  await page.close();
}

await renderSvg(192, 'icon-192.png');
await renderSvg(512, 'icon-512.png');
await renderSvg(180, 'apple-touch-icon.png', { background: '#150b2b', inset: 18 });
await renderSvg(512, 'icon-maskable-512.png', { background: '#150b2b', inset: 82 });

const ogPage = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await ogPage.setContent(`<!doctype html><meta charset="utf-8"><style>
  @font-face{font-family:Fredoka;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:300 700;font-display:block}
  *{box-sizing:border-box}
  html,body{margin:0;width:1200px;height:630px;overflow:hidden;font-family:Fredoka,system-ui,sans-serif;color:#fbf5ff}
  .card{position:relative;width:100%;height:100%;padding:64px 72px;display:flex;justify-content:space-between;align-items:center;
    background:
      radial-gradient(700px 420px at 18% 8%, rgba(255,159,196,.22), transparent 62%),
      radial-gradient(650px 500px at 86% 22%, rgba(200,167,255,.2), transparent 64%),
      radial-gradient(700px 500px at 55% 110%, rgba(159,216,255,.12), transparent 60%),
      linear-gradient(135deg,#1d0d3b 0%,#0c051c 64%,#07030f 100%)}
  .stars{position:absolute;inset:0;opacity:.7;background-image:radial-gradient(#fff3d6 1px, transparent 1.5px),radial-gradient(#e6d6ff 1px, transparent 1.5px);background-size:97px 83px,151px 127px;background-position:12px 22px,60px 40px}
  .copy{position:relative;z-index:2;max-width:600px}
  .brand{display:flex;align-items:center;gap:16px;margin-bottom:26px}
  .brand img{width:58px;height:58px;border-radius:16px;box-shadow:0 14px 40px rgba(0,0,0,.4)}
  .brand span{font-size:20px;font-weight:600;letter-spacing:.04em;color:#ffe8b8}
  h1{margin:0;font-size:78px;line-height:.91;letter-spacing:-.035em;font-weight:650}
  h1 em{display:block;font-style:normal;color:#ffb3cf}
  p{margin:24px 0 0;font-size:25px;line-height:1.35;color:#d9c8ef;max-width:520px;font-weight:400}
  .chips{display:flex;gap:12px;margin-top:32px;flex-wrap:wrap}
  .chip{padding:10px 18px;border-radius:999px;background:rgba(255,246,255,.07);border:1px solid rgba(255,236,255,.16);font-size:17px;color:#f4e8ff}
  .art{position:relative;z-index:2;width:440px;height:440px;border-radius:54px;padding:16px;
    background:linear-gradient(160deg,rgba(255,246,255,.13),rgba(255,246,255,.03));border:1px solid rgba(255,240,255,.18);
    box-shadow:0 40px 90px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.14)}
  .board{width:100%;height:100%;border-radius:40px;background:radial-gradient(circle at 50% 35%,#2a1650,#120825 72%);position:relative;overflow:hidden;border:1px solid rgba(255,240,255,.09)}
  .board:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,240,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,240,255,.055) 1px,transparent 1px);background-size:49px 49px}
  .hint{position:absolute;left:26px;bottom:24px;display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:999px;background:rgba(8,3,17,.62);border:1px solid rgba(255,240,255,.14);font-size:15px;color:#ffe8b8}
  .hint i{width:8px;height:8px;border-radius:50%;background:#ffd27a;box-shadow:0 0 12px #ffd27a}
</style>
<div class="card">
  <div class="stars"></div>
  <div class="copy">
    <div class="brand"><img src="data:image/svg+xml;base64,${Buffer.from(icon).toString('base64')}"><span>NANA PEARL’S</span></div>
    <h1>Arrow Slide<em>Puzzle</em></h1>
    <p>Read the tangle. Find the ribbon that can slide all the way out. Three hearts, twelve constellations, no clock.</p>
    <div class="chips"><span class="chip">12 tangles</span><span class="chip">Original art</span><span class="chip">Play free</span></div>
  </div>
  <div class="art"><div class="board">
    <svg viewBox="0 0 100 100" style="position:absolute;inset:0;width:100%;height:100%">
      <defs>
        <linearGradient id="p1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c8ff"/><stop offset="1" stop-color="#a55ee0"/></linearGradient>
        <linearGradient id="p2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8f4ff"/><stop offset="1" stop-color="#3e9fc6"/></linearGradient>
        <linearGradient id="p3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b4"/><stop offset="1" stop-color="#e8a52c"/></linearGradient>
        <linearGradient id="p4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd1df"/><stop offset="1" stop-color="#db7499"/></linearGradient>
      </defs>
      <path d="M28 20 L28 34 Q28 42 36 42 L44 42" fill="none" stroke="#a55ee0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".28" transform="translate(0,2)"/>
      <path d="M28 20 L28 34 Q28 42 36 42 L44 42" fill="none" stroke="url(#p1)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M28 20 L28 34 Q28 42 36 42 L44 42" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,-1)"/>
      <path d="M44 42 L50 42" stroke="#a55ee0" stroke-width="7" fill="none"/>
      <path d="M50 42 L45 37 L45 47 Z" fill="#c77cf0"/>

      <path d="M62 18 L62 30 L52 30" fill="none" stroke="url(#p2)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M62 18 L62 30 L52 30" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" transform="translate(0,-1)"/>
      <path d="M46 30 L52 30" stroke="#3e9fc6" stroke-width="7" fill="none"/>
      <path d="M46 30 L51 25 L51 35 Z" fill="#75c9e6"/>

      <path d="M40 58 L54 58" fill="none" stroke="url(#p3)" stroke-width="6" stroke-linecap="round"/>
      <path d="M40 58 L54 58" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.4" stroke-linecap="round" transform="translate(0,-1)"/>
      <path d="M58 58 L54 53 L54 63 Z" fill="#f0b94a"/>

      <path d="M70 38 L70 62" fill="none" stroke="url(#p4)" stroke-width="6" stroke-linecap="round"/>
      <path d="M70 38 L70 62" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.4" stroke-linecap="round" transform="translate(-1,0)"/>
      <path d="M70 38 L65 43 L75 43 Z" fill="#eb9cb4"/>

      <path d="M34 76 L34 66 Q34 62 38 62 L47 62" fill="none" stroke="url(#p2)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
      <circle cx="34" cy="76" r="3" fill="#75c9e6"/>
      <path d="M60 50 L68 50" fill="none" stroke="url(#p3)" stroke-width="6" stroke-linecap="round"/>
      <path d="M60 50 L64 46 L64 54 Z" fill="#f0b94a"/>
      <circle cx="24" cy="80" r="1.2" fill="#ffd27a"/><circle cx="82" cy="18" r="1.5" fill="#fff3d6"/><circle cx="86" cy="78" r="1" fill="#b8f4ff"/><circle cx="16" cy="55" r=".9" fill="#f6c8ff"/>
    </svg>
    <div class="hint"><i></i>three hearts · no clock</div>
  </div></div>
</div>`);
await ogPage.screenshot({ path: new URL('../public/og.png', import.meta.url).pathname });
await ogPage.close();
await browser.close();
writeFileSync(new URL('../public/icons/.generated', import.meta.url), new Date().toISOString());
console.log('Generated PWA icons and public/og.png');
