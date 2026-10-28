import { describe, expect, it } from 'vitest';
import {
  createGuideState,
  guideBubbleCopy,
  guideDismiss,
  guideFlagsToPersist,
  guideMomentCopy,
  guideOnClear,
  guideOnCollision,
  guideOnHint,
  guideOnLoss,
  guideOnWin,
  guideSetTips,
  guideShowIntro,
  guideSkipIntro,
  guideWithVoice,
  welcomeCopy,
  type GuideSettings,
} from './guide';
import { defaultTutorial } from './progress';

const SETTINGS: GuideSettings = { tips: true, voice: 'nana' };

function fresh(
  settings: GuideSettings = SETTINGS,
  firstLevel = true,
) {
  return createGuideState(defaultTutorial(), settings, { firstLevel });
}

function started() {
  return guideShowIntro(fresh());
}

describe('Nana Pearl guide state', () => {
  it('opens the welcome card only on the first visit to level one', () => {
    expect(fresh().introOpen).toBe(true);
    expect(fresh(SETTINGS, false).introOpen).toBe(false);
    expect(fresh({ tips: false, voice: 'nana' }).introOpen).toBe(false);
  });

  it('starts the three beats after “Show me” and skips cleanly', () => {
    const shown = started();
    expect(shown.introOpen).toBe(false);
    expect(shown.flags.introSeen).toBe(true);
    expect(shown.bubble?.kind).toBe('tutorial');
    expect(shown.bubble?.beat).toBe(1);

    const skipped = guideSkipIntro(fresh());
    expect(skipped.flags.introSeen).toBe(true);
    expect(skipped.flags.tutorialDone).toBe(true);
    expect(skipped.bubble).toBeNull();
  });

  it('advances beats on clears, never on time', () => {
    const first = guideOnClear(started(), 1);
    expect(first.bubble?.beat).toBe(2);
    expect(first.flags.tutorialDone).toBe(false);

    const second = guideOnClear(first, 2);
    expect(second.bubble?.beat).toBe(3);
    expect(second.flags.tutorialDone).toBe(true);

    const third = guideOnClear(second, 3);
    expect(third).toBe(second);
  });

  it('turns the first bump into the heart beat and a concerned tip', () => {
    const bumped = guideOnCollision(started(), 2);
    expect(bumped.bubble?.kind).toBe('collision');
    expect(bumped.bubble?.expression).toBe('concerned');
    expect(bumped.flags.collisionTipSeen).toBe(true);
    expect(bumped.flags.tutorialDone).toBe(true);
    expect(guideBubbleCopy(bumped)).toContain('boxed in');

    const dismissed = guideDismiss(bumped);
    expect(dismissed.bubble).toBeNull();
    expect(guideOnCollision(dismissed, 1)).toBe(dismissed);
  });

  it('leaves the last-heart line to the loss dialog', () => {
    const out = guideOnCollision(started(), 0);
    expect(out.bubble).toBeNull();
    expect(out.flags.collisionTipSeen).toBe(true);
    expect(out.flags.tutorialDone).toBe(true);
  });

  it('shows the first win and first loss exactly once', () => {
    const win = guideOnWin(started());
    expect(win.moment?.kind).toBe('win');
    expect(win.moment?.expression).toBe('delighted');
    expect(win.flags.winTipSeen).toBe(true);
    expect(win.flags.tutorialDone).toBe(true);
    expect(guideMomentCopy(win)).toContain('Oh, look at that');

    const secondWin = guideOnWin({ ...win, moment: null });
    expect(secondWin.moment).toBeNull();

    const loss = guideOnLoss(started());
    expect(loss.moment?.kind).toBe('loss');
    expect(loss.moment?.expression).toBe('warm');
    expect(loss.flags.heartsTipSeen).toBe(true);
    expect(guideMomentCopy(loss)).toContain('No harm done');

    const secondLoss = guideOnLoss({ ...loss, moment: null });
    expect(secondLoss.moment).toBeNull();
  });

  it('never shows a bubble when tips are switched off', () => {
    const off = guideSetTips(started(), false);
    expect(off.bubble).toBeNull();
    expect(guideOnClear(off, 1)).toBe(off);
    expect(guideOnCollision(off, 2)).toBe(off);
    expect(off.flags.collisionTipSeen).toBe(false);

    const onAgain = guideSetTips(off, true);
    expect(onAgain.bubble?.kind).toBe('tutorial');
    expect(onAgain.bubble?.beat).toBe(1);
  });

  it('offers the first hint tip only after the tutorial, exactly once', () => {
    const nudged = guideOnHint(guideSkipIntro(fresh()));
    expect(nudged.bubble?.kind).toBe('hint');
    expect(nudged.bubble?.expression).toBe('warm');
    expect(nudged.flags.hintTipSeen).toBe(true);
    expect(guideBubbleCopy(nudged)).toContain('nudge');

    const again = guideOnHint({ ...nudged, bubble: null });
    expect(again.bubble).toBeNull();
    expect(again).not.toBe(nudged);
    expect(guideOnHint(again)).toBe(again);
    const active = started();
    expect(guideOnHint(active)).toBe(active);
  });

  it('dismissing a tutorial bubble skips the rest of the beats', () => {
    const dismissed = guideDismiss(started());
    expect(dismissed.bubble).toBeNull();
    expect(dismissed.flags.tutorialDone).toBe(true);
    expect(guideOnClear(dismissed, 1)).toBe(dismissed);
  });

  it('switches guide copy without changing the beat', () => {
    const nana = started();
    const brief = guideWithVoice(nana, 'brief');
    expect(brief.bubble?.beat).toBe(nana.bubble?.beat);
    expect(guideBubbleCopy(brief)).not.toBe(guideBubbleCopy(nana));
    expect(guideBubbleCopy(brief).length).toBeLessThan(
      guideBubbleCopy(nana).length,
    );
    expect(welcomeCopy('brief').body).not.toBe(welcomeCopy('nana').body);
  });

  it('reports only newly set tutorial flags for persistence', () => {
    const before = defaultTutorial();
    const after = {
      ...before,
      introSeen: true,
      tutorialDone: true,
      winTipSeen: true,
    };
    expect(guideFlagsToPersist(before, after)).toEqual([
      'introSeen',
      'tutorialDone',
      'winTipSeen',
    ]);
    expect(guideFlagsToPersist(after, after)).toEqual([]);
  });
});
