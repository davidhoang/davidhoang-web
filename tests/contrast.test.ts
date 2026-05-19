import { describe, it, expect } from 'vitest';
import { contrastRatio, validateThemeContrast } from '../scripts/lib/contrast.mjs';

describe('contrastRatio', () => {
  it('returns 21:1 for black vs white', () => {
    // Known WCAG max
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });

  it('returns 1:1 for identical colors', () => {
    expect(contrastRatio('#888888', '#888888')).toBeCloseTo(1, 5);
  });

  it('is symmetric (order does not matter)', () => {
    const a = contrastRatio('#123456', '#fedcba');
    const b = contrastRatio('#fedcba', '#123456');
    expect(a).toBeCloseTo(b, 6);
  });

  it('matches a known mid-tone value (~4.48 for #777 on white)', () => {
    expect(contrastRatio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 1);
  });
});

describe('validateThemeContrast', () => {
  const REQUIRED = [
    '--color-bg',
    '--color-card-bg',
    '--color-nav-bg',
    '--color-text',
    '--color-link',
    '--color-muted',
    '--color-nav-text',
  ];

  const makeColors = (overrides: Record<string, string> = {}) => {
    const base: Record<string, string> = {};
    for (const v of REQUIRED) base[v] = '#FFFFFF';
    base['--color-text'] = '#222222';
    base['--color-link'] = '#0066CC';
    base['--color-muted'] = '#555555';
    base['--color-nav-text'] = '#222222';
    return { ...base, ...overrides };
  };

  it('leaves an already-compliant theme unchanged', () => {
    const theme = {
      colors: {
        light: makeColors(),
        dark: makeColors({
          '--color-bg': '#111111',
          '--color-card-bg': '#1a1a1a',
          '--color-nav-bg': '#111111',
          '--color-text': '#EEEEEE',
          '--color-link': '#88CCFF',
          '--color-muted': '#BBBBBB',
          '--color-nav-text': '#EEEEEE',
        }),
      },
    };
    const fixes = validateThemeContrast(theme);
    expect(fixes).toEqual([]);
  });

  it('fixes low-contrast text and reports a fix', () => {
    const theme = {
      colors: {
        light: makeColors({ '--color-text': '#CCCCCC' }), // way too light on white
      },
    };
    const fixes = validateThemeContrast(theme);
    expect(fixes.length).toBeGreaterThan(0);
    const textFix = fixes.find((f: any) => f.pair === 'body text on background');
    expect(textFix).toBeDefined();
    expect(Number(textFix!.fixedRatio)).toBeGreaterThanOrEqual(4.5);
    // Theme was mutated with the corrected color
    expect(theme.colors.light['--color-text']).toBe(textFix!.fixed);
  });

  it('validates light and dark modes independently', () => {
    const theme = {
      colors: {
        light: makeColors(),
        dark: makeColors({
          '--color-bg': '#111111',
          '--color-card-bg': '#1a1a1a',
          '--color-nav-bg': '#111111',
          '--color-text': '#333333', // too dark on near-black
          '--color-link': '#88CCFF',
          '--color-muted': '#BBBBBB',
          '--color-nav-text': '#EEEEEE',
        }),
      },
    };
    const fixes = validateThemeContrast(theme);
    expect(fixes.every((f: any) => f.mode === 'dark')).toBe(true);
  });

  it('is a no-op when colors block is missing', () => {
    expect(validateThemeContrast({})).toEqual([]);
    expect(validateThemeContrast({ colors: {} })).toEqual([]);
  });
});
