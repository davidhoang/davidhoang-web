import { describe, expect, it } from 'vitest';
import {
  attractorPenalty,
  colorPaletteDistance,
  hexToHsl,
  hslDistance,
  isLavenderWash,
  isWarmCream,
  nearestColorDistance,
} from '../scripts/lib/theme-color-distance.mjs';

describe('hexToHsl', () => {
  it('parses warm cream paper colors into a high-lightness warm hue', () => {
    const hsl = hexToHsl('#F5F3F0');
    expect(hsl).not.toBeNull();
    expect(isWarmCream(hsl!)).toBe(true);
  });

  it('detects lavender wash backgrounds', () => {
    const hsl = hexToHsl('#F8F5FF');
    expect(isLavenderWash(hsl!)).toBe(true);
  });
});

describe('hslDistance / colorPaletteDistance', () => {
  it('returns near-zero for cream clones and higher for vivid contrast', () => {
    expect(hslDistance(hexToHsl('#F5F3F0')!, hexToHsl('#F5F1ED')!)).toBeLessThan(0.05);

    const cream = palette('#F5F3F0', '#2D2A26', '#7F6921');
    const twin = palette('#F5F2EE', '#2A2824', '#7A6520');
    const neon = palette('#0B1020', '#F5F7FF', '#FF3D81');

    expect(colorPaletteDistance(cream, twin)).toBeLessThan(0.08);
    expect(colorPaletteDistance(cream, neon)).toBeGreaterThan(0.25);
  });

  it('reports nearest distance against recent history', () => {
    const cream = palette('#F5F3F0', '#2D2A26', '#7F6921');
    const neon = palette('#0B1020', '#F5F7FF', '#FF3D81');
    expect(nearestColorDistance(cream, [cream, neon])).toBeLessThan(0.01);
    expect(nearestColorDistance(neon, [cream])).toBeGreaterThan(0.25);
  });
});

describe('attractorPenalty', () => {
  it('penalizes high-contrast warm cream paper', () => {
    const theme = {
      colors: {
        contrastMode: 'high',
        light: { '--color-bg': '#F5F3F0' },
      },
    };
    expect(attractorPenalty(theme)).toBeGreaterThan(0.7);
  });

  it('is near-zero for a cool dark background', () => {
    const theme = {
      colors: {
        contrastMode: 'standard',
        light: { '--color-bg': '#0B1020' },
      },
    };
    expect(attractorPenalty(theme)).toBe(0);
  });
});

function palette(bg: string, text: string, link: string) {
  const colors = {
    '--color-bg': bg,
    '--color-text': text,
    '--color-link': link,
    '--color-card-bg': bg,
    '--color-border': text,
    '--color-muted': text,
  };
  return {
    colors: {
      contrastMode: 'standard',
      light: colors,
      dark: {
        '--color-bg': '#111111',
        '--color-text': '#EEEEEE',
        '--color-link': link,
        '--color-card-bg': '#1A1A1A',
        '--color-border': '#333333',
        '--color-muted': '#AAAAAA',
      },
    },
  };
}
