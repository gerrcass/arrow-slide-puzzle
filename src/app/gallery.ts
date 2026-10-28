import type { Constellation, Level } from '../content/schema';
import { constellationById } from '../content/constellations';

export interface GalleryCard {
  readonly levelIndex: number;
  /** Human-facing one-based level number. */
  readonly levelNumber: number;
  readonly levelTitle: string;
  readonly constellation: Constellation | null;
  readonly collected: boolean;
  readonly bestStars: number;
}

/**
 * Gallery state is derived, never stored separately. A completed tangle is a
 * collected constellation; the star result only decorates the card.
 */
export function galleryCards(
  levels: readonly Level[],
  collected: (levelIndex: number) => boolean,
  bestStars: (levelIndex: number) => number,
): readonly GalleryCard[] {
  return levels.map((level) => ({
    levelIndex: level.index,
    levelNumber: level.index + 1,
    levelTitle: level.title,
    constellation: constellationById(level.constellationId),
    collected: collected(level.index),
    bestStars: bestStars(level.index),
  }));
}

export function collectedCardCount(cards: readonly GalleryCard[]): number {
  return cards.filter((card) => card.collected).length;
}
