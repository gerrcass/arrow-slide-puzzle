import { describe, expect, it } from 'vitest';
import { solveBoard, verifyRemovalOrder } from '../engine/solver';
import { constellationById } from './constellations';
import { LEVELS } from './levels';
import { validateLevels } from './validate';

describe('committed level content', () => {
  it('contains only valid boards', () => {
    expect(validateLevels(LEVELS)).toEqual([]);
  });

  it('every level is solver-verified', () => {
    for (const level of LEVELS) {
      const order = solveBoard(level.board);
      expect(order, `level ${level.index + 1} should be solvable`).not.toBeNull();
      expect(order).toHaveLength(level.board.pieces.length);
      const reverse = [...level.board.pieces].reverse().map((piece) => piece.id);
      expect(verifyRemovalOrder(level.board, reverse)).toBe(true);
    }
  });

  it('every level references an existing constellation', () => {
    for (const level of LEVELS) {
      expect(constellationById(level.constellationId)).not.toBeNull();
    }
  });
});
