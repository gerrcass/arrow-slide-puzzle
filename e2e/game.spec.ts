import { expect, test, type Page } from '@playwright/test';
import { constellationById } from '../src/content/constellations';
import { LEVELS } from '../src/content/levels';
import { clearanceFor } from '../src/engine/clearance';
import { solveBoard } from '../src/engine/solver';
import { SAVE_KEY } from '../src/app/progress';
import { seriousAxeViolations } from './axe';
import { noHorizontalOverflow, seedSave } from './helpers';

const FIRST = LEVELS[0]!;

function ribbon(page: Page, pieceId: string) {
  return page.locator(`.ribbon[data-piece-id="${pieceId}"]`);
}

function solutionFor(index: number): readonly string[] {
  const level = LEVELS[index]!;
  const order = solveBoard(level.board);
  expect(order).not.toBeNull();
  return order!;
}

async function clearLevel(page: Page, index: number): Promise<void> {
  const order = solutionFor(index);
  for (let position = 0; position < order.length; position += 1) {
    const pieceId = order[position]!;
    const piece = ribbon(page, pieceId);
    await expect(piece).toBeVisible();
    await piece.click();
    await expect(piece).toBeHidden();
    if (position < order.length - 1) {
      await expect(page.locator('.board-svg')).toHaveAttribute('aria-busy', 'false');
    }
  }
}

function blockedPieceIdFor(index: number): string {
  const board = LEVELS[index]!.board;
  const blocked = board.pieces.find(
    (piece) =>
      clearanceFor(
        piece,
        board.pieces.filter((other) => other.id !== piece.id),
        board.width,
        board.height,
      ).kind === 'blocked',
  );
  expect(blocked).toBeDefined();
  return blocked!.id;
}

function blockedPieceId(): string {
  return blockedPieceIdFor(0);
}

test.describe('first run', () => {
  test('welcome, skip, and level one', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Arrow Slide/ })).toBeVisible();
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(page).toHaveURL(/#\/levels$/);
    await page.locator('.level-card').first().click();
    await expect(page).toHaveURL(/#\/play\/1$/);
    const welcome = page.getByRole('dialog');
    await expect(welcome).toBeVisible();
    await expect(welcome.getByRole('heading', { name: 'Oh, hello dear' })).toBeVisible();
    await welcome.getByRole('button', { name: 'Skip for now' }).click();
    await expect(welcome).toBeHidden();
    await expect(page.locator('.ribbon')).toHaveCount(FIRST.board.pieces.length);
    await expect(page.getByRole('heading', { name: FIRST.title })).toBeVisible();
  });
});

test.describe('play', () => {
  test('a blocked ribbon costs one heart and stays on the board', async ({ page }) => {
    await seedSave(page);
    await page.goto('/#/play/1');
    const pieceId = blockedPieceId();
    const piece = ribbon(page, pieceId);
    await expect(piece).toBeVisible();
    await piece.click();
    await expect(page.locator('.heart-row')).toHaveAttribute(
      'aria-label',
      '2 of 3 hearts remaining',
    );
    await expect(page.locator('.board-svg')).toHaveAttribute('aria-busy', 'false');
    await expect(piece).toBeVisible();
    await expect(page.locator('.heart-row .heart-slot.is-empty')).toHaveCount(1);
  });

  test('solving level one reveals its constellation and unlocks the gallery', async ({
    page,
  }) => {
    await seedSave(page);
    await page.goto('/#/play/1');
    await expect(page.getByRole('heading', { name: FIRST.title })).toBeVisible();
    await clearLevel(page, 0);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 12_000 });
    await expect(dialog.getByRole('heading', { name: 'Tangle untangled' })).toBeVisible();
    const constellation = constellationById(FIRST.constellationId);
    expect(constellation).toBeDefined();
    await expect(dialog).toContainText(constellation!.name);
    await expect(dialog).toContainText('Constellation collected');
    await page.screenshot({ path: 'docs/evidence/win-polished-390.png' });
    const winViolations = await seriousAxeViolations(page);
    expect(
      winViolations,
      winViolations.map((v) => `${v.id}: ${v.targets.join(', ')}`).join('; '),
    ).toEqual([]);

    await dialog.getByRole('button', { name: 'View gallery' }).click();
    await expect(page).toHaveURL(/#\/gallery$/);
    await expect(page.locator('.gallery-summary')).toContainText('1 / 12 collected');
    await expect(page.locator('.gallery-card').first()).toHaveJSProperty(
      'tagName',
      'BUTTON',
    );
    await page.screenshot({ path: 'docs/evidence/gallery-polished-390.png' });

    const stored = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as { levels: Record<string, { bestStars: number }> }) : null;
    }, SAVE_KEY);
    expect(stored?.levels['0']?.bestStars).toBe(3);

    await page.reload();
    await expect(page.locator('.gallery-summary')).toContainText('1 / 12 collected');
    await page.goto('/#/levels');
    await expect(page.locator('.level-card').nth(1)).toBeEnabled();
    await expect(page.locator('.level-card').first()).toContainText('Replay');
  });

  test('keyboard-only clear and the H hint', async ({ page }) => {
    await seedSave(page);
    await page.goto('/#/play/1');
    const target = solutionFor(0)[0]!;
    const piece = ribbon(page, target);

    let reached = false;
    for (let presses = 0; presses < 14; presses += 1) {
      await page.keyboard.press('Tab');
      const focusedId = await page.evaluate(() =>
        document.activeElement?.getAttribute('data-piece-id'),
      );
      if (focusedId === target) {
        reached = true;
        break;
      }
    }
    expect(reached, 'the first clear ribbon is reachable by Tab').toBe(true);
    await page.keyboard.press('Enter');
    await expect(piece).toBeHidden();
    await expect(page.locator('.board-svg')).toHaveAttribute('aria-busy', 'false');

    await page.keyboard.press('h');
    await expect(page.locator('.live-region[aria-live="polite"]')).toContainText('Try the');
    await expect(page.locator('.ribbon.is-hinted')).toHaveCount(1);
  });

  test('assistive mode names clear and blocked ribbons and describes the list', async ({
    page,
  }) => {
    await seedSave(page, { assistive: true });
    await page.goto('/#/play/1');
    const first = ribbon(page, FIRST.board.pieces[0]!.id);
    await expect(first).toHaveAttribute('aria-label', /(Clear|Blocked)\.$/);

    const describe = page.getByRole('button', { name: 'Describe clear ribbons' });
    await expect(describe).toBeVisible();
    await describe.click();
    await expect(page.locator('.live-region[aria-live="polite"]')).toContainText(
      /(clear ribbon|clear ribbons)/i,
    );
  });

  test('the play header mute control persists sound changes', async ({ page }) => {
    await seedSave(page, { sound: true });
    await page.goto('/#/play/1');
    const mute = page.getByRole('button', { name: 'Mute sound' });
    await expect(mute).toHaveAttribute('aria-pressed', 'false');
    await mute.click();
    await expect(mute).toHaveAttribute('aria-pressed', 'true');
    await expect
      .poll(async () =>
        page.evaluate((key) => {
          const raw = window.localStorage.getItem(key);
          return raw ? (JSON.parse(raw) as { settings: { sound: boolean } }).settings.sound : null;
        }, SAVE_KEY),
      )
      .toBe(false);
    await mute.click();
    await expect(mute).toHaveAttribute('aria-pressed', 'false');
  });

  test('Escape closes settings and restores focus to its trigger', async ({ page }) => {
    await seedSave(page);
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Settings' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Settings' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('settings persist sound, motion, assistive mode, and tips', async ({ page }) => {
    await seedSave(page);
    await page.goto('/');
    await page.screenshot({ path: 'docs/evidence/home-polished-390.png' });
    await page.getByRole('button', { name: 'Settings' }).click();
    const dialog = page.getByRole('dialog', { name: 'Settings' });
    await expect(dialog).toBeVisible();
    await page.screenshot({ path: 'docs/evidence/settings-390.png' });

    await dialog.locator('.settings-toggle', { hasText: 'Sound' }).click();
    await dialog.locator('.settings-choice', { hasText: 'Reduced motion' }).click();
    await dialog.locator('.settings-toggle', { hasText: 'Assistive mode' }).click();
    await dialog.locator('.settings-toggle', { hasText: 'Tips from Nana Pearl' }).click();
    await dialog
      .locator('.dialog-panel')
      .evaluate((panel) => panel.scrollTo({ top: panel.scrollHeight }));
    await page.screenshot({ path: 'docs/evidence/settings-access-390.png' });
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(dialog).toBeHidden();

    const settings = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw
        ? (JSON.parse(raw) as {
            settings: {
              sound: boolean;
              motion: string;
              assistive: boolean;
              tips: boolean;
            };
          }).settings
        : null;
    }, SAVE_KEY);
    expect(settings).toEqual({
      sound: true,
      motion: 'reduced',
      assistive: true,
      tips: true,
      guideVoice: 'nana',
    });

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
    await page.getByRole('button', { name: 'Settings' }).click();
    const reloaded = page.getByRole('dialog', { name: 'Settings' });
    await expect(reloaded.getByRole('checkbox', { name: /^Sound/ })).toBeChecked();
    await expect(reloaded.getByRole('radio', { name: 'Reduced motion' })).toBeChecked();
    await expect(reloaded.getByRole('checkbox', { name: /^Assistive mode/ })).toBeChecked();
    await expect(reloaded.getByRole('checkbox', { name: /^Tips from Nana Pearl/ })).toBeChecked();
  });
});

test.describe('responsive', () => {
  test('the display font swaps in without layout shift', async ({ page }) => {
    await page.addInitScript(() => {
      const scoped = window as unknown as { __cls: number };
      scoped.__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as PerformanceEntry[]) {
          if (entry.entryType === 'layout-shift') {
            const shift = entry as PerformanceEntry & {
              value: number;
              hadRecentInput: boolean;
            };
            if (!shift.hadRecentInput) scoped.__cls += shift.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto('/');
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    const result = await page.evaluate(() => {
      const scoped = window as unknown as { __cls: number };
      return {
        cls: scoped.__cls,
        loaded: document.fonts.check('700 2rem Fredoka'),
      };
    });
    expect(result.loaded).toBe(true);
    expect(result.cls).toBeLessThan(0.01);
  });

  test('390 x 844 is the primary canvas and 320 px never overflows', async ({ page }) => {
    await seedSave(page);
    await page.goto('/#/levels');
    expect(await noHorizontalOverflow(page)).toBe(true);
    await page.screenshot({ path: 'docs/evidence/levels-polished-390.png' });

    await page.goto('/#/play/1');
    await expect(page.locator('.ribbon')).toHaveCount(FIRST.board.pieces.length);
    expect(await noHorizontalOverflow(page)).toBe(true);
    await page.screenshot({ path: 'docs/evidence/play-polished-390.png' });

    await page.setViewportSize({ width: 320, height: 568 });
    expect(await noHorizontalOverflow(page)).toBe(true);
    const header = page.locator('.play-header');
    await expect(header).toBeVisible();
    await expect(page.getByRole('button', { name: /sound/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hint' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
    const clipped = await page.evaluate(() => {
      const width = window.innerWidth;
      return [
        ...document.querySelectorAll<HTMLElement>(
          '.play-header, .play-status, .play-actions, .progress-pill',
        ),
      ].some((node) => {
        const box = node.getBoundingClientRect();
        return box.left < -1 || box.right > width + 1 || box.width <= 0;
      });
    });
    expect(clipped).toBe(false);
    await page.screenshot({ path: 'docs/evidence/play-320.png' });

    await page.goto('/#/levels');
    expect(await noHorizontalOverflow(page)).toBe(true);
    await page.screenshot({ path: 'docs/evidence/levels-320.png' });

    await page.goto('/#/gallery');
    expect(await noHorizontalOverflow(page)).toBe(true);
    await page.screenshot({ path: 'docs/evidence/gallery-320.png' });
  });

  test('a desktop guide bubble does not push the footer out of view', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await seedSave(page, { collisionTipSeen: false, tips: true });
    await page.goto('/#/play/1');
    await ribbon(page, blockedPieceIdFor(0)).click();
    await expect(page.locator('.guide-moment')).toBeVisible();
    const footerBottom = await page.locator('.play-footer').evaluate((node) => {
      return node.getBoundingClientRect().bottom;
    });
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    expect(footerBottom).toBeLessThanOrEqual(viewportHeight + 1);
    await expect(page.locator('.play-footer')).toBeInViewport();
  });
});

test.describe('offline shell', () => {
  test('loads after one visit when the network is gone', async ({ page, context }) => {
    await seedSave(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Arrow Slide/ })).toBeVisible();

    await page.waitForFunction(
      async () => {
        if (!('serviceWorker' in navigator)) return false;
        const registration = await navigator.serviceWorker.ready;
        return registration.active !== null;
      },
      null,
      { timeout: 20_000 },
    );

    // The first navigation installs the worker; reload once so the page is
    // controlled, then cut the network and prove the shell still boots.
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
      timeout: 10_000,
    });
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: /Arrow Slide/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
    await context.setOffline(false);
  });
});

test.describe('motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('reduced motion completes the level with no confetti or shake', async ({
    page,
  }) => {
    await seedSave(page);
    await page.goto('/#/play/1');
    const pieceId = blockedPieceId();
    await ribbon(page, pieceId).click();
    await expect(page.locator('.board-svg')).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('.board-frame.is-shaking')).toHaveCount(0);

    await page.keyboard.press('r');
    await expect(page.locator('.heart-row')).toHaveAttribute(
      'aria-label',
      '3 of 3 hearts remaining',
    );
    await clearLevel(page, 0);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByRole('heading', { name: 'Tangle untangled' })).toBeVisible();
    await expect(page.locator('.star-burst--win')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  });
});

test.describe('accessibility scan', () => {
  const routes: readonly { name: string; path: string }[] = [
    { name: 'home', path: '/' },
    { name: 'levels', path: '/#/levels' },
    { name: 'play', path: '/#/play/1' },
    { name: 'gallery', path: '/#/gallery' },
  ];

  for (const route of routes) {
    test(`${route.name} has no serious or critical axe violations`, async ({
      page,
    }, testInfo) => {
      await seedSave(page);
      await page.goto(route.path);
      await page.locator('[data-screen-heading]').waitFor({ state: 'visible' });
      const violations = await seriousAxeViolations(page);
      await testInfo.attach(`axe-${route.name}.json`, {
        body: JSON.stringify(violations, null, 2),
        contentType: 'application/json',
      });
      expect(
        violations,
        `${route.name}: ${violations.map((v) => `${v.id}: ${v.targets.join(', ')}`).join('; ')}`,
      ).toEqual([]);
    });
  }

  test('progressed levels and gallery have no serious or critical axe violations', async ({
    page,
  }, testInfo) => {
    await seedSave(page, {
      levels: {
        '0': { bestStars: 3, completedAt: '2026-10-27T10:00:00.000Z' },
        '1': { bestStars: 2, completedAt: '2026-10-27T11:00:00.000Z' },
      },
    });
    for (const route of [
      { name: 'levels-progressed', path: '/#/levels' },
      { name: 'gallery-progressed', path: '/#/gallery' },
    ]) {
      await page.goto(route.path);
      await page.locator('[data-screen-heading]').waitFor({ state: 'visible' });
      const violations = await seriousAxeViolations(page);
      await testInfo.attach(`axe-${route.name}.json`, {
        body: JSON.stringify(violations, null, 2),
        contentType: 'application/json',
      });
      expect(
        violations,
        `${route.name}: ${violations.map((v) => `${v.id}: ${v.targets.join(', ')}`).join('; ')}`,
      ).toEqual([]);
    }
  });

  test('settings dialog has no serious or critical axe violations', async ({
    page,
  }, testInfo) => {
    await seedSave(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
    const violations = await seriousAxeViolations(page);
    await testInfo.attach('axe-settings.json', {
      body: JSON.stringify(violations, null, 2),
      contentType: 'application/json',
    });
    expect(
      violations,
      violations.map((v) => `${v.id}: ${v.targets.join(', ')}`).join('; '),
    ).toEqual([]);
  });
});
