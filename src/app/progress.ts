import type { MotionSetting } from './motion';
import type { StorageAdapter } from './storage';

export const SAVE_VERSION = 1 as const;
export const SAVE_KEY = 'nana-pearl-arrow-slide.save';

export interface Settings {
  readonly sound: boolean;
  readonly motion: MotionSetting;
  readonly assistive: boolean;
  readonly tips: boolean;
}

export interface TutorialFlags {
  readonly introSeen: boolean;
  readonly collisionTipSeen: boolean;
  readonly heartsTipSeen: boolean;
  readonly winTipSeen: boolean;
  readonly hintTipSeen: boolean;
}

export type TutorialFlag = keyof TutorialFlags;

export interface LevelProgress {
  readonly bestStars: 1 | 2 | 3;
  readonly completedAt: string;
}

export interface SaveData {
  readonly version: typeof SAVE_VERSION;
  /** Keyed by zero-based level index as a string. */
  readonly levels: Readonly<Record<string, LevelProgress>>;
  readonly settings: Settings;
  readonly tutorial: TutorialFlags;
  readonly lastPlayed: number | null;
}

export function defaultSettings(): Settings {
  return {
    sound: true,
    motion: 'system',
    assistive: false,
    tips: true,
  };
}

export function defaultTutorial(): TutorialFlags {
  return {
    introSeen: false,
    collisionTipSeen: false,
    heartsTipSeen: false,
    winTipSeen: false,
    hintTipSeen: false,
  };
}

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    levels: {},
    settings: defaultSettings(),
    tutorial: defaultTutorial(),
    lastPlayed: null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isStar(value: unknown): value is 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3;
}

function isMotionSetting(value: unknown): value is MotionSetting {
  return value === 'system' || value === 'reduced' || value === 'full';
}

function isLevelKey(value: string): boolean {
  return /^(0|[1-9]\d*)$/.test(value);
}

function parseLevelProgress(value: unknown): LevelProgress | null {
  if (!isRecord(value)) return null;
  if (!isStar(value.bestStars)) return null;
  if (typeof value.completedAt !== 'string') return null;
  if (Number.isNaN(Date.parse(value.completedAt))) return null;
  return { bestStars: value.bestStars, completedAt: value.completedAt };
}

function parseLevels(
  value: unknown,
  levelCount: number,
): Record<string, LevelProgress> | null {
  if (!isRecord(value)) return null;
  const levels: Record<string, LevelProgress> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!isLevelKey(key)) return null;
    const index = Number(key);
    if (!Number.isInteger(index) || index < 0 || index >= levelCount) return null;
    const progress = parseLevelProgress(entry);
    if (!progress) return null;
    levels[key] = progress;
  }
  return levels;
}

function parseSettings(value: unknown): Settings | null {
  if (!isRecord(value)) return null;
  if (typeof value.sound !== 'boolean') return null;
  if (!isMotionSetting(value.motion)) return null;
  if (typeof value.assistive !== 'boolean') return null;
  if (typeof value.tips !== 'boolean') return null;
  return {
    sound: value.sound,
    motion: value.motion,
    assistive: value.assistive,
    tips: value.tips,
  };
}

function parseTutorial(value: unknown): TutorialFlags | null {
  if (!isRecord(value)) return null;
  const introSeen = value.introSeen;
  const collisionTipSeen = value.collisionTipSeen;
  const heartsTipSeen = value.heartsTipSeen;
  const winTipSeen = value.winTipSeen;
  const hintTipSeen = value.hintTipSeen;
  if (
    typeof introSeen !== 'boolean' ||
    typeof collisionTipSeen !== 'boolean' ||
    typeof heartsTipSeen !== 'boolean' ||
    typeof winTipSeen !== 'boolean' ||
    typeof hintTipSeen !== 'boolean'
  ) {
    return null;
  }
  return {
    introSeen,
    collisionTipSeen,
    heartsTipSeen,
    winTipSeen,
    hintTipSeen,
  };
}

/**
 * Version is the migration gate. Version 1 is the only shipped schema; a
 * future or unknown version is discarded rather than half-read.
 */
function migrate(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  if (value.version !== SAVE_VERSION) return null;
  return value;
}

export function parseSaveText(text: string | null, levelCount: number): SaveData {
  if (text === null) return defaultSave();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return defaultSave();
  }
  const migrated = migrate(raw);
  if (!migrated) return defaultSave();

  const levels = parseLevels(migrated.levels, levelCount);
  const settings = parseSettings(migrated.settings);
  const tutorial = parseTutorial(migrated.tutorial);
  if (!levels || !settings || !tutorial) return defaultSave();

  let lastPlayed: number | null = null;
  if (migrated.lastPlayed !== null) {
    if (
      typeof migrated.lastPlayed !== 'number' ||
      !Number.isInteger(migrated.lastPlayed) ||
      migrated.lastPlayed < 0 ||
      migrated.lastPlayed >= levelCount
    ) {
      return defaultSave();
    }
    lastPlayed = migrated.lastPlayed;
  }

  return {
    version: SAVE_VERSION,
    levels,
    settings,
    tutorial,
    lastPlayed,
  };
}

export function recordCompletion(
  save: SaveData,
  levelIndex: number,
  stars: 1 | 2 | 3,
  completedAt: string,
  levelCount: number,
): SaveData {
  if (!isStar(stars)) return save;
  if (!Number.isInteger(levelIndex) || levelIndex < 0 || levelIndex >= levelCount) {
    return save;
  }
  const key = String(levelIndex);
  const existing = save.levels[key];
  if (existing && existing.bestStars >= stars) return save;

  return {
    ...save,
    levels: {
      ...save.levels,
      [key]: {
        bestStars: stars,
        completedAt: existing ? existing.completedAt : completedAt,
      },
    },
  };
}

export function setLastPlayed(
  save: SaveData,
  levelIndex: number,
  levelCount: number,
): SaveData {
  if (!Number.isInteger(levelIndex) || levelIndex < 0 || levelIndex >= levelCount) {
    return save;
  }
  if (save.lastPlayed === levelIndex) return save;
  return { ...save, lastPlayed: levelIndex };
}

export function updateSettings(
  save: SaveData,
  patch: Partial<Settings>,
): SaveData {
  return {
    ...save,
    settings: { ...save.settings, ...patch },
  };
}

export function markTutorial(
  save: SaveData,
  flag: TutorialFlag,
): SaveData {
  if (save.tutorial[flag]) return save;
  return {
    ...save,
    tutorial: { ...save.tutorial, [flag]: true },
  };
}

export function bestStarsFor(save: SaveData, levelIndex: number): number {
  return save.levels[String(levelIndex)]?.bestStars ?? 0;
}

export function isLevelComplete(save: SaveData, levelIndex: number): boolean {
  return bestStarsFor(save, levelIndex) > 0;
}

export function isLevelUnlocked(
  save: SaveData,
  levelIndex: number,
  levelCount: number,
): boolean {
  if (!Number.isInteger(levelIndex) || levelIndex < 0 || levelIndex >= levelCount) {
    return false;
  }
  if (levelIndex === 0) return true;
  // A completed level is always replayable, even if a corrupt save left a gap.
  if (isLevelComplete(save, levelIndex)) return true;
  return isLevelComplete(save, levelIndex - 1);
}

export function completedCount(save: SaveData): number {
  return Object.keys(save.levels).length;
}

export function totalStars(save: SaveData): number {
  let total = 0;
  for (const progress of Object.values(save.levels)) total += progress.bestStars;
  return total;
}

/** The level a Continue action should open, if any. */
export function continueLevel(
  save: SaveData,
  levelCount: number,
): number | null {
  const last = save.lastPlayed;
  if (
    last !== null &&
    isLevelUnlocked(save, last, levelCount) &&
    !isLevelComplete(save, last)
  ) {
    return last;
  }
  for (let index = 0; index < levelCount; index += 1) {
    if (isLevelUnlocked(save, index, levelCount) && !isLevelComplete(save, index)) {
      return index;
    }
  }
  if (last !== null && isLevelUnlocked(save, last, levelCount)) return last;
  return null;
}

export class ProgressStore {
  private save: SaveData;
  private writable: boolean;
  private readonly storage: StorageAdapter | null;
  private readonly levelCount: number;
  private readonly key: string;

  constructor(
    storage: StorageAdapter | null,
    levelCount: number,
    key = SAVE_KEY,
  ) {
    this.storage = storage;
    this.levelCount = levelCount;
    this.key = key;
    this.writable = storage !== null;
    this.save = this.read();
  }

  get data(): SaveData {
    return this.save;
  }

  get persistent(): boolean {
    return this.storage !== null && this.writable;
  }

  bestStars(levelIndex: number): number {
    return bestStarsFor(this.save, levelIndex);
  }

  isUnlocked(levelIndex: number): boolean {
    return isLevelUnlocked(this.save, levelIndex, this.levelCount);
  }

  get totalStars(): number {
    return totalStars(this.save);
  }

  get completedCount(): number {
    return completedCount(this.save);
  }

  continueLevel(): number | null {
    return continueLevel(this.save, this.levelCount);
  }

  recordCompletion(
    levelIndex: number,
    stars: 1 | 2 | 3,
    completedAt = new Date().toISOString(),
  ): void {
    this.update((save) => recordCompletion(save, levelIndex, stars, completedAt, this.levelCount));
  }

  setLastPlayed(levelIndex: number): void {
    this.update((save) => setLastPlayed(save, levelIndex, this.levelCount));
  }

  setSettings(patch: Partial<Settings>): void {
    this.update((save) => updateSettings(save, patch));
  }

  markTutorial(flag: TutorialFlag): void {
    this.update((save) => markTutorial(save, flag));
  }

  reset(): void {
    this.save = defaultSave();
    this.persist();
  }

  private read(): SaveData {
    if (!this.storage) return defaultSave();
    try {
      return parseSaveText(this.storage.getItem(this.key), this.levelCount);
    } catch {
      this.writable = false;
      return defaultSave();
    }
  }

  private update(mutator: (save: SaveData) => SaveData): void {
    const next = mutator(this.save);
    if (next === this.save) return;
    this.save = next;
    this.persist();
  }

  private persist(): void {
    if (!this.storage || !this.writable) return;
    try {
      this.storage.setItem(this.key, JSON.stringify(this.save));
    } catch {
      this.writable = false;
    }
  }
}
