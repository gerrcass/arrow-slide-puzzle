/**
 * Capture the final README and PR evidence from the production build.
 * Run `npm run preview -- --port 4321` first, then:
 *
 *   npx tsx scripts/capture-evidence.ts
 */
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright-core';
import { readFileSync, mkdirSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { clearanceFor } from '../src/engine/clearance';
import { solveBoard } from '../src/engine/solver';
import { LEVELS } from '../src/content/levels';
import { defaultSave, SAVE_KEY, type SaveData } from '../src/app/progress';

const BASE = process.env.EVIDENCE_BASE ?? 'http://127.0.0.1:4321';
const OUT = 'docs/evidence';
const SHOTS = 'docs/screenshots';
mkdirSync(OUT, { recursive: true });
mkdirSync(SHOTS, { recursive: true });

const executablePath = [
  process.env.PLAYWRIGHT_CHROMIUM,
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
].find((candidate): candidate is string => Boolean(candidate) && existsSync(candidate as string));

if (!executablePath) throw new Error('No Chromium found');

const browser: Browser = await chromium.launch({
  executablePath,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

function saveWith(completed: number, extra: Partial<SaveData> = {}): SaveData {
  const base = defaultSave();
  const levels: Record<string, { bestStars: 1 | 2 | 3; completedAt: string }> = {};
  for (let index = 0; index < completed; index += 1) {
    levels[String(index)] = {
      bestStars: (index % 3 === 0 ? 3 : index % 3 === 1 ? 2 : 1) as 1 | 2 | 3,
      completedAt: `2026-10-${String(20 + index).padStart(2, '0')}T10:00:00.000Z`,
    };
  }
  return {
    ...base,
    levels,
    tutorial: {
      ...base.tutorial,
      introSeen: true,
      tutorialDone: true,
      collisionTipSeen: true,
      heartsTipSeen: true,
      winTipSeen: true,
      hintTipSeen: true,
    },
    settings: { ...base.settings, sound: false },
    ...extra,
  };
}

async function seed(page: Page, save: SaveData): Promise<void> {
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: SAVE_KEY, value: JSON.stringify(save) },
  );
}

function ribbon(page: Page, id: string) {
  return page.locator(`.ribbon[data-piece-id="${id}"]`);
}

async function clearSome(page: Page, levelIndex: number, count: number): Promise<void> {
  const level = LEVELS[levelIndex]!;
  const order = solveBoard(level.board);
  if (!order) throw new Error('Unsolved level');
  for (const id of order.slice(0, count)) {
    await ribbon(page, id).click();
    await page.waitForFunction(
      () => document.querySelector('.board-svg')?.getAttribute('aria-busy') === 'false',
      null,
      { timeout: 5000 },
    );
  }
}

async function triggerCollision(page: Page, levelIndex: number): Promise<void> {
  const level = LEVELS[levelIndex]!;
  const blocked = level.board.pieces.find((piece) => {
    const others = level.board.pieces.filter((other) => other.id !== piece.id);
    return (
      clearanceFor(piece, others, level.board.width, level.board.height).kind === 'blocked'
    );
  });
  if (!blocked) return;
  await ribbon(page, blocked.id).click();
  await page.waitForFunction(
    () => document.querySelector('.board-svg')?.getAttribute('aria-busy') === 'false',
    null,
    { timeout: 5000 },
  );
}

async function desktop(): Promise<void> {
  const context: BrowserContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await seed(
    page,
    saveWith(8, {
      tutorial: {
        ...defaultSave().tutorial,
        introSeen: true,
        tutorialDone: true,
        collisionTipSeen: false,
        heartsTipSeen: true,
        winTipSeen: true,
        hintTipSeen: true,
      },
    }),
  );
  await page.goto(`${BASE}/#/play/5`);
  await page.locator('[data-screen-heading]').waitFor({ state: 'visible' });
  await triggerCollision(page, 4);
  await clearSome(page, 4, 3);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/play-desktop.png` });

  await page.goto(`${BASE}/#/`);
  await page.locator('[data-screen-heading]').waitFor({ state: 'visible' });
  await page.screenshot({ path: `${OUT}/home-desktop.png` });

  await page.goto(`${BASE}/#/gallery`);
  await page.locator('[data-screen-heading]').waitFor({ state: 'visible' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/gallery-desktop.png` });
  await context.close();
}

async function mobile(): Promise<void> {
  const context: BrowserContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await seed(
    page,
    saveWith(6, {
      tutorial: {
        ...defaultSave().tutorial,
        introSeen: true,
        tutorialDone: true,
        collisionTipSeen: false,
        heartsTipSeen: true,
        winTipSeen: true,
        hintTipSeen: true,
      },
    }),
  );
  await page.goto(`${BASE}/#/play/7`);
  await page.locator('[data-screen-heading]').waitFor({ state: 'visible' });
  await triggerCollision(page, 6);
  await clearSome(page, 6, 3);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${SHOTS}/play-mobile.png` });

  await page.goto(`${BASE}/#/gallery`);
  await page.locator('[data-screen-heading]').waitFor({ state: 'visible' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SHOTS}/gallery-mobile.png` });

  await page.goto(`${BASE}/#/`);
  await page.locator('[data-screen-heading]').waitFor({ state: 'visible' });
  await page.screenshot({ path: `${SHOTS}/home-mobile.png` });

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('dialog', { name: 'Settings' }).waitFor({ state: 'visible' });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/settings-390.png` });
  await context.close();
}

async function winShot(): Promise<void> {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await seed(page, saveWith(0));
  await page.goto(`${BASE}/#/play/1`);
  await page.locator('[data-screen-heading]').waitFor({ state: 'visible' });
  await clearSome(page, 0, 50).catch(() => undefined);
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${SHOTS}/win-mobile.png` });
  await context.close();
}

async function composeHero(): Promise<void> {
  const font = readFileSync('public/fonts/fredoka-latin-variable.woff2').toString('base64');
  const images = {
    home: readFileSync(`${SHOTS}/home-mobile.png`).toString('base64'),
    play: readFileSync(`${SHOTS}/play-mobile.png`).toString('base64'),
    gallery: readFileSync(`${SHOTS}/gallery-mobile.png`).toString('base64'),
  };

  const page = await browser.newPage({ viewport: { width: 1600, height: 920 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><meta charset="utf-8"><style>
    @font-face{font-family:Fredoka;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:300 700;font-display:block}
    *{box-sizing:border-box}
    html,body{margin:0;width:1600px;height:920px;overflow:hidden;font-family:Fredoka,system-ui,sans-serif;color:#fbf5ff;
      background:
        radial-gradient(900px 500px at 12% 0%, rgba(255,159,196,.16), transparent 60%),
        radial-gradient(900px 600px at 88% 15%, rgba(200,167,255,.15), transparent 62%),
        radial-gradient(900px 600px at 50% 120%, rgba(159,216,255,.1), transparent 60%),
        linear-gradient(140deg,#1b0b37,#0b051a 62%,#07030f)}
    .stars{position:absolute;inset:0;opacity:.7;background-image:radial-gradient(#fff3d6 1px,transparent 1.5px),radial-gradient(#e6d6ff 1px,transparent 1.5px);background-size:113px 91px,167px 139px}
    .wrap{position:relative;z-index:2;padding:48px 64px 40px;height:100%;display:flex;flex-direction:column;align-items:center}
    h1{margin:0;font-size:56px;line-height:1;letter-spacing:-.03em;font-weight:650}
    h1 em{font-style:normal;color:#ffb3cf}
    p{margin:12px 0 0;color:#d9c8ef;font-size:20px}
    .row{display:flex;gap:34px;align-items:flex-start;margin-top:28px}
    .device{width:300px}
    .screen{position:relative;padding:9px;border-radius:36px;background:linear-gradient(160deg,rgba(255,246,255,.22),rgba(255,246,255,.05));border:1px solid rgba(255,240,255,.24);box-shadow:0 34px 80px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.2)}
    img{display:block;width:100%;border-radius:28px}
    .caption{display:flex;align-items:center;gap:9px;justify-content:center;margin-top:14px;color:#bfa9dd;font-size:15px}
    .dot{width:7px;height:7px;border-radius:50%;background:#ffd27a;box-shadow:0 0 10px #ffd27a}
    .foot{display:flex;gap:12px;margin-top:26px;color:#a891c9;font-size:15px}
  </style>
  <div class="stars"></div>
  <div class="wrap">
    <h1>Nana Pearl’s <em>Arrow Slide Puzzle</em></h1>
    <p>Read the tangle. Find the ribbon that can slide all the way out.</p>
    <div class="row">
      <div class="device"><div class="screen"><img src="data:image/png;base64,${images.home}"></div><div class="caption"><i class="dot"></i>A quiet little tangle</div></div>
      <div class="device"><div class="screen"><img src="data:image/png;base64,${images.play}"></div><div class="caption"><i class="dot"></i>Look twice, then tap</div></div>
      <div class="device"><div class="screen"><img src="data:image/png;base64,${images.gallery}"></div><div class="caption"><i class="dot"></i>Collect the sky</div></div>
    </div>
    <div class="foot"><span>12 tangles</span><span>·</span><span>12 constellations</span><span>·</span><span>three hearts, no clock</span><span>·</span><span>free in your browser</span></div>
  </div>`);
  await page.screenshot({ path: `${SHOTS}/hero.png` });
  await page.close();
}

try {
  await desktop();
  await mobile();
  await winShot();
  await composeHero();
  console.log('Evidence captured');
} finally {
  await browser.close();
}
