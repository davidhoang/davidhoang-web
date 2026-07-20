import { describe, expect, it } from 'vitest';
import { validateGeneratedTheme } from '../scripts/lib/theme-validation.mjs';

const palette = {
  '--color-text': '#111111',
  '--color-bg': '#f5f5f5',
  '--color-link': '#0055aa',
  '--color-link-hover': '#003377',
  '--color-border': '#cccccc',
  '--color-muted': '#666666',
  '--color-sidebar-bg': '#eeeeee',
  '--color-nav-bg': '#f5f5f5',
  '--color-nav-text': '#111111',
  '--color-card-bg': '#fafafa',
};

const validTheme: any = {
  name: 'Schema Test',
  description: 'A bounded theme fixture.',
  colors: {
    colorScheme: 'complementary',
    contrastMode: 'standard',
    light: palette,
    dark: { ...palette, '--color-bg': '#111111', '--color-text': '#f5f5f5' },
  },
  fonts: { heading: 'Inter', body: 'Source Serif 4' },
  typography: {
    headingWeight: '700',
    bodyWeight: '400',
    bodyLineHeight: '1.6',
    letterSpacing: '0em',
    headingLetterSpacing: '-0.02em',
    headingTransform: 'none',
    scaleRatio: '1.414',
    fontVariationSettings: 'normal',
  },
  cards: {
    style: 'elevated',
    shadow: '0 2px 8px rgba(0,0,0,0.08)',
    borderWidth: '1px',
    padding: '1.5rem',
  },
  layout: {
    borderRadius: '8px',
    containerMaxWidth: '1100px',
    sectionSpacing: '4rem',
    contentPadding: '1.5rem',
    gridStyle: 'magazine',
  },
  hero: { layout: 'editorial' },
  links: { style: 'underline' },
  background: { texture: 'none' },
  images: { style: 'muted', hover: 'colorize', opacity: '0.9', borderRadius: '8px' },
  footer: { style: 'editorial' },
  shader: { type: 'none', colors: [] },
};

describe('validateGeneratedTheme', () => {
  it('accepts a complete bounded theme', () => {
    expect(validateGeneratedTheme(validTheme)).toMatchObject({
      name: 'Schema Test',
      layout: { gridStyle: 'magazine' },
    });
  });

  it('rejects unknown CSS properties from model output', () => {
    const theme = structuredClone(validTheme);
    theme.colors.light.background = 'url(http://127.0.0.1/private)';

    expect(() => validateGeneratedTheme(theme)).toThrow('Unrecognized key');
  });

  it('rejects non-hex colors and out-of-bounds layout values', () => {
    const theme = structuredClone(validTheme);
    theme.colors.light['--color-bg'] = 'url(http://127.0.0.1/private)';
    theme.layout.sectionSpacing = '999rem';

    expect(() => validateGeneratedTheme(theme)).toThrow('schema validation');
  });

  it('rejects oversized strings and shader arrays', () => {
    const theme = structuredClone(validTheme);
    theme.name = 'x'.repeat(81);
    theme.shader.colors = ['#111111', '#222222', '#333333', '#444444', '#555555'];

    expect(() => validateGeneratedTheme(theme)).toThrow('schema validation');
  });
});
