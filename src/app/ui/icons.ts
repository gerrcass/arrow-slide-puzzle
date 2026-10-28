import { svgEl } from './dom';

export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'chevron-right'
  | 'settings'
  | 'heart'
  | 'star'
  | 'lock'
  | 'hint'
  | 'reset'
  | 'play'
  | 'close'
  | 'check'
  | 'moon'
  | 'sparkle'
  | 'gallery'
  | 'sound'
  | 'mute'
  | 'describe';

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '1.7',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
} as const;

function lineIcon(name: IconName, svg: SVGSVGElement): void {
  const path = (d: string, attributes: Readonly<Record<string, string>> = {}) => {
    svg.append(svgEl('path', { d, ...STROKE, ...attributes }));
  };
  const circle = (cx: string, cy: string, r: string) => {
    svg.append(svgEl('circle', { cx, cy, r, ...STROKE }));
  };

  switch (name) {
    case 'arrow-left':
      path('M15.5 5.5 8 12l7.5 6.5');
      break;
    case 'arrow-right':
      path('M8.5 5.5 16 12l-7.5 6.5');
      break;
    case 'chevron-right':
      path('M9.5 5.5 16 12l-6.5 6.5');
      break;
    case 'settings':
      path('M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9');
      circle('15', '7.5', '2');
      circle('9', '16.5', '2');
      break;
    case 'lock':
      path('M6.5 10.5V8a5.5 5.5 0 0 1 11 0v2.5');
      svg.append(
        svgEl('rect', {
          x: '4.5',
          y: '10.5',
          width: '15',
          height: '10',
          rx: '3',
          ...STROKE,
        }),
      );
      circle('12', '15.5', '1.1');
      break;
    case 'hint':
      path('M12 3.5c.7 5 2.8 7.1 7.8 7.8-5 .7-7.1 2.8-7.8 7.8-.7-5-2.8-7.1-7.8-7.8 5-.7 7.1-2.8 7.8-7.8Z');
      break;
    case 'reset':
      path('M19 12a7 7 0 1 1-2.05-4.95M19 4v5h-5');
      break;
    case 'play':
      path('M8.5 5.3v13.4L19 12 8.5 5.3Z', { fill: 'currentColor', stroke: 'none' });
      break;
    case 'close':
      path('M6 6l12 12M18 6 6 18');
      break;
    case 'check':
      path('M5 12.5 9.6 17 19 7');
      break;
    case 'moon':
      path('M20 14.4A8.4 8.4 0 0 1 9.6 4a8.5 8.5 0 1 0 10.4 10.4Z');
      break;
    case 'sparkle':
      path('M12 2.8c.5 4.4 2.4 6.3 6.8 6.8-4.4.5-6.3 2.4-6.8 6.8-.5-4.4-2.4-6.3-6.8-6.8 4.4-.5 6.3-2.4 6.8-6.8Z');
      break;
    case 'gallery':
      svg.append(
        svgEl('rect', {
          x: '3.5',
          y: '4.5',
          width: '17',
          height: '15',
          rx: '3.2',
          ...STROKE,
        }),
      );
      path('M8 16.2 11.2 12l2.5 3 2-2.2 3.3 4.4');
      path('M15.8 9.4c.2 1.4 1 2.2 2.4 2.4-1.4.2-2.2 1-2.4 2.4-.2-1.4-1-2.2-2.4-2.4 1.4-.2 2.2-1 2.4-2.4Z');
      break;
    case 'sound':
      path('M5 9.5h3.2L13 5.8v12.4l-4.8-3.7H5Z');
      path('M16 9.2a4 4 0 0 1 0 5.6M18.4 6.8a7.4 7.4 0 0 1 0 10.4');
      break;
    case 'mute':
      path('M5 9.5h3.2L13 5.8v12.4l-4.8-3.7H5Z');
      path('M16.2 9.6l4.6 4.8M20.8 9.6l-4.6 4.8');
      break;
    case 'describe':
      path('M4.5 6.5h15M4.5 12h9.5M4.5 17.5h6.5');
      path('M18 13.2c.3 2.3 1.3 3.3 3.6 3.6-2.3.3-3.3 1.3-3.6 3.6-.3-2.3-1.3-3.3-3.6-3.6 2.3-.3 3.3-1.3 3.6-3.6Z');
      break;
    case 'heart':
    case 'star':
      // Filled shapes are handled below.
      break;
  }
}

export function createIcon(name: IconName, className = 'icon'): SVGSVGElement {
  const svg = svgEl('svg', {
    viewBox: '0 0 24 24',
    class: className,
    'aria-hidden': 'true',
    focusable: 'false',
  });

  switch (name) {
    case 'heart':
      svg.append(
        svgEl('path', {
          d: 'M12 20.4S3.7 15.2 3.7 9.2A4.8 4.8 0 0 1 12 5.7a4.8 4.8 0 0 1 8.3 3.5c0 6-8.3 11.2-8.3 11.2Z',
          fill: 'currentColor',
        }),
      );
      break;
    case 'star':
      svg.append(
        svgEl('path', {
          d: 'M12 2.6l2.83 5.73 6.32.92-4.57 4.46 1.08 6.3L12 16.94 6.34 20.01l1.08-6.3L2.85 9.25l6.32-.92L12 2.6Z',
          fill: 'currentColor',
        }),
      );
      break;
    default:
      lineIcon(name, svg);
      break;
  }

  return svg;
}
