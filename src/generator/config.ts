import type { ChapterNumber } from '../content/schema';

export type GeneratorAlgorithm = 'organic' | 'weave';

export interface GenerationProfile {
  readonly algorithm: GeneratorAlgorithm;
  readonly minLength: number;
  readonly maxLength: number;
  readonly minClear: number;
  readonly maxClear: number;
  readonly samplesPerPiece: number;
  readonly blockBias: number;
  readonly requireBlock: boolean;
}

/**
 * Curation thresholds. Changing these invalidates the committed levels, and
 * the regeneration test is intended to catch that.
 */
export const CHAPTER_GENERATION: Readonly<Record<ChapterNumber, GenerationProfile>> = {
  1: {
    algorithm: 'organic',
    minLength: 3,
    maxLength: 5,
    minClear: 2,
    maxClear: 4,
    samplesPerPiece: 180,
    blockBias: 0.35,
    requireBlock: false,
  },
  2: {
    algorithm: 'organic',
    minLength: 2,
    maxLength: 5,
    minClear: 2,
    maxClear: 3,
    samplesPerPiece: 360,
    blockBias: 0.75,
    requireBlock: false,
  },
  3: {
    algorithm: 'weave',
    minLength: 2,
    maxLength: 4,
    minClear: 1,
    maxClear: 2,
    samplesPerPiece: 0,
    blockBias: 1,
    requireBlock: true,
  },
};
