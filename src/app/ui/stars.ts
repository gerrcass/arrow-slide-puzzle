import { createIcon } from './icons';
import { el } from './dom';

export function createStarRow(
  earned: number,
  total = 3,
  options: { readonly animated?: boolean; readonly label?: string } = {},
): HTMLDivElement {
  const row = el('div', 'star-row');
  row.setAttribute('role', 'img');
  row.setAttribute('aria-label', options.label ?? `${earned} of ${total} stars`);
  for (let index = 0; index < total; index += 1) {
    const slot = el('span', `star-slot ${index < earned ? 'is-earned' : 'is-empty'}`);
    if (options.animated && index < earned) {
      slot.style.setProperty('--star-index', String(index));
      slot.classList.add('is-popping');
    }
    slot.setAttribute('aria-hidden', 'true');
    slot.append(createIcon('star', 'icon'));
    row.append(slot);
  }
  return row;
}

export function createHeartRow(
  hearts: number,
  total = 3,
  className = 'heart-row',
): HTMLDivElement {
  const row = el('div', className);
  row.setAttribute('role', 'img');
  row.setAttribute('aria-label', `${hearts} of ${total} hearts remaining`);
  for (let index = 0; index < total; index += 1) {
    const slot = el('span', `heart-slot ${index < hearts ? 'is-full' : 'is-empty'}`);
    slot.setAttribute('aria-hidden', 'true');
    slot.append(createIcon('heart', 'icon'));
    row.append(slot);
  }
  return row;
}
