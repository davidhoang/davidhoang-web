import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  validateThemeContrast,
} from '../../scripts/lib/contrast.mjs';

describe('contrastRatio', () => {
  it('returns 21 for black vs white (WCAG max)', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });

  it('returns 1 for identical colors', () => {
    expect(contrastRatio('#123456', '#123456')).toBeCloseTo(1, 5);
  });

  it('is symmetric in argument order', () => {
    const a = contrastRatio('#222222', '#dddddd');
    const b = contrastRatio('#dddddd', '#222222');
    expect(a).toBeCloseTo(b, 10);
  });
});

describe('validateThemeContrast', () => {
  it('reports no fixes when contrast is already sufficient', () => {
    const theme = {
      colors: {
        light: {
          '--color-bg': '#ffffff',
          '--color-card-bg': '#ffffff',
          '--color-nav-bg': '#ffffff',
          '--color-text': '#111111',
          '--color-link': '#1a2a6c',
          '--color-muted': '#555555',
          '--color-nav-text': '#111111',
        },
      },
    };
    expect(validateThemeContrast(theme)).toEqual([]);
    // Original colors should be untouched
    expect(theme.colors.light['--color-text']).toBe('#111111');
  });

  it('repairs a low-contrast text/background pair and records the fix', () => {
    const theme = {
      colors: {
        light: {
          '--color-bg': '#ffffff',
          '--color-card-bg': '#ffffff',
          '--color-nav-bg': '#ffffff',
          '--color-text': '#cccccc', // very low contrast on white
          '--color-link': '#222222',
          '--color-muted': '#555555',
          '--color-nav-text': '#111111',
        },
      },
    };
    const fixes = validateThemeContrast(theme);
    expect(fixes.length).toBeGreaterThan(0);
    const textFix = fixes.find((f) => f.pair === 'body text on background');
    expect(textFix).toBeDefined();
    // Fixed ratio should now clear the 4.5 threshold.
    expect(parseFloat(textFix.fixedRatio)).toBeGreaterThanOrEqual(4.5);
    // Color in the theme is mutated to the fixed value.
    expect(theme.colors.light['--color-text']).toBe(textFix.fixed);
  });

  it('processes both light and dark palettes independently', () => {
    const theme = {
      colors: {
        light: {
          '--color-bg': '#ffffff',
          '--color-card-bg': '#ffffff',
          '--color-nav-bg': '#ffffff',
          '--color-text': '#111111',
          '--color-link': '#1a2a6c',
          '--color-muted': '#555555',
          '--color-nav-text': '#111111',
        },
        dark: {
          '--color-bg': '#000000',
          '--color-card-bg': '#000000',
          '--color-nav-bg': '#000000',
          '--color-text': '#333333', // too dark on black
          '--color-link': '#eeeeee',
          '--color-muted': '#888888',
          '--color-nav-text': '#ffffff',
        },
      },
    };
    const fixes = validateThemeContrast(theme);
    const modes = new Set(fixes.map((f) => f.mode));
    expect(modes.has('dark')).toBe(true);
  });
});
