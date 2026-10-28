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
    dark: '#e57ea9',
    edge: '#5d2140',
  },
  peach: {
    name: 'peach',
    light: '#ffeadb',
    base: '#ffc09f',
    dark: '#e89a74',
    edge: '#6b3a26',
  },
  mint: {
    name: 'mint',
    light: '#dcfff1',
    base: '#9ff0cf',
    dark: '#7fd6b2',
    edge: '#245948',
  },
  sky: {
    name: 'sky',
    light: '#e1f5ff',
    base: '#9fd8ff',
    dark: '#7fc0e8',
    edge: '#244c66',
  },
  lilac: {
    name: 'lilac',
    light: '#f1e5ff',
    base: '#c8a7ff',
    dark: '#a985e0',
    edge: '#412a68',
  },
  butter: {
    name: 'butter',
    light: '#fff7dc',
    base: '#ffe29f',
    dark: '#e0b866',
    edge: '#66501c',
  },
  coral: {
    name: 'coral',
    light: '#ffe3df',
    base: '#ff9a8b',
    dark: '#e07a6f',
    edge: '#672824',
  },
  aqua: {
    name: 'aqua',
    light: '#dcfffb',
    base: '#8ff0e0',
    dark: '#6fd0c0',
    edge: '#1d574f',
  },
};

export function ribbonColourName(colour: RibbonColor): string {
  return RIBBON_PAINT[colour].name;
}
