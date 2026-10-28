import type { RibbonColor } from '../../engine/types';

export interface RibbonPaint {
  readonly name: string;
  readonly light: string;
  readonly base: string;
  readonly dark: string;
  readonly edge: string;
}

/**
 * SVG artwork palette. Kept here so every gradient stop is reviewable in one
 * place; UI chrome uses the CSS tokens instead.
 */
export const RIBBON_PAINT: Readonly<Record<RibbonColor, RibbonPaint>> = {
  rose: {
    name: 'rose',
    light: '#ffe2ed',
    base: '#ff9fc4',
    dark: '#c85f8e',
    edge: '#5d2140',
  },
  peach: {
    name: 'peach',
    light: '#ffeadb',
    base: '#ffc09f',
    dark: '#d1845f',
    edge: '#6b3a26',
  },
  mint: {
    name: 'mint',
    light: '#dcfff1',
    base: '#9ff0cf',
    dark: '#5fb99a',
    edge: '#245948',
  },
  sky: {
    name: 'sky',
    light: '#e1f5ff',
    base: '#9fd8ff',
    dark: '#619fcf',
    edge: '#244c66',
  },
  lilac: {
    name: 'lilac',
    light: '#f1e5ff',
    base: '#c8a7ff',
    dark: '#8a63c9',
    edge: '#412a68',
  },
  butter: {
    name: 'butter',
    light: '#fff7dc',
    base: '#ffe29f',
    dark: '#c9a34f',
    edge: '#66501c',
  },
  coral: {
    name: 'coral',
    light: '#ffe3df',
    base: '#ff9a8b',
    dark: '#c65f55',
    edge: '#672824',
  },
  aqua: {
    name: 'aqua',
    light: '#dcfffb',
    base: '#8ff0e0',
    dark: '#4fb5a6',
    edge: '#1d574f',
  },
};

export function ribbonColourName(colour: RibbonColor): string {
  return RIBBON_PAINT[colour].name;
}
