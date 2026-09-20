import { describe, expect, it } from 'vitest';
import { CARD_SHADOW_OPTIONS, validateGeneratedTheme } from '../scripts/lib/theme-validation.mjs';

import { validGeneratedTheme as validTheme } from './fixtures/generated-theme';

describe('validateGeneratedTheme', () => {
  it('accepts a complete bounded theme', () => {
    expect(validateGeneratedTheme(validTheme)).toMatchObject({
      name: 'Schema Test',
      layout: { gridStyle: 'magazine' },
    });
  });

  it.each(CARD_SHADOW_OPTIONS)('accepts the allowed card shadow %s', (shadow) => {
    const theme = structuredClone(validTheme);
    theme.cards.shadow = shadow;
    expect(validateGeneratedTheme(theme).cards.shadow).toBe(shadow);
  });

  it.each([
    ' 0  2px 8px rgba(0, 0, 0, 0.08) ',
    '0\t2px\n8px rgba( 0 , 0 , 0 , 0.08 )',
  ])('canonicalizes harmless CSS spacing in %s', (shadow) => {
    const theme = structuredClone(validTheme);
    theme.cards.shadow = shadow;
    expect(validateGeneratedTheme(theme).cards.shadow).toBe('0 2px 8px rgba(0,0,0,0.08)');
    expect(theme.cards.shadow).toBe(shadow);
  });

  it.each([
    '0 8px 32px rgba(26,16,53,0.18)',
    '0 2px 8px rgba(0,0,0,0.08); color: red',
    'var(--custom-shadow)',
    'n one',
    null,
    0,
  ])('rejects unsupported card shadows: %s', (shadow) => {
    const theme = structuredClone(validTheme);
    theme.cards.shadow = shadow;
    expect(() => validateGeneratedTheme(theme)).toThrow('cards.shadow');
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
