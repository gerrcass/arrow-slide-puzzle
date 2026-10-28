import { constellationById } from '../../content/constellations';
import { LEVELS } from '../../content/levels';
import { chapterFor, type Level } from '../../content/schema';
import {
  clearedCount,
  clearPieces,
  hintFor,
  resetAttempt,
  settleAttempt,
  startAttempt,
  tapRibbon,
  type Attempt,
} from '../../engine/session';
import type { AppContext, Screen } from '../context';
import {
  createGuideState,
  guideBubbleCopy,
  guideDismiss,
  guideFlagsToPersist,
  guideMomentCopy,
  guideOnClear,
  guideOnCollision,
  guideOnLoss,
  guideOnWin,
  guideSetTips,
  guideShowIntro,
  guideSkipIntro,
  guideWithVoice,
  welcomeCopy,
  type GuideState,
} from '../guide';
import { BoardView } from '../ui/boardView';
import { describePiece } from '../ui/boardSvg';
import { createConstellationArt } from '../ui/constellation';
import {
  append,
  el,
} from '../ui/dom';
import { createIcon } from '../ui/icons';
import {
  createStarBurst,
  openDialog,
  type DialogAction,
  type DialogHandle,
} from '../ui/dialog';
import { createGuideMoment, createNanaPortrait } from '../ui/nana';
import { ribbonColourName } from '../ui/ribbonPalette';
import { createHeartRow, createStarRow } from '../ui/stars';

let instructionsCounter = 0;

function plural(count: number, singular: string, pluralWord = `${singular}s`): string {
  return count === 1 ? singular : pluralWord;
}

function starCount(value: number): 1 | 2 | 3 {
  if (value >= 3) return 3;
  if (value === 2) return 2;
  return 1;
}

export function playScreen(context: AppContext, level: Level): Screen {
  instructionsCounter += 1;
  const instructionsId = `play-instructions-${instructionsCounter}`;
  const chapter = chapterFor(level.index);
  const constellation = constellationById(level.constellationId);
  const total = level.board.pieces.length;

  let attempt: Attempt = startAttempt(level.board);
  let guide: GuideState = createGuideState(
    context.progress.data.tutorial,
    {
      tips: context.progress.data.settings.tips,
      voice: context.progress.data.settings.guideVoice,
    },
    { firstLevel: level.index === 0 },
  );
  let disposed = false;
  let activeDialog: DialogHandle | null = null;
  const timers = new Set<number>();
  let heartTimer: number | null = null;

  const screen = el('main', 'screen play-screen');

  const skip = el('a', 'skip-link', 'Skip to the board');
  skip.href = '#tangle-board';

  const header = el('header', 'play-header');
  const back = el('button', 'icon-button play-back');
  back.type = 'button';
  back.setAttribute('aria-label', 'Back to level select');
  back.append(createIcon('arrow-left'));
  back.addEventListener('click', () => context.navigate('#/levels'));

  const headingBlock = el('div', 'play-heading');
  const eyebrow = el(
    'p',
    'eyebrow',
    `Chapter ${chapter.numeral} · ${chapter.title}`,
  );
  const heading = el('h1', 'play-title', level.title);
  heading.tabIndex = -1;
  heading.setAttribute('data-screen-heading', '');
  append(headingBlock, eyebrow, heading);

  const tools = el('div', 'play-tools');
  const tanglePill = el('span', 'pill play-tangle-pill');
  tanglePill.append(
    createIcon('sparkle', 'icon icon--sm'),
    `Tangle ${String(level.index + 1).padStart(2, '0')}`,
  );
  const soundButton = el('button', 'icon-button play-sound');
  soundButton.type = 'button';
  soundButton.addEventListener('click', () => {
    context.setSound(!context.progress.data.settings.sound);
    syncSoundButton();
  });
  const settingsButton = el('button', 'icon-button play-settings');
  settingsButton.type = 'button';
  settingsButton.setAttribute('aria-label', 'Settings');
  settingsButton.append(createIcon('settings'));
  settingsButton.addEventListener('click', openPlaySettings);
  append(tools, tanglePill, soundButton, settingsButton);

  append(header, back, headingBlock, tools);
  syncSoundButton();

  const status = el('div', 'play-status');
  const hearts = createHeartRow(attempt.hearts);
  const progressPill = el('div', 'progress-pill');
  const progressLabel = el('span', 'progress-pill__label');
  const progressTrack = el('div', 'progress-track');
  progressTrack.setAttribute('role', 'progressbar');
  progressTrack.setAttribute('aria-label', 'Ribbons cleared');
  progressTrack.setAttribute('aria-valuemin', '0');
  progressTrack.setAttribute('aria-valuemax', String(total));
  const progressFill = el('span', 'progress-track__fill');
  progressTrack.append(progressFill);
  append(progressPill, progressLabel, progressTrack);

  const constellationPill = el('span', 'pill constellation-pill');
  constellationPill.append(
    createIcon('star', 'icon icon--sm'),
    'A constellation waits',
  );

  append(status, hearts, progressPill, constellationPill);

  const instructions = el(
    'p',
    'visually-hidden',
    'Each ribbon is a button. Activate a ribbon that can slide all the way off the board. A blocked ribbon costs one heart. Press H for a hint and R to reset.',
  );
  instructions.id = instructionsId;

  const stage = el('div', 'board-stage');
  stage.id = 'tangle-board';
  stage.tabIndex = -1;
  stage.setAttribute('aria-label', 'Tangle board');
  const boardView = new BoardView(level.board, {
    seed: level.seed,
    accent: chapter.accent,
    describedBy: instructionsId,
    constellation: constellation ?? undefined,
    assistive: context.progress.data.settings.assistive,
    onActivate: (pieceId) => handleTap(pieceId),
  });
  stage.append(boardView.element);

  const guideSlot = el('aside', 'guide-slot');
  guideSlot.setAttribute('aria-label', 'Nana Pearl’s guidance');
  const playBody = el('div', 'play-body');
  append(playBody, stage, guideSlot);

  const footer = el('footer', 'play-footer');
  const actions = el('div', 'play-actions');
  const hintButton = el('button', 'btn btn--secondary');
  hintButton.type = 'button';
  hintButton.append(createIcon('hint'), 'Hint');
  hintButton.addEventListener('click', showHint);

  const describeButton = el('button', 'btn btn--ghost describe-clears');
  describeButton.type = 'button';
  describeButton.setAttribute('aria-label', 'Describe clear ribbons');
  describeButton.append(
    createIcon('describe'),
    el('span', 'describe-clears__label', 'Describe'),
  );
  describeButton.addEventListener('click', describeClearRibbons);
  describeButton.hidden = !context.progress.data.settings.assistive;

  const resetButton = el('button', 'btn btn--ghost');
  resetButton.type = 'button';
  resetButton.append(createIcon('reset'), 'Reset');
  resetButton.addEventListener('click', requestReset);
  append(actions, hintButton, describeButton, resetButton);

  const keyHint = el('p', 'key-hint');
  keyHint.append(el('kbd', 'key', 'H'), ' hint', el('span', 'key-hint__dot', '·'), el('kbd', 'key', 'R'), ' reset');
  append(footer, actions, keyHint);

  append(screen, skip, header, status, instructions, playBody, footer);
  document.title = `${level.title} · Nana Pearl’s Arrow Slide Puzzle`;

  boardView.render(attempt);
  renderHud();
  updateControls();
  renderGuide(false);
  context.progress.setLastPlayed(level.index);
  queueMicrotask(() => {
    if (!disposed) showWelcome();
  });

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (document.querySelector('dialog[open]')) return;
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT')
    ) {
      return;
    }
    const key = event.key.toLowerCase();
    if (key === 'h') {
      event.preventDefault();
      showHint();
    } else if (key === 'r') {
      event.preventDefault();
      requestReset();
    } else if (key === 'escape') {
      if (attempt.status === 'idle') {
        event.preventDefault();
        openPlaySettings();
      }
    }
  };
  window.addEventListener('keydown', onKeyDown);

  function renderHud(): void {
    const slots = hearts.querySelectorAll<HTMLElement>('.heart-slot');
    slots.forEach((slot, index) => {
      slot.classList.toggle('is-full', index < attempt.hearts);
      slot.classList.toggle('is-empty', index >= attempt.hearts);
    });
    hearts.setAttribute(
      'aria-label',
      `${attempt.hearts} of 3 hearts remaining`,
    );

    const cleared = clearedCount(attempt);
    progressLabel.textContent = `${cleared} / ${total} cleared`;
    progressTrack.setAttribute('aria-valuenow', String(cleared));
    progressFill.style.width = `${total === 0 ? 0 : (cleared / total) * 100}%`;
  }

  function updateControls(): void {
    const idle = attempt.status === 'idle';
    hintButton.disabled = !idle || hintFor(attempt) === null;
    describeButton.disabled = !idle;
    resetButton.disabled = !idle;
    settingsButton.disabled = !idle;
  }

  function syncSoundButton(): void {
    const soundOn = context.progress.data.settings.sound;
    soundButton.replaceChildren(createIcon(soundOn ? 'sound' : 'mute'));
    soundButton.setAttribute('aria-label', 'Mute sound');
    soundButton.setAttribute('aria-pressed', String(!soundOn));
    soundButton.classList.toggle('is-muted', !soundOn);
  }

  function applyGuide(next: GuideState): void {
    const before = guide;
    guide = next;
    for (const flag of guideFlagsToPersist(before.flags, next.flags)) {
      context.progress.markTutorial(flag);
    }
  }

  function renderGuide(announce = true): void {
    if (disposed) return;
    guideSlot.replaceChildren();
    const bubble = guide.bubble;
    guideSlot.classList.toggle('has-guide', bubble !== null && guide.tipsEnabled);
    if (!bubble || !guide.tipsEnabled) return;
    const text = guideBubbleCopy(guide);
    guideSlot.append(
      createGuideMoment({
        expression: bubble.expression,
        text,
        className: 'guide-moment--play',
        onDismiss: dismissGuide,
      }),
    );
    if (announce) context.announce(`Nana Pearl: ${text}`);
  }

  function dismissGuide(): void {
    if (!guide.bubble) return;
    applyGuide(guideDismiss(guide));
    renderGuide(false);
    heading.focus({ preventScroll: true });
  }

  function syncGuideSettings(): void {
    const settings = context.progress.data.settings;
    applyGuide(guideSetTips(guide, settings.tips));
    applyGuide(guideWithVoice(guide, settings.guideVoice));
    boardView.setAssistive(settings.assistive);
    describeButton.hidden = !settings.assistive;
    syncSoundButton();
    updateControls();
    renderGuide(false);
  }

  function openPlaySettings(): void {
    if (disposed) return;
    const handle = context.openSettings();
    if (!handle) return;
    handle.dialog.addEventListener(
      'close',
      () => {
        if (!disposed) syncGuideSettings();
      },
      { once: true },
    );
  }

  function showWelcome(): void {
    if (disposed || !guide.introOpen) return;
    const copy = welcomeCopy(guide.voice);
    const content = el('div', 'guide-welcome');
    content.append(
      createNanaPortrait('warm', 'nana-portrait nana-portrait--welcome'),
    );

    const skip = (): void => {
      activeDialog = null;
      applyGuide(guideSkipIntro(guide));
      renderGuide(false);
      heading.focus({ preventScroll: true });
    };

    activeDialog = openDialog({
      variant: 'info',
      eyebrow: 'Nana Pearl',
      title: copy.title,
      body: copy.body,
      content,
      actions: [
        {
          label: copy.showLabel,
          variant: 'primary',
          autofocus: true,
          onSelect: () => {
            activeDialog = null;
            applyGuide(guideShowIntro(guide));
            renderGuide();
            boardView.focusFirst();
          },
        },
        {
          label: copy.skipLabel,
          variant: 'secondary',
          onSelect: skip,
        },
      ],
      onCancel: skip,
    });
  }

  function breakHeart(): void {
    hearts.classList.remove('is-breaking');
    void hearts.offsetWidth;
    hearts.classList.add('is-breaking');
    if (heartTimer !== null) window.clearTimeout(heartTimer);
    heartTimer = window.setTimeout(() => {
      hearts.classList.remove('is-breaking');
      heartTimer = null;
    }, 620);
  }

  function handleTap(pieceId: string): void {
    if (disposed || attempt.status !== 'idle') return;
    const focusedRibbon = document.activeElement;
    const wasFocused =
      focusedRibbon instanceof Element &&
      focusedRibbon.closest('.ribbon')?.getAttribute('data-piece-id') === pieceId;

    const result = tapRibbon(attempt, pieceId);
    if (result.attempt === attempt) return;

    const previousHearts = attempt.hearts;
    attempt = result.attempt;
    renderHud();
    updateControls();
    boardView.setLocked(true);

    const resolution = attempt.resolution;
    if (!resolution) return;

    const reduced = context.isReducedMotion();

    if (resolution.kind === 'collision') {
      const blocker = attempt.remaining.find((piece) => piece.id === resolution.blockerId);
      const blockerName = blocker ? ribbonColourName(blocker.color) : 'another';
      const heartsLeft = attempt.hearts;
      context.audio.play('bump');
      context.audio.play('heart');
      context.announce(
        `Blocked by the ${blockerName} ribbon. ${heartsLeft} ${plural(heartsLeft, 'heart')} left.`,
        'assertive',
      );
      if (previousHearts > attempt.hearts) breakHeart();
      applyGuide(guideOnCollision(guide, attempt.hearts));
      renderGuide();
    } else {
      context.audio.play('slide', { steps: resolution.steps });
      context.announce(
        `Cleared the ${ribbonColourName(resolution.piece.color)} ribbon. ${attempt.cleared.length} of ${total} cleared.`,
      );
    }

    void boardView
      .animateResolution(resolution, reduced)
      .then(() =>
        afterResolution(
          wasFocused,
          resolution.kind === 'slide' ? pieceId : null,
          resolution.kind === 'slide',
        ),
      )
      .catch(() => {
        // A cancelled animation during navigation is not a game error.
      });
  }

  function afterResolution(
    wasFocused: boolean,
    clearedId: string | null,
    wasSlide: boolean,
  ): void {
    if (disposed) return;
    const settled = settleAttempt(attempt);
    attempt = settled.attempt;
    boardView.render(attempt);
    if (attempt.status === 'idle') boardView.setLocked(false);
    renderHud();
    updateControls();

    if (wasFocused && clearedId) boardView.focusNextAfter(clearedId);

    if (wasSlide) {
      applyGuide(guideOnClear(guide, attempt.cleared.length));
      if (attempt.status !== 'won') renderGuide();
    }

    for (const event of settled.events) {
      if (event.type === 'won') {
        applyGuide(guideOnWin(guide));
        renderGuide(false);
        const previousBest = context.progress.bestStars(level.index);
        context.progress.recordCompletion(level.index, starCount(event.stars));
        const best = context.progress.bestStars(level.index);
        void finishWin(event.stars, previousBest, best);
        return;
      }
      if (event.type === 'lost') {
        applyGuide(guideOnLoss(guide));
        renderGuide(false);
        showLoss();
        return;
      }
    }
  }

  async function finishWin(
    stars: number,
    previousBest: number,
    best: number,
  ): Promise<void> {
    context.audio.play('win');
    await boardView.revealBoard(context.isReducedMotion());
    if (disposed) return;
    showWin(stars, previousBest, best);
  }

  function showHint(): void {
    if (disposed || attempt.status !== 'idle') return;
    const piece = hintFor(attempt);
    if (!piece) {
      context.announce('No ribbon is clear. That should not happen — try resetting.', 'assertive');
      return;
    }
    context.audio.play('tick');
    boardView.pulseHint(piece.id);
    context.announce(
      `Try the ${ribbonColourName(piece.color)} ribbon. It is clear, pointing ${piece.heading}.`,
    );
  }

  function describeClearRibbons(): void {
    if (disposed || attempt.status !== 'idle') return;
    const pieces = clearPieces(attempt);
    if (pieces.length === 0) {
      context.announce('No clear ribbons. That should not happen — try resetting.', 'assertive');
      return;
    }
    const names = pieces.map((piece) => describePiece(piece));
    context.announce(
      `${pieces.length === 1 ? 'One clear ribbon' : `${pieces.length} clear ribbons`}: ${names.join(' ')}`,
    );
  }

  function requestReset(): void {
    if (disposed || attempt.status !== 'idle') return;
    if (attempt.cleared.length > 0 && attempt.hearts > 0) {
      activeDialog = openDialog({
        variant: 'confirm',
        eyebrow: 'A small pause',
        title: 'Start this tangle over?',
        body: 'The board returns to its first tangle and you get all three hearts back.',
        actions: [
          {
            label: 'Start over',
            variant: 'primary',
            onSelect: restart,
          },
          {
            label: 'Keep playing',
            variant: 'secondary',
            autofocus: true,
            onSelect: () => {
              activeDialog = null;
            },
          },
        ],
        onCancel: () => {
          activeDialog = null;
        },
      });
      return;
    }
    restart();
  }

  function restart(): void {
    if (disposed) return;
    activeDialog?.close();
    activeDialog = null;
    attempt = resetAttempt(attempt);
    boardView.resetReveals();
    boardView.render(attempt);
    boardView.setLocked(false);
    renderHud();
    updateControls();
    context.announce('A fresh attempt. Three hearts.');
    heading.focus();
  }

  function showWin(stars: number, previousBest: number, best: number): void {
    if (disposed) return;
    context.announce(
      constellation
        ? `Tangle cleared with ${stars} ${plural(stars, 'star')}. ${constellation.name} is in your gallery.`
        : `Tangle cleared with ${stars} ${plural(stars, 'star')}.`,
      'assertive',
    );

    const visual = el('div', 'win-visual');
    if (constellation) {
      const artWrap = el('div', 'win-constellation');
      artWrap.append(
        createConstellationArt(constellation, { className: 'constellation--win' }),
      );
      const name = el('p', 'win-constellation__name', constellation.name);
      const caption = el('p', 'win-constellation__caption', constellation.caption);
      const collected = el('p', 'win-constellation__collected');
      collected.append(createIcon('check', 'icon icon--sm'), 'Constellation collected');
      append(artWrap, name, caption, collected);
      visual.append(artWrap);
    }
    visual.append(createStarRow(stars, 3, { animated: true }));
    const bestLine = el(
      'p',
      'win-best',
      previousBest === 0 || stars > previousBest
        ? `New best · ${best} of 3 stars`
        : `Best stays at ${best} of 3 stars`,
    );
    visual.append(bestLine);
    if (!context.isReducedMotion()) {
      const burst = createStarBurst();
      burst.classList.add('star-burst--win');
      visual.append(burst);
    }

    const moment = guide.moment;
    if (moment) {
      visual.classList.add('win-visual--with-guide');
      visual.append(
        createGuideMoment({
          expression: moment.expression,
          text: guideMomentCopy(guide),
          className: 'guide-moment--dialog',
          dismissible: false,
        }),
      );
    }

    const nextLevel = LEVELS[level.index + 1];
    const actions: DialogAction[] = [];
    if (nextLevel) {
      actions.push({
        label: 'Next tangle',
        variant: 'primary',
        autofocus: true,
        onSelect: () => context.navigate(`#/play/${nextLevel.index + 1}`),
      });
      actions.push({
        label: 'Play again',
        variant: 'secondary',
        onSelect: restart,
      });
      actions.push({
        label: 'View gallery',
        variant: 'ghost',
        onSelect: () => context.navigate('#/gallery'),
      });
    } else {
      actions.push({
        label: 'Back to levels',
        variant: 'primary',
        autofocus: true,
        onSelect: () => context.navigate('#/levels'),
      });
      actions.push({
        label: 'View gallery',
        variant: 'secondary',
        onSelect: () => context.navigate('#/gallery'),
      });
      actions.push({
        label: 'Play again',
        variant: 'ghost',
        onSelect: restart,
      });
    }

    activeDialog = openDialog({
      variant: nextLevel ? 'win' : 'campaign',
      eyebrow: nextLevel ? 'A ribbon leaves, a star appears' : 'Campaign complete',
      title: nextLevel ? 'Tangle untangled' : 'The sky is clear',
      body: moment
        ? undefined
        : nextLevel
          ? `You kept ${stars} ${plural(stars, 'heart')}. The next tangle is waiting.`
          : 'Every ribbon has left the board. The whole sky belongs to you now.',
      content: visual,
      actions,
      onCancel: () => context.navigate('#/levels'),
    });
  }

  function showLoss(): void {
    if (disposed) return;
    context.announce('Out of hearts. Try again.', 'assertive');
    const moment = guide.moment;
    let content: HTMLDivElement | undefined;
    if (moment) {
      content = el('div', 'win-visual win-visual--with-guide');
      content.append(
        createGuideMoment({
          expression: moment.expression,
          text: guideMomentCopy(guide),
          className: 'guide-moment--dialog',
          dismissible: false,
        }),
      );
    }
    const actions: DialogAction[] = [
      {
        label: 'Try again',
        variant: 'primary',
        autofocus: true,
        onSelect: restart,
      },
      {
        label: 'Levels',
        variant: 'secondary',
        onSelect: () => context.navigate('#/levels'),
      },
    ];
    activeDialog = openDialog({
      variant: 'loss',
      eyebrow: 'The tangle held',
      title: 'Out of hearts',
      body: moment
        ? undefined
        : 'Nothing is lost. Take a breath, then look for the ribbon that can slide all the way out.',
      icon: 'heart',
      content,
      actions,
      onCancel: restart,
    });
  }

  return {
    element: screen,
    destroy: () => {
      disposed = true;
      window.removeEventListener('keydown', onKeyDown);
      for (const timer of timers) window.clearTimeout(timer);
      timers.clear();
      if (heartTimer !== null) window.clearTimeout(heartTimer);
      activeDialog?.close();
      boardView.destroy();
      screen.remove();
    },
  };
}
