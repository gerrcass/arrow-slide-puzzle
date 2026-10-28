import { describe, expect, it } from 'vitest';
import { chainBoard, makeBoard, makePiece } from './fixtures';
import {
  clearedCount,
  clearPieces,
  hintFor,
  resetAttempt,
  settleAttempt,
  starsFor,
  startAttempt,
  tapRibbon,
  type Attempt,
} from './session';

function settle(attempt: Attempt): Attempt {
  return settleAttempt(attempt).attempt;
}

describe('attempt lifecycle', () => {
  it('starts idle with three hearts and every ribbon on the board', () => {
    const attempt = startAttempt(chainBoard());
    expect(attempt.status).toBe('idle');
    expect(attempt.hearts).toBe(3);
    expect(attempt.remaining).toHaveLength(2);
    expect(attempt.cleared).toHaveLength(0);
    expect(attempt.resolution).toBeNull();
  });

  it('a clear removes exactly one ribbon and waits for the slide to finish', () => {
    const attempt = startAttempt(chainBoard());
    const result = tapRibbon(attempt, 'front');
    expect(result.attempt.remaining.map((piece) => piece.id)).toEqual(['back']);
    expect(result.attempt.hearts).toBe(3);
    expect(result.attempt.status).toBe('resolving');
    expect(result.attempt.resolution).toMatchObject({ kind: 'slide', steps: 2 });
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.type).toBe('slide');
    expect(result.attempt.cleared.map((piece) => piece.id)).toEqual(['front']);
  });

  it('settling an ordinary slide returns the board to idle', () => {
    const attempt = settle(tapRibbon(startAttempt(chainBoard()), 'front').attempt);
    expect(attempt.status).toBe('idle');
    expect(attempt.resolution).toBeNull();
  });

  it('ignores taps while the board is resolving', () => {
    const first = tapRibbon(startAttempt(chainBoard()), 'front');
    const second = tapRibbon(first.attempt, 'back');
    expect(second.events).toEqual([]);
    expect(second.attempt).toBe(first.attempt);
  });

  it('a collision costs exactly one heart and does not change occupancy', () => {
    const attempt = startAttempt(chainBoard());
    const result = tapRibbon(attempt, 'back');
    expect(result.attempt.hearts).toBe(2);
    expect(result.attempt.remaining).toEqual(attempt.remaining);
    expect(result.attempt.status).toBe('resolving');
    expect(result.events).toHaveLength(1);
    expect(result.events[0]).toMatchObject({
      type: 'collision',
      blockerId: 'front',
      offset: 1,
    });
    expect(result.attempt.resolution).toMatchObject({
      kind: 'collision',
      blockerId: 'front',
    });
  });

  it('settling a collision returns to idle while hearts remain', () => {
    const result = tapRibbon(startAttempt(chainBoard()), 'back');
    const settled = settleAttempt(result.attempt);
    expect(settled.attempt.status).toBe('idle');
    expect(settled.events).toEqual([]);
  });

  it('loses after the third collision and never drops below zero hearts', () => {
    let attempt = startAttempt(chainBoard());
    for (let index = 0; index < 3; index += 1) {
      attempt = settle(tapRibbon(attempt, 'back').attempt);
    }
    expect(attempt.hearts).toBe(0);
    expect(attempt.status).toBe('lost');

    const extra = tapRibbon(attempt, 'back');
    expect(extra.attempt.hearts).toBe(0);
    expect(extra.attempt).toBe(attempt);
  });

  it('wins only after the last slide resolves, with stars equal to hearts', () => {
    const onePiece = makeBoard(4, 4, [
      makePiece('only', [
        [0, 0],
        [1, 0],
      ]),
    ]);
    const result = tapRibbon(startAttempt(onePiece), 'only');
    expect(result.attempt.status).toBe('resolving');
    expect(result.events.map((event) => event.type)).toEqual(['slide']);

    const settled = settleAttempt(result.attempt);
    expect(settled.attempt.status).toBe('won');
    expect(settled.events).toEqual([{ type: 'won', stars: 3 }]);
    expect(starsFor(settled.attempt)).toBe(3);
    expect(settled.attempt.cleared).toHaveLength(1);
  });

  it('awards stars for hearts remaining on the win', () => {
    let attempt = startAttempt(chainBoard());
    attempt = settle(tapRibbon(attempt, 'back').attempt);
    attempt = settle(tapRibbon(attempt, 'front').attempt);
    expect(attempt.hearts).toBe(2);
    expect(attempt.status).toBe('idle');
    attempt = settle(tapRibbon(attempt, 'back').attempt);
    expect(attempt.status).toBe('won');
    expect(starsFor(attempt)).toBe(2);
  });

  it('reset restores pieces, hearts, and idle state', () => {
    let attempt = settle(tapRibbon(startAttempt(chainBoard()), 'back').attempt);
    attempt = settle(tapRibbon(attempt, 'front').attempt);
    expect(attempt.hearts).toBe(2);
    expect(attempt.cleared).toHaveLength(1);

    const reset = resetAttempt(attempt);
    expect(reset.status).toBe('idle');
    expect(reset.hearts).toBe(3);
    expect(reset.remaining).toHaveLength(2);
    expect(reset.cleared).toHaveLength(0);
    expect(clearedCount(reset)).toBe(0);
  });

  it('reset after a loss starts a fresh attempt', () => {
    let attempt = startAttempt(chainBoard());
    for (let index = 0; index < 3; index += 1) {
      attempt = settle(tapRibbon(attempt, 'back').attempt);
    }
    expect(attempt.status).toBe('lost');
    const reset = resetAttempt(attempt);
    expect(reset.status).toBe('idle');
    expect(reset.hearts).toBe(3);
  });

  it('ignores unknown piece ids', () => {
    const attempt = startAttempt(chainBoard());
    const result = tapRibbon(attempt, 'nope');
    expect(result.attempt).toBe(attempt);
    expect(result.events).toEqual([]);
  });

  it('hint chooses a clear ribbon without changing the attempt', () => {
    const attempt = startAttempt(chainBoard());
    const hinted = hintFor(attempt);
    expect(hinted?.id).toBe('front');
    expect(attempt.remaining).toHaveLength(2);
    expect(attempt.hearts).toBe(3);
  });

  it('lists every clear ribbon in board order for assistive mode', () => {
    const attempt = startAttempt(chainBoard());
    expect(clearPieces(attempt).map((piece) => piece.id)).toEqual(['front']);
    expect(clearPieces(tapRibbon(attempt, 'front').attempt)).toEqual([]);
  });

  it('hint returns null while resolving or after the attempt ends', () => {
    const resolving = tapRibbon(startAttempt(chainBoard()), 'front').attempt;
    expect(hintFor(resolving)).toBeNull();

    const onePiece = makeBoard(4, 4, [
      makePiece('only', [
        [0, 0],
        [1, 0],
      ]),
    ]);
    const won = settle(tapRibbon(startAttempt(onePiece), 'only').attempt);
    expect(hintFor(won)).toBeNull();
  });

  it('keeps the cleared paths in order for the reveal', () => {
    let attempt = startAttempt(chainBoard());
    attempt = settle(tapRibbon(attempt, 'front').attempt);
    attempt = settle(tapRibbon(attempt, 'back').attempt);
    expect(attempt.cleared.map((piece) => piece.id)).toEqual(['front', 'back']);
    expect(attempt.cleared[0]?.path).toHaveLength(2);
  });

  it('settling an idle attempt is a no-op', () => {
    const attempt = startAttempt(chainBoard());
    const result = settleAttempt(attempt);
    expect(result.attempt).toBe(attempt);
    expect(result.events).toEqual([]);
  });
});
