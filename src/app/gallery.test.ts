import { describe, expect, it } from 'vitest';
import { LEVELS } from '../content/levels';
import { defaultSave, isConstellationCollected, recordCompletion } from './progress';
import { collectedCardCount, galleryCards } from './gallery';

const LEVEL_COUNT = 12;
const COMPLETED_AT = '2026-10-27T10:00:00.000Z';

function cardsFrom(save: ReturnType<typeof defaultSave>) {
  return galleryCards(
    LEVELS,
    (index) => isConstellationCollected(save, index, LEVEL_COUNT),
    (index) => save.levels[String(index)]?.bestStars ?? 0,
  );
}

describe('constellation gallery state', () => {
  it('starts with every constellation locked behind a silhouette', () => {
    const cards = cardsFrom(defaultSave());
    expect(cards).toHaveLength(12);
    expect(cards.every((card) => !card.collected)).toBe(true);
    expect(cards.every((card) => card.bestStars === 0)).toBe(true);
    expect(collectedCardCount(cards)).toBe(0);
    expect(cards.map((card) => card.levelNumber)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });

  it('collects exactly the completed constellation', () => {
    const save = recordCompletion(defaultSave(), 0, 2, COMPLETED_AT, LEVEL_COUNT);
    const cards = cardsFrom(save);

    expect(cards[0]?.collected).toBe(true);
    expect(cards[0]?.bestStars).toBe(2);
    expect(cards[0]?.constellation?.name).toBe('The Pearl');
    expect(cards.filter((card) => card.collected)).toHaveLength(1);
    expect(collectedCardCount(cards)).toBe(1);
    expect(cards[1]?.collected).toBe(false);
  });

  it('stays collected when the tangle is replayed for fewer stars', () => {
    let save = recordCompletion(defaultSave(), 2, 3, COMPLETED_AT, LEVEL_COUNT);
    save = recordCompletion(save, 2, 1, COMPLETED_AT, LEVEL_COUNT);
    const cards = cardsFrom(save);

    expect(cards[2]?.collected).toBe(true);
    expect(cards[2]?.bestStars).toBe(3);
    expect(collectedCardCount(cards)).toBe(1);
  });
});
