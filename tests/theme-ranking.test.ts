import { describe, expect, it } from 'vitest';
import {
  rankThemeCandidates,
  recentThemeId,
  visualSignatureDistance,
} from '../scripts/lib/theme-ranking.mjs';

describe('visualSignatureDistance', () => {
  it('returns zero for identical signatures and a normalized distance otherwise', () => {
    expect(visualSignatureDistance([0, 128, 255], [0, 128, 255])).toBe(0);
    expect(visualSignatureDistance([0, 0], [255, 255])).toBe(1);
  });
});

describe('rankThemeCandidates', () => {
  const recent = theme('Recent', 'editorial', 'asymmetric', {
    bg: '#F5F3F0',
    contrastMode: 'high',
  });
  const safe = theme('Safe', 'rolodex', 'sidebar', {
    bg: '#0B1020',
    contrastMode: 'standard',
  });
  const unsafe = theme('Unsafe', 'cinematic', 'split', {
    bg: '#101820',
    contrastMode: 'standard',
  });
  const creamClone = theme('Cream Twin', 'scattered', 'magazine', {
    bg: '#F5F1ED',
    contrastMode: 'high',
  });
  const viewports = [{ name: 'mobile' }, { name: 'desktop' }, { name: 'wide' }];

  it('rejects a visually novel candidate when render safety fails', () => {
    const report = {
      viewports,
      results: {
        'candidate-safe': rendered([220, 220], []),
        'candidate-unsafe': rendered([255, 255], ['horizontal-overflow:20px']),
        [recentThemeId(recent, 0)]: rendered([0, 0], []),
      },
    };

    const result = rankThemeCandidates([
      { id: 'candidate-safe', theme: safe },
      { id: 'candidate-unsafe', theme: unsafe },
    ], [recent], report);

    expect(result.winner.id).toBe('candidate-safe');
    expect(result.ranked[1].issues).toContain('horizontal-overflow:20px');
  });

  it('always ranks a safe candidate ahead of an unsafe score tie', () => {
    const report = {
      viewports,
      results: {
        'candidate-a-unsafe': rendered([255, 255], ['horizontal-overflow:20px']),
        'candidate-z-safe': rendered([0, 0], []),
        [recentThemeId(recent, 0)]: rendered([0, 0], []),
      },
    };

    const result = rankThemeCandidates([
      {
        id: 'candidate-a-unsafe',
        theme: unsafe,
        assessment: { score: 0, changesFromYesterday: 8 },
      },
      {
        id: 'candidate-z-safe',
        theme: safe,
        assessment: { score: 1, changesFromYesterday: 0 },
      },
    ], [recent], report);

    expect(result.winner.id).toBe('candidate-z-safe');
  });

  it('ranks contrast-failing candidates behind contrast-safe ones', () => {
    const contrastSafe = theme('Contrast Safe', 'editorial', 'magazine', {
      bg: '#FFFFFF',
      contrastMode: 'standard',
    });
    contrastSafe.colors.light['--color-nav-bg'] = '#FFFFFF';
    contrastSafe.colors.light['--color-nav-text'] = '#222222';
    contrastSafe.colors.dark['--color-nav-bg'] = '#111111';
    contrastSafe.colors.dark['--color-nav-text'] = '#EEEEEE';

    const contrastFail = theme('Contrast Fail', 'cinematic', 'split', {
      bg: '#FFFFFF',
      contrastMode: 'low',
    });
    contrastFail.colors.light['--color-text'] = '#DDDDDD';
    contrastFail.colors.light['--color-link'] = '#EEEEEE';
    contrastFail.colors.light['--color-muted'] = '#F0F0F0';
    contrastFail.colors.light['--color-nav-bg'] = '#FFFFFF';
    contrastFail.colors.light['--color-nav-text'] = '#EEEEEE';

    const result = rankThemeCandidates([
      {
        id: 'candidate-contrast-fail',
        theme: contrastFail,
        assessment: { score: 0, changesFromYesterday: 8 },
      },
      {
        id: 'candidate-contrast-safe',
        theme: contrastSafe,
        assessment: { score: 1, changesFromYesterday: 0 },
      },
    ], [recent], null);

    expect(result.winner.id).toBe('candidate-contrast-safe');
    expect(
      result.ranked.find((c) => c.id === 'candidate-contrast-fail')?.issues
        .some((issue) => issue.startsWith('contrast:')),
    ).toBe(true);
  });

  it('prefers a distinct palette over a warm-cream attractor clone when both are safe', () => {
    const report = {
      viewports,
      results: {
        'candidate-cream': rendered([40, 40], []),
        'candidate-bold': rendered([40, 40], []),
        [recentThemeId(recent, 0)]: rendered([0, 0], []),
      },
    };

    const result = rankThemeCandidates([
      {
        id: 'candidate-cream',
        theme: creamClone,
        assessment: { score: 0.4, changesFromYesterday: 4 },
      },
      {
        id: 'candidate-bold',
        theme: safe,
        assessment: { score: 0.4, changesFromYesterday: 4 },
      },
    ], [recent], report);

    expect(result.winner.id).toBe('candidate-bold');
    expect(result.ranked.find((c) => c.id === 'candidate-cream')?.attractorPenalty).toBeGreaterThan(0.5);
    expect(result.ranked.find((c) => c.id === 'candidate-bold')?.colorDistance).toBeGreaterThan(
      result.ranked.find((c) => c.id === 'candidate-cream')!.colorDistance,
    );
  });
});

function theme(
  name: string,
  hero: string,
  grid: string,
  options: { bg: string; contrastMode: string } = { bg: '#FFFFFF', contrastMode: 'standard' },
) {
  // Keep ranking fixtures WCAG-safe so contrast gating only fires when tests opt into failures.
  const isLightBg = relativeLuminance(options.bg) > 0.5;
  const light = {
    '--color-bg': options.bg,
    '--color-text': isLightBg ? '#222222' : '#F2F2F2',
    '--color-link': isLightBg ? '#3355AA' : '#88AAFF',
    '--color-card-bg': options.bg,
    '--color-border': isLightBg ? '#CCCCCC' : '#333333',
    '--color-muted': isLightBg ? '#555555' : '#BBBBBB',
    '--color-nav-bg': options.bg,
    '--color-nav-text': isLightBg ? '#222222' : '#F2F2F2',
  };
  return {
    name,
    hero: { layout: hero },
    layout: { gridStyle: grid },
    cards: { style: 'filled' },
    links: { style: 'highlight' },
    footer: { style: 'boxed' },
    shader: { type: 'none' },
    background: { texture: 'none' },
    images: { style: 'vivid', hover: 'zoom' },
    colors: {
      colorScheme: 'triadic',
      contrastMode: options.contrastMode,
      light,
      dark: {
        '--color-bg': '#111111',
        '--color-text': '#EEEEEE',
        '--color-link': '#88AAFF',
        '--color-card-bg': '#1A1A1A',
        '--color-border': '#333333',
        '--color-muted': '#AAAAAA',
        '--color-nav-bg': '#111111',
        '--color-nav-text': '#EEEEEE',
      },
    },
    fonts: { heading: { name: `${name} Display` }, body: { name: `${name} Text` } },
  };
}

function relativeLuminance(hex: string) {
  const cleaned = hex.replace('#', '');
  const channels = [0, 2, 4].map((offset) => {
    const value = Number.parseInt(cleaned.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function rendered(signature: number[], issues: string[]) {
  return {
    viewports: {
      mobile: { signature, metrics: { issues } },
      desktop: { signature, metrics: { issues: [] } },
      wide: { signature, metrics: { issues: [] } },
    },
  };
}
