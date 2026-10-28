import type { Page } from '@playwright/test';
import { defaultSave, SAVE_KEY, type SaveData } from '../src/app/progress';

export interface SeedOptions {
  readonly levels?: SaveData['levels'];
  readonly assistive?: boolean;
  readonly sound?: boolean;
  readonly tips?: boolean;
  readonly motion?: SaveData['settings']['motion'];
  readonly tutorialDone?: boolean;
  readonly lastPlayed?: number | null;
}

export function makeSave(options: SeedOptions = {}): SaveData {
  const base = defaultSave();
  return {
    ...base,
    levels: options.levels ?? {},
    settings: {
      ...base.settings,
      sound: options.sound ?? false,
      tips: options.tips ?? false,
      assistive: options.assistive ?? false,
      motion: options.motion ?? 'system',
    },
    tutorial: {
      ...base.tutorial,
      introSeen: options.tutorialDone ?? true,
      tutorialDone: options.tutorialDone ?? true,
      collisionTipSeen: options.tutorialDone ?? true,
      heartsTipSeen: options.tutorialDone ?? true,
      winTipSeen: options.tutorialDone ?? true,
      hintTipSeen: options.tutorialDone ?? true,
    },
    lastPlayed: options.lastPlayed ?? null,
  };
}

/**
 * Seeds a save before the app boots, but never overwrites an existing one:
 * reload-persistence tests must see what the previous session wrote. Each
 * Playwright test gets a fresh browser context, so tests stay isolated.
 */
export async function seedSave(page: Page, options: SeedOptions = {}): Promise<void> {
  const save = makeSave(options);
  await page.addInitScript(
    ({ key, value }) => {
      try {
        if (window.localStorage.getItem(key) === null) {
          window.localStorage.setItem(key, value);
        }
      } catch {
        // Private-mode storage failure is part of the app contract; E2E runs
        // in a normal context, so a failure here should not mask the test.
      }
    },
    { key: SAVE_KEY, value: JSON.stringify(save) },
  );
}

export async function noHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth <= window.innerWidth + 1 &&
      document.body.scrollWidth <= window.innerWidth + 1,
  );
}
