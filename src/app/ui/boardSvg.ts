import { HEADING_VECTORS } from '../../engine/geometry';
import type { Board, Cell, Heading, Piece, RibbonColor } from '../../engine/types';
import { svgEl, svgPath } from './dom';
import { RIBBON_PAINT } from './ribbonPalette';

export interface BoardArt {
  readonly svg: SVGSVGElement;
  readonly groups: ReadonlyMap<string, SVGGElement>;
}

export interface BoardArtOptions {
  readonly seed: number;
  readonly interactive?: boolean;
  readonly accent?: RibbonColor;
  readonly className?: string;
}

let boardCounter = 0;

function boardId(): string {
  boardCounter += 1;
  return `arrow-board-${boardCounter}`;
}

function makeRandom(seed: number): () => number {
  let state = (seed >>> 0) || 0x9e3779b9;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function centre(cell: Cell): Cell {
  return { x: cell.x + 0.5, y: cell.y + 0.5 };
}

function shortenHead(points: readonly Cell[], heading: Heading): readonly Cell[] {
  if (points.length < 2) return points;
  const vector = HEADING_VECTORS[heading];
  const head = points[points.length - 1];
  if (!head) return points;
  const short = points.slice(0, -1);
  short.push({ x: head.x - vector.x * 0.16, y: head.y - vector.y * 0.16 });
  return short;
}

function pathData(points: readonly Cell[]): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  if (!first) return '';
  let d = `M ${first.x.toFixed(3)} ${first.y.toFixed(3)}`;
  for (const point of rest) {
    d += ` L ${point.x.toFixed(3)} ${point.y.toFixed(3)}`;
  }
  return d;
}

function arrowPoints(piece: Piece): readonly Cell[] {
  const head = piece.path[piece.path.length - 1];
  if (!head) return [];
  const vector = HEADING_VECTORS[piece.heading];
  const perpendicular = { x: -vector.y, y: vector.x };
  const centreHead = centre(head);
  const tip = {
    x: centreHead.x + vector.x * 0.43,
    y: centreHead.y + vector.y * 0.43,
  };
  const base = {
    x: centreHead.x - vector.x * 0.12,
    y: centreHead.y - vector.y * 0.12,
  };
  const halfWidth = 0.275;
  return [
    tip,
    {
      x: base.x + perpendicular.x * halfWidth,
      y: base.y + perpendicular.y * halfWidth,
    },
    {
      x: base.x - perpendicular.x * halfWidth,
      y: base.y - perpendicular.y * halfWidth,
    },
  ];
}

function pointsAttribute(points: readonly Cell[]): string {
  return points.map((point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`).join(' ');
}

function appendDefs(svg: SVGSVGElement, board: Board, uid: string, accent: RibbonColor): void {
  const defs = svgEl('defs');

  const surface = svgEl('linearGradient', {
    id: `${uid}-surface`,
    x1: '0',
    y1: '0',
    x2: '0.85',
    y2: '1',
  });
  surface.append(
    svgEl('stop', { offset: '0%', 'stop-color': '#231245' }),
    svgEl('stop', { offset: '52%', 'stop-color': '#170b2f' }),
    svgEl('stop', { offset: '100%', 'stop-color': '#0e0620' }),
  );

  const glow = svgEl('radialGradient', { id: `${uid}-glow` });
  glow.append(
    svgEl('stop', { offset: '0%', 'stop-color': '#8e5ad6', 'stop-opacity': '0.26' }),
    svgEl('stop', { offset: '55%', 'stop-color': '#6a3ab0', 'stop-opacity': '0.1' }),
    svgEl('stop', { offset: '100%', 'stop-color': '#6a3ab0', 'stop-opacity': '0' }),
  );

  const accentGlow = svgEl('radialGradient', { id: `${uid}-accent-glow` });
  accentGlow.append(
    svgEl('stop', {
      offset: '0%',
      'stop-color': RIBBON_PAINT[accent].base,
      'stop-opacity': '0.22',
    }),
    svgEl('stop', {
      offset: '100%',
      'stop-color': RIBBON_PAINT[accent].base,
      'stop-opacity': '0',
    }),
  );

  defs.append(surface, glow, accentGlow);

  for (const piece of board.pieces) {
    const paint = RIBBON_PAINT[piece.color];
    const ys = piece.path.map((cell) => cell.y);
    const minY = Math.min(...ys) + 0.5;
    const maxY = Math.max(...ys) + 0.5;
    const gradient = svgEl('linearGradient', {
      id: `${uid}-piece-${piece.id}`,
      gradientUnits: 'userSpaceOnUse',
      x1: '0',
      y1: (minY - 0.32).toFixed(3),
      x2: '0',
      y2: (maxY + 0.32).toFixed(3),
    });
    gradient.append(
      svgEl('stop', { offset: '0%', 'stop-color': paint.light }),
      svgEl('stop', { offset: '44%', 'stop-color': paint.base }),
      svgEl('stop', { offset: '100%', 'stop-color': paint.dark }),
    );
    defs.append(gradient);
  }

  const pattern = svgEl('pattern', {
    id: `${uid}-lattice`,
    width: '1',
    height: '1',
    patternUnits: 'userSpaceOnUse',
  });
  pattern.append(
    svgPath('M 1 0 L 0 0 L 0 1', {
      fill: 'none',
      stroke: 'rgba(231, 213, 255, 0.055)',
      'stroke-width': '0.014',
    }),
    svgEl('circle', {
      cx: '0',
      cy: '0',
      r: '0.022',
      fill: 'rgba(244, 231, 255, 0.1)',
    }),
  );

  const softBlur = svgEl('filter', {
    id: `${uid}-soft-blur`,
    x: '-20%',
    y: '-20%',
    width: '140%',
    height: '140%',
  });
  softBlur.append(svgEl('feGaussianBlur', { stdDeviation: '0.055' }));

  defs.append(pattern, softBlur);
  svg.append(defs);
}

function appendBackground(svg: SVGSVGElement, board: Board, uid: string): void {
  const surface = svgEl('rect', {
    x: '0',
    y: '0',
    width: String(board.width),
    height: String(board.height),
    rx: '0.42',
    fill: `url(#${uid}-surface)`,
  });
  svg.append(surface);

  svg.append(
    svgEl('ellipse', {
      cx: String(board.width / 2),
      cy: String(board.height / 2),
      rx: String(board.width * 0.66),
      ry: String(board.height * 0.66),
      fill: `url(#${uid}-glow)`,
    }),
  );

  const random = makeRandom(board.width * 131 + board.height * 977);
  const starCount = Math.round((board.width * board.height) / 3.4) + 4;
  for (let index = 0; index < starCount; index += 1) {
    const x = 0.35 + random() * (board.width - 0.7);
    const y = 0.35 + random() * (board.height - 0.7);
    const radius = 0.014 + random() * 0.026;
    const opacity = 0.1 + random() * 0.2;
    svg.append(
      svgEl('circle', {
        cx: x.toFixed(3),
        cy: y.toFixed(3),
        r: radius.toFixed(3),
        fill: '#f7ecff',
        opacity: opacity.toFixed(2),
        class: 'board-star',
      }),
    );
  }

  svg.append(
    svgEl('rect', {
      x: '0',
      y: '0',
      width: String(board.width),
      height: String(board.height),
      rx: '0.42',
      fill: `url(#${uid}-lattice)`,
      class: 'board-lattice',
    }),
  );

  svg.append(
    svgEl('rect', {
      x: '0.015',
      y: '0.015',
      width: String(board.width - 0.03),
      height: String(board.height - 0.03),
      rx: '0.405',
      fill: 'none',
      stroke: 'rgba(237, 220, 255, 0.09)',
      'stroke-width': '0.012',
    }),
  );
}

function appendPiece(
  svg: SVGSVGElement,
  piece: Piece,
  uid: string,
  interactive: boolean,
): SVGGElement {
  const group = svgEl('g', {
    class: 'ribbon',
    'data-piece-id': piece.id,
    'data-color': piece.color,
    'data-heading': piece.heading,
    'data-length': String(piece.path.length),
  });
  if (interactive) {
    group.setAttribute('tabindex', '0');
    group.setAttribute('role', 'button');
    group.setAttribute('focusable', 'true');
  }

  const paint = RIBBON_PAINT[piece.color];
  const fullPoints = piece.path.map(centre);
  const drawPoints = shortenHead(fullPoints, piece.heading);
  const d = pathData(drawPoints);
  const haloD = pathData(fullPoints);

  group.append(
    svgPath(haloD, {
      class: 'ribbon-halo',
      fill: 'none',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }),
    svgPath(d, {
      class: 'ribbon-under',
      fill: 'none',
      stroke: paint.edge,
      'stroke-width': '0.66',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      transform: 'translate(0 0.07)',
      opacity: '0.6',
    }),
    svgPath(d, {
      class: 'ribbon-main',
      fill: 'none',
      stroke: `url(#${uid}-piece-${piece.id})`,
      'stroke-width': '0.58',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    }),
    svgPath(d, {
      class: 'ribbon-sheen',
      fill: 'none',
      stroke: paint.light,
      'stroke-width': '0.14',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      transform: 'translate(0 -0.065)',
      opacity: '0.42',
    }),
  );

  if (piece.path.length === 1) {
    const first = fullPoints[0];
    if (first) {
      group.append(
        svgEl('circle', {
          cx: String(first.x),
          cy: String(first.y),
          r: '0.2',
          fill: `url(#${uid}-piece-${piece.id})`,
        }),
      );
    }
  }

  const arrow = arrowPoints(piece);
  if (arrow.length === 3) {
    group.append(
      svgEl('polygon', {
        class: 'ribbon-arrow',
        points: pointsAttribute(arrow),
        fill: `url(#${uid}-piece-${piece.id})`,
        stroke: paint.edge,
        'stroke-width': '0.055',
        'stroke-linejoin': 'round',
      }),
    );
  }

  const head = piece.path[piece.path.length - 1];
  if (head) {
    const headCentre = centre(head);
    const vector = HEADING_VECTORS[piece.heading];
    group.append(
      svgEl('circle', {
        class: 'ribbon-spark',
        cx: String(headCentre.x - vector.x * 0.04 - vector.y * 0.06),
        cy: String(headCentre.y - vector.y * 0.04 + vector.x * 0.06),
        r: '0.045',
        fill: '#fffaf0',
        opacity: '0.55',
      }),
    );
  }

  if (interactive) {
    group.append(
      svgPath(haloD, {
        class: 'ribbon-hit',
        fill: 'none',
        stroke: 'transparent',
        'stroke-width': '1.02',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'pointer-events': 'stroke',
      }),
    );
  }

  svg.append(group);
  return group;
}

export function createBoardArt(board: Board, options: BoardArtOptions): BoardArt {
  const uid = boardId();
  const svg = svgEl('svg', {
    viewBox: `${-0.55} ${-0.55} ${board.width + 1.1} ${board.height + 1.1}`,
    class: options.className ? `board-svg ${options.className}` : 'board-svg',
    role: options.interactive ? 'group' : 'presentation',
    'aria-label': options.interactive ? 'Tangle board' : '',
  });

  appendDefs(svg, board, uid, options.accent ?? 'rose');
  appendBackground(svg, board, uid);

  const groups = new Map<string, SVGGElement>();
  for (const piece of board.pieces) {
    groups.set(
      piece.id,
      appendPiece(svg, piece, uid, options.interactive ?? false),
    );
  }

  if (!options.interactive) {
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
  }

  return { svg, groups };
}

export function describePiece(piece: Piece): string {
  const paint = RIBBON_PAINT[piece.color];
  const cells = piece.path.length === 1 ? '1 cell' : `${piece.path.length} cells`;
  return `${capitalise(paint.name)} ribbon, ${cells}, pointing ${piece.heading}.`;
}

export function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
