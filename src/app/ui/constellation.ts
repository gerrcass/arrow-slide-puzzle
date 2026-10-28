import type { Constellation } from '../../content/schema';
import { svgEl, svgPath } from './dom';
import { RIBBON_PAINT } from './ribbonPalette';

let constellationCounter = 0;

export interface ConstellationArtOptions {
  readonly muted?: boolean;
  readonly className?: string;
}

function makeRandom(seed: number): () => number {
  let state = (seed >>> 0) || 0x9e3779b9;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function seedFor(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * The constellation is one shared visual language: an accent-tinted silhouette,
 * an orbit of dust, gold star lines, and soft nodes. The motif is deliberately
 * low-contrast so the line work stays the hero.
 */
export function createConstellationArt(
  constellation: Constellation,
  options: ConstellationArtOptions = {},
): SVGSVGElement {
  constellationCounter += 1;
  const uid = `constellation-${constellationCounter}`;
  const paint = RIBBON_PAINT[constellation.accent];
  const svg = svgEl('svg', {
    viewBox: '0 0 100 100',
    class: options.className ? `constellation ${options.className}` : 'constellation',
    'aria-hidden': 'true',
    focusable: 'false',
  });
  svg.style.setProperty('--constellation-accent', paint.base);
  svg.style.setProperty('--constellation-light', paint.light);

  const defs = svgEl('defs');
  const haze = svgEl('radialGradient', { id: `${uid}-haze` });
  haze.append(
    svgEl('stop', { offset: '0%', 'stop-color': paint.base, 'stop-opacity': '0.2' }),
    svgEl('stop', { offset: '58%', 'stop-color': '#c8a7ff', 'stop-opacity': '0.055' }),
    svgEl('stop', { offset: '100%', 'stop-color': '#c8a7ff', 'stop-opacity': '0' }),
  );

  const motif = svgEl('linearGradient', {
    id: `${uid}-motif`,
    x1: '0',
    y1: '0',
    x2: '0.85',
    y2: '1',
  });
  motif.append(
    svgEl('stop', { offset: '0%', 'stop-color': paint.light }),
    svgEl('stop', { offset: '46%', 'stop-color': paint.base }),
    svgEl('stop', { offset: '100%', 'stop-color': paint.dark }),
  );

  const soft = svgEl('filter', {
    id: `${uid}-soft`,
    x: '-20%',
    y: '-20%',
    width: '140%',
    height: '140%',
  });
  soft.append(svgEl('feGaussianBlur', { stdDeviation: '2.2' }));

  const starGlow = svgEl('filter', {
    id: `${uid}-star-glow`,
    x: '-120%',
    y: '-120%',
    width: '340%',
    height: '340%',
  });
  starGlow.append(svgEl('feGaussianBlur', { stdDeviation: '1.4' }));

  defs.append(haze, motif, soft, starGlow);
  svg.append(defs);

  svg.append(
    svgEl('ellipse', {
      cx: '50',
      cy: '48',
      rx: '48',
      ry: '42',
      fill: `url(#${uid}-haze)`,
      opacity: options.muted ? '0.3' : '1',
    }),
  );

  const art = svgEl('g', {
    class: 'constellation-art',
    opacity: options.muted ? '0.55' : '1',
  });

  art.append(
    svgPath(constellation.motif, {
      class: 'constellation-motif-halo',
      fill: `url(#${uid}-motif)`,
      'fill-rule': 'evenodd',
      filter: `url(#${uid}-soft)`,
      opacity: '0.55',
    }),
    svgPath(constellation.motif, {
      class: 'constellation-motif',
      fill: `url(#${uid}-motif)`,
      'fill-rule': 'evenodd',
      opacity: '0.82',
    }),
  );

  const orbit = svgEl('g', { class: 'constellation-orbit' });
  orbit.append(
    svgEl('ellipse', {
      cx: '50',
      cy: '50',
      rx: '46',
      ry: '27',
      transform: 'rotate(-18 50 50)',
    }),
    svgEl('ellipse', {
      cx: '50',
      cy: '50',
      rx: '33',
      ry: '44',
      transform: 'rotate(26 50 50)',
    }),
  );
  art.append(orbit);

  const random = makeRandom(seedFor(constellation.id));
  const dust = svgEl('g', { class: 'constellation-dust' });
  for (let index = 0; index < 9; index += 1) {
    const angle = random() * Math.PI * 2;
    const distance = 26 + random() * 22;
    dust.append(
      svgEl('circle', {
        cx: (50 + Math.cos(angle) * distance).toFixed(2),
        cy: (50 + Math.sin(angle) * distance * 0.82).toFixed(2),
        r: (0.38 + random() * 0.72).toFixed(2),
        opacity: (0.18 + random() * 0.36).toFixed(2),
      }),
    );
  }
  art.append(dust);
  svg.append(art);

  const lineGroup = svgEl('g', { class: 'constellation-lines' });
  for (const [fromIndex, toIndex] of constellation.lines) {
    const from = constellation.stars[fromIndex];
    const to = constellation.stars[toIndex];
    if (!from || !to) continue;
    lineGroup.append(
      svgEl('line', {
        x1: (from.x * 100).toFixed(2),
        y1: (from.y * 100).toFixed(2),
        x2: (to.x * 100).toFixed(2),
        y2: (to.y * 100).toFixed(2),
      }),
    );
  }
  svg.append(lineGroup);

  const starGroup = svgEl('g', { class: 'constellation-stars' });
  for (const star of constellation.stars) {
    const radius = (1.1 + star.size * 1.25).toFixed(2);
    const x = (star.x * 100).toFixed(2);
    const y = (star.y * 100).toFixed(2);
    starGroup.append(
      svgEl('circle', {
        class: 'constellation-halo',
        cx: x,
        cy: y,
        r: (Number(radius) * 2.9).toFixed(2),
      }),
      svgEl('circle', {
        class: 'constellation-star',
        cx: x,
        cy: y,
        r: radius,
        filter: `url(#${uid}-star-glow)`,
      }),
    );
  }
  svg.append(starGroup);

  return svg;
}

export function createBrandMark(className = 'brand-mark'): SVGSVGElement {
  const svg = svgEl('svg', {
    viewBox: '0 0 48 48',
    class: className,
    'aria-hidden': 'true',
    focusable: 'false',
  });
  const defs = svgEl('defs');
  const ribbon = svgEl('linearGradient', { id: 'brand-ribbon', x1: '0', y1: '0', x2: '1', y2: '1' });
  ribbon.append(
    svgEl('stop', { offset: '0%', 'stop-color': '#ffe2ed' }),
    svgEl('stop', { offset: '50%', 'stop-color': '#ff9fc4' }),
    svgEl('stop', { offset: '100%', 'stop-color': '#c85f8e' }),
  );
  defs.append(ribbon);
  svg.append(defs);

  svg.append(
    svgEl('rect', {
      x: '1',
      y: '1',
      width: '46',
      height: '46',
      rx: '14',
      fill: '#1d1138',
      stroke: 'rgba(255, 245, 255, 0.18)',
      'stroke-width': '1',
    }),
  );
  svg.append(
    svgEl('path', {
      d: 'M12 33c5-1 7-4 8-10 1-6 4-9 11-9',
      fill: 'none',
      stroke: 'url(#brand-ribbon)',
      'stroke-width': '5',
      'stroke-linecap': 'round',
    }),
  );
  svg.append(
    svgEl('path', {
      d: 'M31 14c2.6 0 4.6 1.8 5 4.4-2.5.1-4.7-1.6-5-4.4Z',
      fill: '#ffd27a',
    }),
  );
  svg.append(
    svgEl('circle', {
      cx: '13',
      cy: '33',
      r: '2.6',
      fill: '#ffd27a',
    }),
  );
  return svg;
}
