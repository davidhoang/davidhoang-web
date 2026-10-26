import { describe, expect, it } from 'vitest';
import {
  narrowGoogleFontStylesheetUrl,
  themeFontStylesheetUrl,
  themeFontWeightsForRole,
} from '../src/utils/theme-font-stylesheet';

describe('themeFontStylesheet (PCD-143)', () => {
  it('collects heading and body UI weights for each role', () => {
    const typography = { headingWeight: '900', bodyWeight: '400' };
    expect(themeFontWeightsForRole('heading', typography)).toEqual([700, 900]);
    expect(themeFontWeightsForRole('body', typography)).toEqual([400, 500, 600, 700]);
  });

  function familyParam(url: string): string {
    const raw = new URL(url).searchParams.get('family') ?? '';
    // URLSearchParams decodes "+" to space in family names.
    return raw.replace(/ /g, '+');
  }

  it('narrows discrete Google Fonts weight lists', () => {
    const url =
      'https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@400;500;600;700;800;900&display=swap';
    expect(familyParam(narrowGoogleFontStylesheetUrl(url, [700, 900]))).toBe(
      'Bodoni+Moda:wght@700;900',
    );
  });

  it('narrows Work Sans catalog URLs used by daily themes', () => {
    const url =
      'https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700;800;900&display=swap';
    expect(familyParam(narrowGoogleFontStylesheetUrl(url, [400, 500, 600, 700]))).toBe(
      'Work+Sans:wght@400;500;600;700',
    );
  });

  it('compresses variable wght ranges to the needed span', () => {
    const url = 'https://fonts.googleapis.com/css2?family=Syne:wght@400..800&display=swap';
    expect(familyParam(narrowGoogleFontStylesheetUrl(url, [700, 800]))).toBe('Syne:wght@700..800');
  });

  it('leaves non-Google URLs untouched', () => {
    const local = '/fonts/custom.css';
    expect(narrowGoogleFontStylesheetUrl(local, [400])).toBe(local);
  });

  it('builds role-aware stylesheet URLs from theme font records', () => {
    const font = {
      url: 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700;800;900&display=swap',
    };
    const narrowed = themeFontStylesheetUrl(font, 'body', {
      bodyWeight: '400',
      headingWeight: '900',
    });
    expect(familyParam(narrowed!)).toBe('Work+Sans:wght@400;500;600;700');
  });
});
