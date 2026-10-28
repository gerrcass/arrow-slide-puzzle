import { LEVELS } from '../../content/levels';
import type { AppContext, Screen } from '../context';
import { collectedCardCount, galleryCards, type GalleryCard } from '../gallery';
import { createConstellationArt } from '../ui/constellation';
import { append, el } from '../ui/dom';
import { createIcon } from '../ui/icons';
import { createStarRow } from '../ui/stars';

function cardLabel(card: GalleryCard, name: string): string {
  if (!card.collected) {
    return `Level ${card.levelNumber}. A hidden constellation. Locked. Complete tangle ${card.levelNumber} to collect it.`;
  }
  const stars =
    card.bestStars === 1 ? '1 star' : `${card.bestStars} stars`;
  return `${name}, level ${card.levelNumber}. Best ${stars} of 3. Replay this tangle.`;
}

export function galleryScreen(context: AppContext): Screen {
  const screen = el('main', 'screen gallery-screen');
  const cards = galleryCards(
    LEVELS,
    (levelIndex) => context.progress.isConstellationCollected(levelIndex),
    (levelIndex) => context.progress.bestStars(levelIndex),
  );
  const collected = collectedCardCount(cards);

  const header = el('header', 'gallery-header');
  const back = el('button', 'icon-button');
  back.type = 'button';
  back.setAttribute('aria-label', 'Back to level select');
  back.append(createIcon('arrow-left'));
  back.addEventListener('click', () => context.navigate('#/levels'));

  const headingBlock = el('div', 'gallery-heading');
  const eyebrow = el('p', 'eyebrow', 'Collected light');
  const heading = el('h1', 'gallery-title', 'The gallery');
  heading.tabIndex = -1;
  heading.setAttribute('data-screen-heading', '');
  append(headingBlock, eyebrow, heading);

  const settings = el('button', 'icon-button');
  settings.type = 'button';
  settings.setAttribute('aria-label', 'Settings');
  settings.append(createIcon('settings'));
  settings.addEventListener('click', () => context.openSettings());

  append(header, back, headingBlock, settings);

  const lede = el(
    'p',
    'gallery-lede',
    'Every tangle keeps a piece of sky. Clear a tangle to bring its constellation home.',
  );

  const summary = el('div', 'gallery-summary');
  const collectedPill = el('span', 'pill pill--gold');
  collectedPill.append(
    createIcon('star', 'icon icon--sm'),
    `${collected} / ${LEVELS.length} collected`,
  );
  const starPill = el('span', 'pill');
  starPill.append(
    createIcon('sparkle', 'icon icon--sm'),
    `${context.progress.totalStars} / ${LEVELS.length * 3} stars`,
  );
  const quietPill = el('span', 'pill');
  quietPill.append(createIcon('moon', 'icon icon--sm'), 'No timers, no rush');
  append(summary, collectedPill, starPill, quietPill);

  const grid = el('ul', 'gallery-grid');
  for (const card of cards) {
    const item = el('li', 'gallery-grid__item');
    const name = card.constellation?.name ?? 'A constellation';
    const classes = ['gallery-card'];
    if (!card.collected) classes.push('is-locked');

    const surface = card.collected
      ? el('button', classes.join(' '))
      : el('article', classes.join(' '));
    if (surface instanceof HTMLButtonElement) {
      surface.type = 'button';
      surface.addEventListener('click', () => {
        context.navigate(`#/play/${card.levelNumber}`);
      });
      const stars = card.bestStars === 1 ? '1 star' : `${card.bestStars} stars`;
      surface.append(
        el(
          'span',
          'visually-hidden',
          `Level ${card.levelNumber}, ${name}. Best ${stars} of 3. Replay this tangle.`,
        ),
      );
    } else {
      surface.setAttribute('aria-label', cardLabel(card, name));
    }

    const artWrap = el('div', 'gallery-card__art');
    artWrap.setAttribute('aria-hidden', 'true');
    if (card.constellation) {
      artWrap.append(
        createConstellationArt(card.constellation, {
          className: card.collected
            ? 'constellation--gallery'
            : 'constellation--gallery constellation--locked',
        }),
      );
    }
    if (!card.collected) {
      const lock = el('span', 'gallery-card__lock');
      lock.append(createIcon('lock'));
      artWrap.append(lock);
    }
    const number = el(
      'span',
      'gallery-card__number',
      `Level ${String(card.levelNumber).padStart(2, '0')}`,
    );
    artWrap.append(number);

    const title = el(
      'span',
      'gallery-card__name',
      card.collected ? name : 'A hidden constellation',
    );
    const caption = el(
      'span',
      'gallery-card__caption',
      card.collected
        ? card.constellation?.caption ?? ''
        : `Clear tangle ${String(card.levelNumber).padStart(2, '0')} to uncover it.`,
    );

    const footer = el('span', 'gallery-card__footer');
    if (card.collected) {
      const stars = createStarRow(card.bestStars, 3, {
        label: `Best ${card.bestStars} of 3 stars`,
      });
      stars.classList.add('gallery-card__stars');
      stars.setAttribute('aria-hidden', 'true');
      footer.append(stars, el('span', 'gallery-card__action', 'Replay'));
    } else {
      const lockLine = el('span', 'gallery-card__locked-note');
      lockLine.append(createIcon('lock', 'icon icon--sm'), 'Locked');
      footer.append(lockLine);
    }

    append(
      surface,
      artWrap,
      document.createTextNode(' '),
      title,
      document.createTextNode(' '),
      caption,
      document.createTextNode(' '),
      footer,
    );
    item.append(surface);
    grid.append(item);
  }

  const footer = el('footer', 'gallery-footer');
  footer.append(
    createIcon('sparkle', 'icon icon--sm'),
    collected === LEVELS.length
      ? 'Every constellation is home. The whole sky is yours.'
      : 'Completing a tangle collects its constellation, whatever the stars.',
  );

  append(screen, header, lede, summary, grid, footer);
  document.title = 'The gallery · Nana Pearl’s Arrow Slide Puzzle';
  context.announce(`The gallery. ${collected} of ${LEVELS.length} constellations collected.`);

  return {
    element: screen,
    destroy: () => {
      screen.remove();
    },
  };
}
