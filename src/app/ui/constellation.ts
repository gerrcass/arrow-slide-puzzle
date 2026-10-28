import type { Constellation } from '../../content/schema';
import { svgEl } from './dom';

let constellationCounter = 0;

export interface ConstellationArtOptions {
  readonly muted?: boolean;
  readonly className?: string;
}

export function createConstellationArt(
  constellation: Constellation,
  options: ConstellationArtOptions = {},
): SVGSVGElement {
  constellationCounter += 1;
  const uid = `constellation-${constellationCounter}`;
  const svg = svgEl('svg', {
    viewBox: '0 0 100 100',
    class: options.className ? `constellation ${options.className}` : 'constellation',
    'aria-hidden': 'true',
    focusable: 'false',
  });

  const defs = svgEl('defs');
  const haze = svgEl('radialGradient', { id: `${uid}-haze` });
  haze.append(
    svgEl('stop', { offset: '0%', 'stop-color': '#ffd27a', 'stop-opacity': '0.16' }),
    svgEl('stop', { offset: '60%', 'stop-color': '#c8a7ff', 'stop-opacity': '0.06' }),
    svgEl('stop', { offset: '100%', 'stop-color': '#c8a7ff', 'stop-opacity': '0' }),
  );
  defs.append(haze);
  svg.append(defs);

  svg.append(
    svgEl('ellipse', {
      cx: '50',
      cy: '48',
      rx: '48',
      ry: '42',
      fill: `url(#${uid}-haze)`,
      opacity: options.muted ? '0.35' : '1',
    }),
  );

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
    starGroup.append(
      svgEl('circle', {
        cx: (star.x * 100).toFixed(2),
        cy: (star.y * 100).toFixed(2),
        r: radius,
      }),
    );
    starGroup.append(
      svgEl('circle', {
        cx: (star.x * 100).toFixed(2),
        cy: (star.y * 100).toFixed(2),
        r: (Number(radius) * 2.7).toFixed(2),
        class: 'constellation-halo',
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
