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
  const light = {
    '--color-bg': options.bg,
    '--color-text': '#222222',
    '--color-link': '#3355AA',
    '--color-card-bg': options.bg,
    '--color-border': '#CCCCCC',
    '--color-muted': '#666666',
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
      },
    },
    fonts: { heading: { name: `${name} Display` }, body: { name: `${name} Text` } },
  };
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
