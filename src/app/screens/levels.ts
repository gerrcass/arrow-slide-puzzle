import { constellationById } from '../../content/constellations';
import { LEVELS } from '../../content/levels';
import { CHAPTERS, chapterFor } from '../../content/schema';
import type { AppContext, Screen } from '../context';
import { createConstellationArt } from '../ui/constellation';
import { append, el } from '../ui/dom';
import { createIcon } from '../ui/icons';
import { createStarRow } from '../ui/stars';

function levelAriaLabel(
  index: number,
  title: string,
  constellationName: string | null,
  best: number,
  unlocked: boolean,
  isNext: boolean,
): string {
  const chapter = chapterFor(index);
  const prefix = `Level ${index + 1}, ${title}, chapter ${chapter.numeral} ${chapter.title}.`;
  if (!unlocked) {
    return `${prefix} A hidden constellation. Locked. Complete level ${index} to open it.`;
  }
  const constellation = constellationName ? ` ${constellationName}.` : '';
  if (best > 0) {
    return `${prefix}${constellation} Completed. Best ${best} of 3 stars. Replay.`;
  }
  return `${prefix}${constellation} ${isNext ? 'Next tangle. ' : ''}Play.`;
}

export function levelsScreen(context: AppContext, notice: string | null): Screen {
  const screen = el('main', 'screen levels-screen');

  const header = el('header', 'levels-header');
  const back = el('button', 'icon-button');
  back.type = 'button';
  back.setAttribute('aria-label', 'Back to the title');
  back.append(createIcon('arrow-left'));
  back.addEventListener('click', () => context.navigate('#/'));

  const headingBlock = el('div', 'levels-heading');
  const eyebrow = el('p', 'eyebrow', 'Nana Pearl’s');
  const heading = el('h1', 'levels-title', 'Choose a tangle');
  heading.tabIndex = -1;
  heading.setAttribute('data-screen-heading', '');
  append(headingBlock, eyebrow, heading);

  const settings = el('button', 'icon-button');
  settings.type = 'button';
  settings.setAttribute('aria-label', 'Settings');
  settings.append(createIcon('settings'));
  settings.addEventListener('click', () => context.openSettings());

  append(header, back, headingBlock, settings);

  const summary = el('div', 'levels-summary');
  const starPill = el('span', 'pill pill--gold');
  starPill.append(
    createIcon('star', 'icon icon--sm'),
    `${context.progress.totalStars} / ${LEVELS.length * 3} stars`,
  );
  const clearedPill = el('span', 'pill');
  clearedPill.append(
    createIcon('check', 'icon icon--sm'),
    `${context.progress.completedCount} / ${LEVELS.length} cleared`,
  );
  const gentlePill = el('span', 'pill');
  gentlePill.append(createIcon('sparkle', 'icon icon--sm'), 'No timers, no rush');
  const galleryPill = el('button', 'pill levels-gallery');
  galleryPill.type = 'button';
  galleryPill.append(createIcon('gallery', 'icon icon--sm'), 'Gallery');
  galleryPill.addEventListener('click', () => context.navigate('#/gallery'));
  append(summary, starPill, clearedPill, gentlePill, galleryPill);

  const body = el('div', 'levels-body');
  if (notice) {
    const noticeEl = el('div', 'levels-notice');
    const noticeIcon = el('span', 'levels-notice__icon');
    noticeIcon.setAttribute('aria-hidden', 'true');
    noticeIcon.append(createIcon('lock', 'icon icon--sm'));
    noticeEl.append(noticeIcon, el('p', '', notice));
    body.append(noticeEl);
    context.announce(notice);
  }

  let nextIndex: number | null = null;
  for (const level of LEVELS) {
    if (context.progress.isUnlocked(level.index) && context.progress.bestStars(level.index) === 0) {
      nextIndex = level.index;
      break;
    }
  }

  for (const chapter of CHAPTERS) {
    const chapterLevels = LEVELS.filter((level) => level.chapter === chapter.id);
    const chapterStars = chapterLevels.reduce(
      (total, level) => total + context.progress.bestStars(level.index),
      0,
    );
    const chapterSection = el('section', 'chapter');
    chapterSection.dataset.chapter = String(chapter.id);

    const chapterHeader = el('header', 'chapter-head');
    const mark = el('span', 'chapter-mark', chapter.numeral);
    const chapterCopy = el('div', 'chapter-copy');
    const chapterTitle = el('h2', 'chapter-title', chapter.title);
    const chapterSubtitle = el('p', 'chapter-subtitle', chapter.subtitle);
    append(chapterCopy, chapterTitle, chapterSubtitle);

    const chapterMeta = el('div', 'chapter-meta');
    const difficulty = el('span', 'chapter-difficulty', chapter.difficultyLabel);
    const chapterStarCount = el('span', 'chapter-stars');
    chapterStarCount.append(
      createIcon('star', 'icon icon--sm'),
      `${chapterStars} / ${chapterLevels.length * 3}`,
    );
    append(chapterMeta, difficulty, chapterStarCount);

    const chapterProgress = el('div', 'chapter-progress');
    chapterProgress.setAttribute('aria-hidden', 'true');
    const chapterFill = el('span', 'chapter-progress__fill');
    chapterFill.style.width = `${(chapterStars / (chapterLevels.length * 3)) * 100}%`;
    chapterProgress.append(chapterFill);

    append(chapterHeader, mark, chapterCopy, chapterMeta, chapterProgress);
    chapterSection.append(chapterHeader);

    const grid = el('div', 'level-grid');
    for (const level of chapterLevels) {
      const best = context.progress.bestStars(level.index);
      const completed = best > 0;
      const unlocked = context.progress.isUnlocked(level.index);
      const isNext = level.index === nextIndex;
      const constellation = constellationById(level.constellationId);

      const classes = ['level-card'];
      if (!unlocked) classes.push('is-locked');
      if (completed) classes.push('is-complete');
      if (isNext) classes.push('is-next');
      const card = el('button', classes.join(' '));
      card.type = 'button';
      card.disabled = !unlocked;
      card.setAttribute(
        'aria-label',
        levelAriaLabel(
          level.index,
          level.title,
          unlocked ? constellation?.name ?? null : null,
          best,
          unlocked,
          isNext,
        ),
      );

      const top = el('span', 'level-card__top');
      const number = el(
        'span',
        'level-card__number',
        String(level.index + 1).padStart(2, '0'),
      );
      const state = el(
        'span',
        `level-card__state ${!unlocked ? 'is-locked' : completed ? 'is-done' : isNext ? 'is-next' : ''}`,
        !unlocked ? 'Locked' : completed ? 'Replay' : isNext ? 'Next' : 'Play',
      );
      if (!unlocked) state.prepend(createIcon('lock', 'icon icon--sm'));
      top.append(number, state);

      const art = el('span', 'level-card__art');
      art.setAttribute('aria-hidden', 'true');
      if (unlocked && constellation) {
        art.append(createConstellationArt(constellation, { className: 'constellation--card' }));
      } else {
        const lock = el('span', 'level-card__lock');
        lock.append(createIcon('lock'));
        art.append(lock);
      }

      const title = el('span', 'level-card__title', level.title);
      const constellationName = el(
        'span',
        'level-card__constellation',
        unlocked
          ? constellation?.name ?? 'A constellation'
          : 'A hidden constellation',
      );
      const stars = createStarRow(best, 3, {
        label: `Best ${best} of 3 stars`,
      });
      stars.classList.add('level-card__stars');
      stars.setAttribute('aria-hidden', 'true');

      append(card, top, art, title, constellationName, stars);
      if (unlocked) {
        card.addEventListener('click', () => {
          context.navigate(`#/play/${level.index + 1}`);
        });
      }
      grid.append(card);
    }

    chapterSection.append(grid);
    body.append(chapterSection);
  }

  const footer = el('footer', 'levels-footer');
  footer.append(
    createIcon(context.progress.persistent ? 'heart' : 'lock', 'icon icon--sm'),
    context.progress.persistent
      ? 'Stars are the hearts you keep. Best results save on this device.'
      : 'This browser is blocking storage, so stars will last for this visit.',
  );

  append(screen, header, summary, body, footer);
  document.title = 'Choose a tangle · Nana Pearl’s Arrow Slide Puzzle';

  return {
    element: screen,
    destroy: () => {
      screen.remove();
    },
  };
}
