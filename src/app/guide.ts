import type { GuideVoice, TutorialFlag, TutorialFlags } from './progress';

export const GUIDE_NAME = 'Nana Pearl';
export type GuideExpression = 'neutral' | 'warm' | 'concerned' | 'delighted';
export type GuideBeat = 1 | 2 | 3;
export type GuideBubbleKind = 'tutorial' | 'collision' | 'win' | 'loss';

export interface GuideBubble {
  readonly kind: GuideBubbleKind;
  readonly beat: GuideBeat | null;
  readonly expression: GuideExpression;
}

export interface GuideState {
  readonly tipsEnabled: boolean;
  readonly voice: GuideVoice;
  readonly flags: TutorialFlags;
  /** First-run welcome card. */
  readonly introOpen: boolean;
  /** The one bubble shown beneath the board, if any. */
  readonly bubble: GuideBubble | null;
  /** A first-win/first-loss line shown inside the result dialog. */
  readonly moment: GuideBubble | null;
  /** Current tutorial beat, used to resume after tips are toggled back on. */
  readonly beat: GuideBeat;
}

export interface GuideSettings {
  readonly tips: boolean;
  readonly voice: GuideVoice;
}

export interface Overview {
  readonly title: string;
  readonly body: string;
  readonly showLabel: string;
  readonly skipLabel: string;
}

const WELCOME: Readonly<Record<GuideVoice, Overview>> = {
  nana: {
    title: 'Oh, hello dear',
    body:
      'Tap a ribbon when its whole path is clear — it will slide right off the board. If something is in the way, it bumps and costs one of your three hearts. There is no clock. Ready for a look?',
    showLabel: 'Show me',
    skipLabel: 'Skip for now',
  },
  brief: {
    title: 'Oh, hello dear',
    body:
      'Tap a ribbon only when its whole path is clear. A bump costs one of three hearts. There is no clock. Ready for a look?',
    showLabel: 'Show me',
    skipLabel: 'Skip for now',
  },
};

type CopyPair = { readonly nana: string; readonly brief: string };

const TUTORIAL_COPY: Readonly<Record<GuideBeat, CopyPair>> = {
  1: {
    nana: 'Tap a ribbon that can slide all the way out. The tip is not the whole story, dear — look at every cell it has to cross.',
    brief: 'Start with a ribbon that can slide all the way out. The tip is not the whole story.',
  },
  2: {
    nana: 'Every clear peels back the frost. Have a look underneath — there is a whole sky under this tangle.',
    brief: 'Every clear peels back the frost. Look underneath.',
  },
  3: {
    nana: 'A bump costs a heart. You start with three hearts and there is no clock, so take all the time you need.',
    brief: 'A bump costs a heart. Three hearts, no clock.',
  },
};

const TIP_COPY: Readonly<Record<Exclude<GuideBubbleKind, 'tutorial'>, CopyPair>> = {
  collision: {
    nana: 'That one was boxed in, so it cost a heart. The whole path has to be clear before a ribbon can leave. No harm done.',
    brief: 'That one was boxed in, so it cost a heart. The whole path must be clear. No harm done.',
  },
  win: {
    nana: 'Oh, look at that. A whole constellation, just for you, dear.',
    brief: 'Oh, look at that. A whole constellation, just for you.',
  },
  loss: {
    nana: 'No harm done. The ribbons will be here when you feel like looking again.',
    brief: 'No harm done. Come back when you are ready.',
  },
};

export function welcomeCopy(voice: GuideVoice): Overview {
  return WELCOME[voice];
}

export function guideBubbleCopy(state: GuideState): string {
  return copyFor(state, state.bubble);
}

export function guideMomentCopy(state: GuideState): string {
  return copyFor(state, state.moment);
}

function copyFor(state: GuideState, bubble: GuideBubble | null): string {
  if (!bubble) return '';
  if (bubble.kind === 'tutorial') {
    return TUTORIAL_COPY[bubble.beat ?? 1][state.voice];
  }
  return TIP_COPY[bubble.kind][state.voice];
}

function tutorialBubble(beat: GuideBeat): GuideBubble {
  return {
    kind: 'tutorial',
    beat,
    expression: beat === 2 ? 'delighted' : 'warm',
  };
}

function withFlags(state: GuideState, patch: Partial<TutorialFlags>): GuideState {
  return { ...state, flags: { ...state.flags, ...patch } };
}

function activeTutorial(state: GuideState): boolean {
  return (
    state.tipsEnabled &&
    state.flags.introSeen &&
    !state.flags.tutorialDone
  );
}

export function createGuideState(
  flags: TutorialFlags,
  settings: GuideSettings,
  options: { readonly firstLevel: boolean },
): GuideState {
  const introOpen =
    options.firstLevel && settings.tips && !flags.introSeen;
  const active = settings.tips && flags.introSeen && !flags.tutorialDone;
  return {
    tipsEnabled: settings.tips,
    voice: settings.voice,
    flags,
    introOpen,
    bubble: active ? tutorialBubble(1) : null,
    moment: null,
    beat: 1,
  };
}

export function guideShowIntro(state: GuideState): GuideState {
  const next = withFlags(state, { introSeen: true });
  return {
    ...next,
    introOpen: false,
    beat: 1,
    bubble: tutorialBubble(1),
  };
}

export function guideSkipIntro(state: GuideState): GuideState {
  const next = withFlags(state, { introSeen: true, tutorialDone: true });
  return {
    ...next,
    introOpen: false,
    bubble: null,
    moment: null,
    beat: 3,
  };
}

export function guideOnClear(
  state: GuideState,
  clearedCount: number,
): GuideState {
  if (!activeTutorial(state) || state.introOpen) return state;
  if (clearedCount < 1) return state;

  if (clearedCount >= 2) {
    const next = withFlags(state, { tutorialDone: true });
    return {
      ...next,
      beat: 3,
      bubble: tutorialBubble(3),
    };
  }

  if (state.beat >= 2) return state;
  return {
    ...state,
    beat: 2,
    bubble: tutorialBubble(2),
  };
}

export function guideOnCollision(
  state: GuideState,
  hearts: number,
): GuideState {
  if (!state.tipsEnabled || state.introOpen) return state;

  const tutorialActive = state.flags.introSeen && !state.flags.tutorialDone;
  if (!tutorialActive && state.flags.collisionTipSeen) return state;

  const next = withFlags(state, {
    collisionTipSeen: true,
    ...(tutorialActive ? { tutorialDone: true } : {}),
  });

  if (hearts <= 0) {
    // The loss dialog carries the last-heart line; do not stack a bubble too.
    return {
      ...next,
      beat: 3,
      bubble: null,
    };
  }

  return {
    ...next,
    beat: 3,
    bubble: {
      kind: 'collision',
      beat: tutorialActive ? 3 : null,
      expression: 'concerned',
    },
  };
}

export function guideOnWin(state: GuideState): GuideState {
  const firstWin = state.tipsEnabled && !state.flags.winTipSeen;
  const next = withFlags(state, {
    tutorialDone: true,
    ...(firstWin ? { winTipSeen: true } : {}),
  });
  return {
    ...next,
    bubble: null,
    moment: firstWin
      ? { kind: 'win', beat: null, expression: 'delighted' }
      : null,
    beat: 3,
  };
}

export function guideOnLoss(state: GuideState): GuideState {
  const firstLoss = state.tipsEnabled && !state.flags.heartsTipSeen;
  const next = withFlags(state, {
    tutorialDone: true,
    ...(firstLoss ? { heartsTipSeen: true } : {}),
  });
  return {
    ...next,
    bubble: null,
    moment: firstLoss
      ? { kind: 'loss', beat: null, expression: 'warm' }
      : null,
    beat: 3,
  };
}

export function guideDismiss(state: GuideState): GuideState {
  if (!state.bubble) return state;
  const endsTutorial =
    state.bubble.kind === 'tutorial' ||
    (state.bubble.kind === 'collision' && !state.flags.tutorialDone);
  const next = endsTutorial
    ? withFlags(state, { tutorialDone: true })
    : state;
  return {
    ...next,
    bubble: null,
    beat: endsTutorial ? 3 : state.beat,
  };
}

export function guideSetTips(state: GuideState, enabled: boolean): GuideState {
  if (state.tipsEnabled === enabled) return state;
  if (!enabled) {
    return {
      ...state,
      tipsEnabled: false,
      introOpen: false,
      bubble: null,
      moment: null,
    };
  }
  return {
    ...state,
    tipsEnabled: true,
    bubble:
      state.flags.introSeen && !state.flags.tutorialDone
        ? tutorialBubble(state.beat)
        : null,
  };
}

export function guideWithVoice(state: GuideState, voice: GuideVoice): GuideState {
  if (state.voice === voice) return state;
  return { ...state, voice };
}

const FLAG_KEYS: readonly TutorialFlag[] = [
  'introSeen',
  'tutorialDone',
  'collisionTipSeen',
  'heartsTipSeen',
  'winTipSeen',
  'hintTipSeen',
];

/** The minimal set of true flags a caller must persist after a transition. */
export function guideFlagsToPersist(
  before: TutorialFlags,
  after: TutorialFlags,
): readonly TutorialFlag[] {
  return FLAG_KEYS.filter((flag) => after[flag] && !before[flag]);
}
