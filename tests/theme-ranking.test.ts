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
  const recent = theme('Recent', 'editorial', 'asymmetric');
  const safe = theme('Safe', 'rolodex', 'sidebar');
  const unsafe = theme('Unsafe', 'cinematic', 'split');
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
});

function theme(name: string, hero: string, grid: string) {
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
    colors: { colorScheme: 'triadic', contrastMode: 'high' },
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
