import { el } from './dom';
import { createIcon } from './icons';

export type NanaExpression = 'neutral' | 'warm' | 'concerned' | 'delighted';

let nanaCounter = 0;

const NANA = {
  skin: '#f1c8a6',
  skinWarm: '#e7b08a',
  skinShade: '#cf906c',
  cheek: '#e7989f',
  hair: '#ded7e7',
  hairLight: '#f3eef8',
  hairShade: '#b9aec9',
  cardigan: '#4a2e73',
  cardiganLight: '#664694',
  cardiganDark: '#321c51',
  cream: '#fff4dc',
  creamShade: '#e9d6b4',
  glasses: '#3b2340',
  plum: '#2a133d',
  lens: 'rgba(255, 246, 227, 0.16)',
  pearl: '#fff6e3',
} as const;

/**
 * An original, hand-built portrait. The silhouette, bun, glasses, and cardigan
 * stay constant; only the brows, eyes, and mouth change between expressions.
 */
export function createNanaPortrait(
  expression: NanaExpression = 'warm',
  className = 'nana-portrait',
): SVGSVGElement {
  nanaCounter += 1;
  const uid = `nana-${nanaCounter}`;
  const svg = elNS('svg') as SVGSVGElement;
  svg.setAttribute('viewBox', '0 0 96 112');
  svg.setAttribute('class', className);
  svg.setAttribute('data-expression', expression);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');

  const defs = elNS('defs') as SVGDefsElement;
  const cardigan = gradient(`${uid}-cardigan`, NANA.cardiganLight, NANA.cardigan, NANA.cardiganDark);
  const hair = gradient(`${uid}-hair`, NANA.hairLight, NANA.hair, NANA.hairShade);
  const skin = gradient(`${uid}-skin`, '#f8d8ba', NANA.skin, NANA.skinWarm);
  defs.append(cardigan, hair, skin);
  svg.append(defs);

  // Cardigan and cream blouse.
  svg.append(
    shape('path', {
      d: 'M12 112 C12 93 27 83 48 83 C69 83 84 93 84 112 Z',
      fill: `url(#${uid}-cardigan)`,
    }),
    shape('path', {
      d: 'M36 87 C40 95 56 95 60 87 L64 112 H32 Z',
      fill: NANA.cream,
    }),
    shape('path', {
      d: 'M33 83 C38 82 44 85 48 92 C41 94 35 91 31 86 Z',
      fill: NANA.cream,
      opacity: '0.92',
    }),
    shape('path', {
      d: 'M63 83 C58 82 52 85 48 92 C55 94 61 91 65 86 Z',
      fill: NANA.creamShade,
      opacity: '0.88',
    }),
    shape('path', {
      d: 'M42 82 C44 87 46 89 48 90 C50 89 52 87 54 82 Z',
      fill: NANA.skinShade,
      opacity: '0.7',
    }),
  );

  // Neck and face.
  svg.append(
    shape('rect', {
      x: '41',
      y: '73',
      width: '14',
      height: '14',
      rx: '6',
      fill: NANA.skinShade,
    }),
    shape('circle', { cx: '23', cy: '56', r: '5.4', fill: NANA.skinWarm }),
    shape('circle', { cx: '73', cy: '56', r: '5.4', fill: NANA.skinWarm }),
    shape('ellipse', {
      cx: '48',
      cy: '50',
      rx: '24.5',
      ry: '27.5',
      fill: `url(#${uid}-skin)`,
    }),
  );

  // Silver hair and bun.
  svg.append(
    shape('path', {
      d: 'M22 52 C18 24 31 11 48 11 C65 11 78 24 74 52 C70 37 62 30 48 30 C34 30 26 37 22 52 Z',
      fill: `url(#${uid}-hair)`,
    }),
    shape('circle', {
      cx: '48',
      cy: '11',
      r: '12',
      fill: `url(#${uid}-hair)`,
      stroke: NANA.hairShade,
      'stroke-width': '0.6',
    }),
    shape('path', {
      d: 'M39 10 C42 5 51 4 56 8',
      fill: 'none',
      stroke: NANA.hairLight,
      'stroke-width': '2.4',
      'stroke-linecap': 'round',
    }),
    shape('path', {
      d: 'M31 36 C27 42 26 48 27 53',
      fill: 'none',
      stroke: NANA.hairShade,
      'stroke-width': '1.4',
      'stroke-linecap': 'round',
      opacity: '0.55',
    }),
    shape('path', {
      d: 'M65 36 C69 42 70 48 69 53',
      fill: 'none',
      stroke: NANA.hairShade,
      'stroke-width': '1.4',
      'stroke-linecap': 'round',
      opacity: '0.55',
    }),
  );

  // A tiny pearl pin in the bun.
  svg.append(
    shape('circle', { cx: '57', cy: '7', r: '2.2', fill: NANA.pearl }),
    shape('circle', {
      cx: '57',
      cy: '7',
      r: '0.9',
      fill: '#ffffff',
      opacity: '0.9',
    }),
  );

  // Cheeks and nose.
  svg.append(
    shape('ellipse', {
      cx: '30.5',
      cy: '61.5',
      rx: '5',
      ry: '3.1',
      fill: NANA.cheek,
      opacity: '0.42',
    }),
    shape('ellipse', {
      cx: '65.5',
      cy: '61.5',
      rx: '5',
      ry: '3.1',
      fill: NANA.cheek,
      opacity: '0.42',
    }),
    shape('path', {
      d: 'M48 56 C50 59 51 61 48.6 62',
      fill: 'none',
      stroke: NANA.skinShade,
      'stroke-width': '1.6',
      'stroke-linecap': 'round',
      opacity: '0.8',
    }),
  );

  appendBrows(svg, expression);
  appendEyes(svg, expression);
  appendMouth(svg, expression);

  // Glasses sit over the eyes.
  svg.append(
    shape('circle', {
      cx: '37.5',
      cy: '53',
      r: '9.2',
      fill: NANA.lens,
      stroke: NANA.glasses,
      'stroke-width': '2.1',
    }),
    shape('circle', {
      cx: '58.5',
      cy: '53',
      r: '9.2',
      fill: NANA.lens,
      stroke: NANA.glasses,
      'stroke-width': '2.1',
    }),
    shape('path', {
      d: 'M46.6 52 C47.5 50.6 48.5 50.6 49.4 52',
      fill: 'none',
      stroke: NANA.glasses,
      'stroke-width': '2',
      'stroke-linecap': 'round',
    }),
    shape('path', {
      d: 'M28.4 51.4 L23.5 53',
      fill: 'none',
      stroke: NANA.glasses,
      'stroke-width': '1.8',
      'stroke-linecap': 'round',
    }),
    shape('path', {
      d: 'M67.6 51.4 L72.5 53',
      fill: 'none',
      stroke: NANA.glasses,
      'stroke-width': '1.8',
      'stroke-linecap': 'round',
    }),
  );

  // Pearl earrings on the cardigan side.
  svg.append(
    shape('circle', { cx: '23', cy: '63', r: '2.1', fill: NANA.pearl }),
    shape('circle', { cx: '73', cy: '63', r: '2.1', fill: NANA.pearl }),
    shape('circle', { cx: '48', cy: '100', r: '1.8', fill: NANA.pearl }),
    shape('circle', { cx: '48', cy: '107', r: '1.8', fill: NANA.pearl }),
  );

  return svg;
}

function appendBrows(svg: SVGSVGElement, expression: NanaExpression): void {
  const stroke = NANA.hairShade;
  if (expression === 'concerned') {
    svg.append(
      shape('path', {
        d: 'M31 39 C35 40 39 42 42 44',
        fill: 'none',
        stroke,
        'stroke-width': '1.8',
        'stroke-linecap': 'round',
      }),
      shape('path', {
        d: 'M65 39 C61 40 57 42 54 44',
        fill: 'none',
        stroke,
        'stroke-width': '1.8',
        'stroke-linecap': 'round',
      }),
    );
    return;
  }
  svg.append(
    shape('path', {
      d: 'M31 39 C35 36.8 39 36.8 42 38.8',
      fill: 'none',
      stroke,
      'stroke-width': '1.7',
      'stroke-linecap': 'round',
      opacity: '0.7',
    }),
    shape('path', {
      d: 'M65 39 C61 36.8 57 36.8 54 38.8',
      fill: 'none',
      stroke,
      'stroke-width': '1.7',
      'stroke-linecap': 'round',
      opacity: '0.7',
    }),
  );
}

function appendEyes(svg: SVGSVGElement, expression: NanaExpression): void {
  if (expression === 'delighted') {
    svg.append(
      shape('path', {
        d: 'M33.5 54 C35.5 50.8 39.5 50.8 41.5 54',
        fill: 'none',
        stroke: NANA.plum,
        'stroke-width': '1.9',
        'stroke-linecap': 'round',
      }),
      shape('path', {
        d: 'M54.5 54 C56.5 50.8 60.5 50.8 62.5 54',
        fill: 'none',
        stroke: NANA.plum,
        'stroke-width': '1.9',
        'stroke-linecap': 'round',
      }),
    );
    return;
  }

  const eyeY = expression === 'concerned' ? 53.8 : 53.4;
  svg.append(
    shape('circle', {
      cx: '37.5',
      cy: String(eyeY),
      r: expression === 'concerned' ? '1.9' : '1.7',
      fill: NANA.plum,
    }),
    shape('circle', {
      cx: '58.5',
      cy: String(eyeY),
      r: expression === 'concerned' ? '1.9' : '1.7',
      fill: NANA.plum,
    }),
    shape('circle', {
      cx: '38.1',
      cy: String(eyeY - 0.6),
      r: '0.5',
      fill: '#ffffff',
      opacity: '0.9',
    }),
    shape('circle', {
      cx: '59.1',
      cy: String(eyeY - 0.6),
      r: '0.5',
      fill: '#ffffff',
      opacity: '0.9',
    }),
  );
}

function appendMouth(svg: SVGSVGElement, expression: NanaExpression): void {
  switch (expression) {
    case 'delighted':
      svg.append(
        shape('path', {
          d: 'M40.5 67 C44 73 52 73 55.5 67 C52 68 44 68 40.5 67 Z',
          fill: NANA.plum,
        }),
        shape('path', {
          d: 'M44.5 70.5 C46 72 50 72 51.5 70.5 C50 71.4 46 71.4 44.5 70.5 Z',
          fill: NANA.cheek,
        }),
      );
      break;
    case 'concerned':
      svg.append(
        shape('path', {
          d: 'M42.5 70 C45 68.6 51 68.6 53.5 70',
          fill: 'none',
          stroke: NANA.plum,
          'stroke-width': '1.9',
          'stroke-linecap': 'round',
        }),
      );
      break;
    case 'warm':
      svg.append(
        shape('path', {
          d: 'M41.5 67.5 C44.5 72.6 51.5 72.6 54.5 67.5',
          fill: 'none',
          stroke: NANA.plum,
          'stroke-width': '1.9',
          'stroke-linecap': 'round',
        }),
      );
      break;
    case 'neutral':
      svg.append(
        shape('path', {
          d: 'M43 69.5 C45.5 71.5 50.5 71.5 53 69.5',
          fill: 'none',
          stroke: NANA.plum,
          'stroke-width': '1.8',
          'stroke-linecap': 'round',
        }),
      );
      break;
  }
}

export interface SpeechBubbleOptions {
  readonly text: string;
  readonly name?: string | undefined;
  readonly onDismiss?: (() => void) | undefined;
  readonly dismissible?: boolean | undefined;
  readonly className?: string | undefined;
}

export function createSpeechBubble(options: SpeechBubbleOptions): HTMLDivElement {
  const bubble = el(
    'div',
    options.className ? `guide-bubble ${options.className}` : 'guide-bubble',
  );
  bubble.setAttribute('role', 'group');
  bubble.setAttribute('aria-label', options.name ?? 'Nana Pearl');

  const head = el('div', 'guide-bubble__head');
  const name = el('span', 'guide-bubble__name', options.name ?? 'Nana Pearl');
  head.append(name, el('span', 'guide-bubble__rule', '·'));
  if (options.dismissible !== false) {
    const dismiss = el('button', 'guide-bubble__dismiss');
    dismiss.type = 'button';
    dismiss.setAttribute('aria-label', 'Dismiss Nana Pearl’s tip');
    dismiss.append(createIcon('close'));
    dismiss.addEventListener('click', () => options.onDismiss?.());
    head.append(dismiss);
  }

  const text = el('p', 'guide-bubble__text', options.text);
  bubble.append(head, text);
  return bubble;
}

export interface GuideMomentOptions extends SpeechBubbleOptions {
  readonly expression: NanaExpression;
}

/** Portrait plus cream bubble, sharing the same tail and dismiss control. */
export function createGuideMoment(options: GuideMomentOptions): HTMLDivElement {
  const moment = el(
    'div',
    options.className ? `guide-moment ${options.className}` : 'guide-moment',
  );
  moment.append(
    createNanaPortrait(options.expression, 'nana-portrait guide-moment__portrait'),
    createSpeechBubble({
      text: options.text,
      name: options.name,
      onDismiss: options.onDismiss,
      dismissible: options.dismissible,
      className: 'guide-bubble',
    }),
  );
  return moment;
}

function elNS(name: string): SVGElement {
  return document.createElementNS('http://www.w3.org/2000/svg', name);
}

function shape(
  name: string,
  attributes: Readonly<Record<string, string>>,
): SVGElement {
  const node = elNS(name);
  for (const [key, value] of Object.entries(attributes)) {
    node.setAttribute(key, value);
  }
  return node;
}

function gradient(id: string, from: string, mid: string, to: string): SVGLinearGradientElement {
  const node = elNS('linearGradient') as SVGLinearGradientElement;
  node.setAttribute('id', id);
  node.setAttribute('x1', '0');
  node.setAttribute('y1', '0');
  node.setAttribute('x2', '0.6');
  node.setAttribute('y2', '1');
  for (const [offset, color] of [
    ['0%', from],
    ['52%', mid],
    ['100%', to],
  ] as const) {
    const stop = elNS('stop');
    stop.setAttribute('offset', offset);
    stop.setAttribute('stop-color', color);
    node.append(stop);
  }
  return node;
}
