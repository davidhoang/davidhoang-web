import { describe, expect, it } from 'vitest';
import type { ThemeData } from '../src/components/generative-ui/ThemeSpecRenderer';
import {
  buildCompareShareUrl,
  buildThemeShareUrl,
  filterThemes,
  matchesThemeFilter,
  matchesThemeSearch,
  paletteToCss,
  parseThemeUrlState,
  sortThemes,
  themeMetaSummary,
} from '../src/utils/themeExplorer';

const sampleTheme: ThemeData = {
  name: 'Light Blade',
  date: '2026-06-15',
  description: 'Concrete brutalism meets golden light',
  colors: {
    colorScheme: 'split-complementary',
    contrastMode: 'high',
    light: {
      '--color-text': '#2D2A26',
      '--color-bg': '#F5F3F0',
      '--color-link': '#7F6921',
    },
  },
  fonts: {
    heading: { name: 'Fraunces', category: 'serif', stack: "'Fraunces', serif" },
    body: { name: 'Inter', category: 'sans-serif', stack: "'Inter', sans-serif" },
  },
  cards: { style: 'flat' },
  layout: { gridStyle: 'asymmetric' },
  hero: { layout: 'editorial' },
  links: { style: 'bracket' },
  background: { texture: 'grain' },
  footer: { style: 'brutalist' },
  shader: { type: 'grain', colors: ['#D4AF37'] },
};

describe('themeExplorer filters', () => {
  it('matches font category filters', () => {
    expect(matchesThemeFilter(sampleTheme, 'serif')).toBe(true);
    expect(matchesThemeFilter(sampleTheme, 'display')).toBe(false);
  });

  it('matches card and contrast filters', () => {
    expect(matchesThemeFilter(sampleTheme, 'flat')).toBe(true);
    expect(matchesThemeFilter(sampleTheme, 'elevated')).toBe(false);
    expect(matchesThemeFilter(sampleTheme, 'high-contrast')).toBe(true);
  });

  it('matches shader and hero filters', () => {
    expect(matchesThemeFilter(sampleTheme, 'shader')).toBe(true);
    expect(matchesThemeFilter(sampleTheme, 'editorial')).toBe(true);
    expect(matchesThemeFilter({ ...sampleTheme, shader: { type: 'none' } }, 'shader')).toBe(false);
  });

  it('searches across name, description, and attributes', () => {
    expect(matchesThemeSearch(sampleTheme, 'brutalism')).toBe(true);
    expect(matchesThemeSearch(sampleTheme, 'fraunces')).toBe(true);
    expect(matchesThemeSearch(sampleTheme, 'editorial')).toBe(true);
    expect(matchesThemeSearch(sampleTheme, 'nonexistent')).toBe(false);
  });

  it('sorts themes by date and name', () => {
    const older = { ...sampleTheme, date: '2026-06-10', name: 'Beta' };
    const newer = { ...sampleTheme, date: '2026-06-20', name: 'Alpha' };
    expect(sortThemes([older, newer], 'newest').map((t) => t.date)).toEqual(['2026-06-20', '2026-06-10']);
    expect(sortThemes([older, newer], 'oldest').map((t) => t.date)).toEqual(['2026-06-10', '2026-06-20']);
    expect(sortThemes([older, newer], 'name').map((t) => t.name)).toEqual(['Alpha', 'Beta']);
  });

  it('combines filter, search, and sort', () => {
    const other = {
      ...sampleTheme,
      date: '2026-06-14',
      name: 'Night Market',
      description: 'Neon alleyways',
      hero: { layout: 'scattered' },
    };
    const results = filterThemes([sampleTheme, other], {
      filter: 'editorial',
      search: 'brutalism',
      sort: 'newest',
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe('Light Blade');
  });
});

describe('themeExplorer sharing helpers', () => {
  it('builds share URLs', () => {
    expect(buildThemeShareUrl('2026-06-15', 'https://www.davidhoang.com')).toBe(
      'https://www.davidhoang.com/daily-themes?theme=2026-06-15',
    );
    expect(buildCompareShareUrl(['2026-06-15', '2026-06-14'], 'https://www.davidhoang.com')).toBe(
      'https://www.davidhoang.com/daily-themes?compare=2026-06-15%2C2026-06-14',
    );
  });

  it('parses URL state', () => {
    expect(parseThemeUrlState('?theme=2026-06-15&compare=2026-06-14,2026-06-13')).toEqual({
      theme: '2026-06-15',
      compare: ['2026-06-14', '2026-06-13'],
    });
  });

  it('exports palette CSS and meta summary', () => {
    const css = paletteToCss(sampleTheme);
    expect(css).toContain('--color-bg: #F5F3F0;');
    expect(css).toContain('--font-heading:');

    expect(themeMetaSummary(sampleTheme)).toEqual([
      { label: 'Grid', value: 'asymmetric' },
      { label: 'Hero', value: 'editorial' },
      { label: 'Links', value: 'bracket' },
      { label: 'Shader', value: 'grain' },
      { label: 'Cards', value: 'flat' },
      { label: 'Scheme', value: 'split-complementary' },
    ]);
  });
});
