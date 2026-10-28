import type { LevelMetrics } from '../engine/metrics';
import type { Board, RibbonColor } from '../engine/types';

export type ChapterNumber = 1 | 2 | 3;

export interface Chapter {
  readonly id: ChapterNumber;
  readonly numeral: string;
  readonly title: string;
  readonly subtitle: string;
  readonly accent: RibbonColor;
  readonly width: number;
  readonly height: number;
  readonly minPieces: number;
  readonly maxPieces: number;
  readonly minClear: number;
  readonly maxClear: number;
  readonly difficultyLabel: string;
}

export const CHAPTERS: readonly Chapter[] = [
  {
    id: 1,
    numeral: 'I',
    title: 'First Light',
    subtitle: 'Small tangles, soft landings. Learn to look twice.',
    accent: 'rose',
    width: 6,
    height: 6,
    minPieces: 6,
    maxPieces: 9,
    minClear: 2,
    maxClear: 4,
    difficultyLabel: 'Gentle',
  },
  {
    id: 2,
    numeral: 'II',
    title: 'Deep Current',
    subtitle: 'The ribbons begin to lean on one another.',
    accent: 'aqua',
    width: 7,
    height: 7,
    minPieces: 9,
    maxPieces: 12,
    minClear: 2,
    maxClear: 3,
    difficultyLabel: 'Steady',
  },
  {
    id: 3,
    numeral: 'III',
    title: 'Midnight Sky',
    subtitle: 'Dense knots, narrow paths, the whole sky at stake.',
    accent: 'lilac',
    width: 8,
    height: 8,
    minPieces: 12,
    maxPieces: 16,
    minClear: 1,
    maxClear: 2,
    difficultyLabel: 'Deep',
  },
];

export function chapterFor(levelIndex: number): Chapter {
  const chapter = CHAPTERS[Math.floor(levelIndex / 4)];
  if (!chapter) {
    throw new RangeError(`No chapter for level index ${levelIndex}`);
  }
  return chapter;
}

export function chapterById(id: ChapterNumber): Chapter {
  const chapter = CHAPTERS.find((candidate) => candidate.id === id);
  if (!chapter) {
    throw new RangeError(`No chapter ${id}`);
  }
  return chapter;
}

export interface StarNode {
  /** Normalised 0..1 coordinates in the constellation card. */
  readonly x: number;
  readonly y: number;
  readonly size: number;
}

export interface Constellation {
  readonly id: string;
  readonly name: string;
  readonly caption: string;
  readonly accent: RibbonColor;
  readonly stars: readonly StarNode[];
  /** Pairs of indices into `stars`. */
  readonly lines: readonly (readonly [number, number])[];
}

export interface Level {
  /** Zero-based position in the campaign. */
  readonly index: number;
  readonly chapter: ChapterNumber;
  readonly title: string;
  readonly constellationId: string;
  readonly seed: number;
  readonly board: Board;
  readonly metrics: LevelMetrics;
}
