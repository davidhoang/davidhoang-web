import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getCachedRenderResult,
  loadSignatureCache,
  mergeRenderResultsIntoCache,
  partitionCachedEntries,
  saveSignatureCache,
  themeRenderFingerprint,
  THEME_SIGNATURE_CACHE_VERSION,
} from '../scripts/lib/theme-signature-cache.mjs';

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe('themeRenderFingerprint', () => {
  it('changes when palette or layout fields change', () => {
    const base = sampleTheme('2026-07-01');
    const tweaked = structuredClone(base);
    tweaked.colors.light['--color-bg'] = '#112233';
    expect(themeRenderFingerprint(base)).not.toBe(themeRenderFingerprint(tweaked));
  });
});

describe('signature cache', () => {
  it('round-trips signatures and skips re-render on fingerprint match', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'theme-sig-'));
    tempDirs.push(rootDir);

    const theme = sampleTheme('2026-07-01');
    const cache = loadSignatureCache(rootDir);
    expect(cache.version).toBe(THEME_SIGNATURE_CACHE_VERSION);

    const report = {
      results: {
        'recent-2026-07-01': {
          viewports: {
            mobile: { signature: [1, 2, 3], metrics: { issues: [] } },
            desktop: { signature: [4, 5, 6], metrics: { issues: [] } },
            wide: { signature: [7, 8, 9], metrics: { issues: [] } },
          },
        },
      },
    };

    mergeRenderResultsIntoCache(cache, [{ id: 'recent-2026-07-01', theme }], report);
    saveSignatureCache(rootDir, cache);

    const reloaded = loadSignatureCache(rootDir);
    const hit = getCachedRenderResult(reloaded, theme);
    expect(hit?.viewports.mobile.signature).toEqual([1, 2, 3]);

    const { cachedResults, missing } = partitionCachedEntries(reloaded, [
      { id: 'recent-2026-07-01', theme },
      { id: 'recent-2026-07-02', theme: sampleTheme('2026-07-02') },
    ]);
    expect(Object.keys(cachedResults)).toEqual(['recent-2026-07-01']);
    expect(missing).toHaveLength(1);

    const edited = structuredClone(theme);
    edited.hero.layout = 'cinematic';
    expect(getCachedRenderResult(reloaded, edited)).toBeNull();

    const saved = JSON.parse(readFileSync(join(rootDir, 'src/data/theme-render-signatures.json'), 'utf8'));
    expect(saved.entries['2026-07-01'].fingerprint).toBe(themeRenderFingerprint(theme));
  });
});

function sampleTheme(date: string) {
  return {
    date,
    name: `Theme ${date}`,
    hero: { layout: 'editorial' },
    layout: {
      gridStyle: 'asymmetric',
      borderRadius: '0px',
      containerMaxWidth: '1100px',
      sectionSpacing: '4rem',
      contentPadding: '1.5rem',
    },
    cards: { style: 'flat', shadow: 'none', borderWidth: '1px', padding: '1.5rem' },
    links: { style: 'bracket' },
    footer: { style: 'brutalist' },
    background: { texture: 'grain' },
    images: { style: 'grayscale', hover: 'colorize', opacity: '1', borderRadius: '0px' },
    shader: { type: 'none', colors: [] },
    typography: {
      headingWeight: '700',
      bodyWeight: '400',
      bodyLineHeight: '1.6',
      letterSpacing: '0em',
      headingLetterSpacing: '-0.02em',
      headingTransform: 'none',
      scaleRatio: '1.333',
      fontVariationSettings: 'normal',
    },
    fonts: {
      heading: { name: 'Syne', url: 'https://fonts.googleapis.com/css2?family=Syne' },
      body: { name: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter' },
    },
    colors: {
      contrastMode: 'high',
      light: {
        '--color-bg': '#F5F3F0',
        '--color-text': '#2D2A26',
        '--color-link': '#7F6921',
        '--color-card-bg': '#FAFAF8',
        '--color-border': '#C4BFB8',
        '--color-muted': '#6B6762',
      },
      dark: {
        '--color-bg': '#1C1A17',
        '--color-text': '#E8E4DF',
        '--color-link': '#FFD700',
        '--color-card-bg': '#242118',
        '--color-border': '#3A3630',
        '--color-muted': '#8B8680',
      },
    },
  };
}
