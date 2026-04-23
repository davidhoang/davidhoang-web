import { describe, expect, it } from 'vitest';
import {
  CRITICAL_FONTS,
  FONT_LOADING_STRATEGIES,
  PAGE_FONT_PRIORITIES,
  generateFontPreloadHTML,
  getCriticalFonts,
  getFontLoadingStrategy,
  getThemeFonts,
} from '../../src/utils/font-preload';

describe('getCriticalFonts', () => {
  it('returns home priorities first, then other critical fonts', () => {
    const fonts = getCriticalFonts('home');
    expect(fonts.slice(0, PAGE_FONT_PRIORITIES.home.length)).toEqual(
      PAGE_FONT_PRIORITIES.home,
    );
  });

  it('caps the list at 6 entries', () => {
    expect(getCriticalFonts('home').length).toBeLessThanOrEqual(6);
    expect(getCriticalFonts('blog').length).toBeLessThanOrEqual(6);
  });

  it('defaults to home when called without args', () => {
    expect(getCriticalFonts()).toEqual(getCriticalFonts('home'));
  });
});

describe('generateFontPreloadHTML', () => {
  it('emits one preload link per font', () => {
    const html = generateFontPreloadHTML(['/fonts/a.woff2', '/fonts/b.woff2']);
    expect(html).toContain('href="/fonts/a.woff2"');
    expect(html).toContain('href="/fonts/b.woff2"');
    expect(html.match(/<link/g)?.length).toBe(2);
  });

  it('marks the links as crossorigin font preloads', () => {
    const html = generateFontPreloadHTML(['/fonts/a.woff2']);
    expect(html).toContain('rel="preload"');
    expect(html).toContain('as="font"');
    expect(html).toContain('type="font/woff2"');
    expect(html).toContain('crossorigin');
  });
});

describe('getThemeFonts', () => {
  it('returns the primary brand fonts by default', () => {
    expect(getThemeFonts()).toEqual(CRITICAL_FONTS.primary);
  });

  it('returns a daily-specific list for daily themes', () => {
    const daily = getThemeFonts('daily');
    expect(daily.length).toBeGreaterThan(0);
    expect(daily).not.toEqual(CRITICAL_FONTS.primary);
  });
});

describe('getFontLoadingStrategy', () => {
  it('marks primary fonts as critical', () => {
    expect(getFontLoadingStrategy(CRITICAL_FONTS.primary[0])).toEqual(
      FONT_LOADING_STRATEGIES.critical,
    );
  });

  it('marks self-hosted fonts as theme', () => {
    expect(getFontLoadingStrategy(CRITICAL_FONTS.selfHosted[0])).toEqual(
      FONT_LOADING_STRATEGIES.theme,
    );
  });

  it('falls back to secondary for unknown fonts', () => {
    expect(getFontLoadingStrategy('/fonts/unknown.woff2')).toEqual(
      FONT_LOADING_STRATEGIES.secondary,
    );
  });
});
