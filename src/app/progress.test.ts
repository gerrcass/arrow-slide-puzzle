import { describe, expect, it } from 'vitest';
import {
  SAVE_KEY,
  SAVE_VERSION,
  ProgressStore,
  bestStarsFor,
  completedCount,
  continueLevel,
  defaultSave,
  isConstellationCollected,
  isLevelUnlocked,
  parseSaveText,
  recordCompletion,
  setLastPlayed,
  totalStars,
} from './progress';
import { MemoryStorage, type StorageAdapter } from './storage';

const LEVEL_COUNT = 12;
const FIRST = '2026-10-27T10:00:00.000Z';
const SECOND = '2026-10-27T11:00:00.000Z';

function storeWith(initial?: Readonly<Record<string, string>>): {
  store: ProgressStore;
  storage: MemoryStorage;
} {
  const storage = new MemoryStorage(initial);
  return { store: new ProgressStore(storage, LEVEL_COUNT), storage };
}

describe('save schema', () => {
  it('starts with level one open and no stars', () => {
    const save = defaultSave();
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.levels).toEqual({});
    expect(save.settings.motion).toBe('system');
    expect(save.settings.guideVoice).toBe('nana');
    expect(save.settings.sound).toBe(true);
    expect(save.settings.assistive).toBe(false);
    expect(save.tutorial.introSeen).toBe(false);
    expect(save.tutorial.tutorialDone).toBe(false);
    expect(save.lastPlayed).toBeNull();
    expect(isLevelUnlocked(save, 0, LEVEL_COUNT)).toBe(true);
    expect(isLevelUnlocked(save, 1, LEVEL_COUNT)).toBe(false);
    expect(bestStarsFor(save, 0)).toBe(0);
    expect(totalStars(save)).toBe(0);
    expect(completedCount(save)).toBe(0);
  });

  it('round-trips a completed, configured save', () => {
    const { store, storage } = storeWith();
    store.recordCompletion(0, 3, FIRST);
    store.recordCompletion(1, 2, SECOND);
    store.setLastPlayed(2);
    store.setSettings({ motion: 'reduced', assistive: true });
    store.setSettings({ guideVoice: 'brief' });
    store.markTutorial('introSeen');
    store.markTutorial('tutorialDone');

    const reloaded = new ProgressStore(storage, LEVEL_COUNT);
    expect(reloaded.bestStars(0)).toBe(3);
    expect(reloaded.bestStars(1)).toBe(2);
    expect(reloaded.data.lastPlayed).toBe(2);
    expect(reloaded.data.settings.motion).toBe('reduced');
    expect(reloaded.data.settings.assistive).toBe(true);
    expect(reloaded.data.settings.guideVoice).toBe('brief');
    expect(reloaded.data.tutorial.introSeen).toBe(true);
    expect(reloaded.data.tutorial.tutorialDone).toBe(true);
    expect(reloaded.totalStars).toBe(5);
    expect(reloaded.completedCount).toBe(2);
  });

  it('unlocks level n only after n-1 is complete', () => {
    let save = defaultSave();
    expect(isLevelUnlocked(save, 0, LEVEL_COUNT)).toBe(true);
    expect(isLevelUnlocked(save, 1, LEVEL_COUNT)).toBe(false);

    save = recordCompletion(save, 0, 1, FIRST, LEVEL_COUNT);
    expect(isLevelUnlocked(save, 1, LEVEL_COUNT)).toBe(true);
    expect(isLevelUnlocked(save, 2, LEVEL_COUNT)).toBe(false);

    save = recordCompletion(save, 1, 3, SECOND, LEVEL_COUNT);
    expect(isLevelUnlocked(save, 2, LEVEL_COUNT)).toBe(true);
    expect(isLevelUnlocked(save, 3, LEVEL_COUNT)).toBe(false);
  });

  it('keeps a completed level replayable even if a save has a gap', () => {
    const save = recordCompletion(defaultSave(), 4, 2, FIRST, LEVEL_COUNT);
    expect(isLevelUnlocked(save, 4, LEVEL_COUNT)).toBe(true);
    expect(isLevelUnlocked(save, 3, LEVEL_COUNT)).toBe(false);
    expect(isLevelUnlocked(save, 5, LEVEL_COUNT)).toBe(true);
  });

  it('collects a constellation from completion, independent of stars', () => {
    const save = recordCompletion(defaultSave(), 0, 1, FIRST, LEVEL_COUNT);
    expect(isConstellationCollected(save, 0, LEVEL_COUNT)).toBe(true);
    expect(isConstellationCollected(save, 1, LEVEL_COUNT)).toBe(false);
    expect(isConstellationCollected(save, -1, LEVEL_COUNT)).toBe(false);
    expect(isConstellationCollected(save, LEVEL_COUNT, LEVEL_COUNT)).toBe(false);
  });

  it('never lowers best stars and keeps the first completion date', () => {
    let save = defaultSave();
    save = recordCompletion(save, 0, 2, FIRST, LEVEL_COUNT);
    expect(bestStarsFor(save, 0)).toBe(2);
    save = recordCompletion(save, 0, 1, SECOND, LEVEL_COUNT);
    expect(bestStarsFor(save, 0)).toBe(2);
    expect(save.levels['0']?.completedAt).toBe(FIRST);
    save = recordCompletion(save, 0, 3, SECOND, LEVEL_COUNT);
    expect(bestStarsFor(save, 0)).toBe(3);
    expect(save.levels['0']?.completedAt).toBe(FIRST);
  });

  it('ignores completions outside the campaign or with invalid stars', () => {
    const save = defaultSave();
    expect(recordCompletion(save, -1, 3, FIRST, LEVEL_COUNT)).toBe(save);
    expect(recordCompletion(save, 12, 3, FIRST, LEVEL_COUNT)).toBe(save);
    expect(recordCompletion(save, 0, 0 as 1, FIRST, LEVEL_COUNT)).toBe(save);
    expect(recordCompletion(save, 0, 4 as 1, FIRST, LEVEL_COUNT)).toBe(save);
  });

  it('continues at the last unfinished level, then the first unfinished one', () => {
    let save = defaultSave();
    expect(continueLevel(save, LEVEL_COUNT)).toBe(0);
    save = recordCompletion(save, 0, 3, FIRST, LEVEL_COUNT);
    expect(continueLevel(save, LEVEL_COUNT)).toBe(1);
    save = setLastPlayed(save, 1, LEVEL_COUNT);
    expect(continueLevel(save, LEVEL_COUNT)).toBe(1);
    save = recordCompletion(save, 1, 2, SECOND, LEVEL_COUNT);
    expect(continueLevel(save, LEVEL_COUNT)).toBe(2);
  });
});

describe('saved progress store', () => {
  it('persists stars and unlocks across store instances', () => {
    const { store, storage } = storeWith();
    store.recordCompletion(0, 3, FIRST);
    expect(store.isUnlocked(1)).toBe(true);
    expect(store.isUnlocked(2)).toBe(false);

    const reloaded = new ProgressStore(storage, LEVEL_COUNT);
    expect(reloaded.bestStars(0)).toBe(3);
    expect(reloaded.isUnlocked(1)).toBe(true);
    expect(reloaded.isUnlocked(2)).toBe(false);
  });

  it('resets campaign progress and keeps stored preferences', () => {
    const { store } = storeWith();
    store.recordCompletion(0, 3, FIRST);
    store.setSettings({ sound: false });
    store.reset();
    expect(store.bestStars(0)).toBe(0);
    expect(store.data.settings.sound).toBe(false);
    expect(store.isUnlocked(1)).toBe(false);
  });

  it('preserves accessibility and guide preferences when resetting progress', () => {
    const { store } = storeWith();
    store.setSettings({
      sound: false,
      motion: 'reduced',
      assistive: true,
      tips: false,
      guideVoice: 'brief',
    });
    store.recordCompletion(0, 3, FIRST);
    store.reset();

    expect(store.bestStars(0)).toBe(0);
    expect(store.data.settings).toMatchObject({
      sound: false,
      motion: 'reduced',
      assistive: true,
      tips: false,
      guideVoice: 'brief',
    });
  });

  it('replays the tutorial without erasing stars', () => {
    const { store } = storeWith();
    store.recordCompletion(0, 3, FIRST);
    store.setSettings({ tips: false });
    store.markTutorial('introSeen');
    store.markTutorial('tutorialDone');
    store.resetTutorial();

    expect(store.bestStars(0)).toBe(3);
    expect(store.data.settings.tips).toBe(true);
    expect(store.data.tutorial.introSeen).toBe(false);
    expect(store.data.tutorial.tutorialDone).toBe(false);
  });

  it('falls back to a default save on corrupt JSON', () => {
    const { store } = storeWith({ [SAVE_KEY]: '{ not json' });
    expect(store.bestStars(0)).toBe(0);
    expect(store.isUnlocked(1)).toBe(false);
    store.recordCompletion(0, 2, FIRST);
    expect(store.bestStars(0)).toBe(2);
  });

  it('discards saves from an unknown version', () => {
    const save = defaultSave();
    const wrong = JSON.stringify({ ...save, version: 99 });
    const { store } = storeWith({ [SAVE_KEY]: wrong });
    expect(store.data).toEqual(defaultSave());
  });
  it('discards malformed entries rather than half-reading them', () => {
    const save = defaultSave();
    const malformed = JSON.stringify({
      ...save,
      levels: { '0': { bestStars: 9, completedAt: FIRST } },
    });
    expect(parseSaveText(malformed, LEVEL_COUNT)).toEqual(defaultSave());

    const outOfRange = JSON.stringify({
      ...save,
      levels: { '20': { bestStars: 2, completedAt: FIRST } },
    });
    expect(parseSaveText(outOfRange, LEVEL_COUNT)).toEqual(defaultSave());
  });

  it('keeps playing in memory when storage throws', () => {
    const failing: StorageAdapter = {
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
      removeItem() {
        throw new Error('blocked');
      },
    };
    const store = new ProgressStore(failing, LEVEL_COUNT);
    expect(store.persistent).toBe(false);
    expect(() => store.recordCompletion(0, 3, FIRST)).not.toThrow();
    expect(store.bestStars(0)).toBe(3);
    expect(store.isUnlocked(1)).toBe(true);
    expect(store.totalStars).toBe(3);
  });

  it('keeps the in-memory result when a write fails', () => {
    const readOnly: StorageAdapter = {
      getItem() {
        return null;
      },
      setItem() {
        throw new Error('quota');
      },
      removeItem() {
        // no-op
      },
    };
    const store = new ProgressStore(readOnly, LEVEL_COUNT);
    store.recordCompletion(0, 2, FIRST);
    expect(store.bestStars(0)).toBe(2);
    expect(store.persistent).toBe(false);
  });

  it('migrates the known version and rejects future ones', () => {
    const current = JSON.stringify(defaultSave());
    expect(parseSaveText(current, LEVEL_COUNT)).toEqual(defaultSave());
    expect(parseSaveText(null, LEVEL_COUNT)).toEqual(defaultSave());
    const future = JSON.stringify({ ...defaultSave(), version: 3 });
    expect(parseSaveText(future, LEVEL_COUNT)).toEqual(defaultSave());
  });

  it('migrates a version 1 save with guide defaults intact', () => {
    const v1 = JSON.stringify({
      version: 1,
      levels: {
        '0': { bestStars: 2, completedAt: FIRST },
      },
      settings: {
        sound: false,
        motion: 'reduced',
        assistive: true,
        tips: false,
      },
      tutorial: {
        introSeen: true,
        collisionTipSeen: true,
        heartsTipSeen: false,
        winTipSeen: false,
        hintTipSeen: false,
      },
      lastPlayed: 0,
    });

    const save = parseSaveText(v1, LEVEL_COUNT);
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.levels['0']?.bestStars).toBe(2);
    expect(save.settings.sound).toBe(false);
    expect(save.settings.guideVoice).toBe('nana');
    expect(save.tutorial.introSeen).toBe(true);
    expect(save.tutorial.tutorialDone).toBe(false);
    expect(save.tutorial.collisionTipSeen).toBe(true);
  });
});
