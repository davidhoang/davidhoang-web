import { describe, it, expect } from 'vitest';
import {
  assessDiversity,
  computeSimilarity,
  extractFingerprint,
  formatRecentThemesPromptSection,
  formatDiversityRetrySection,
  DEFAULT_SIMILARITY_THRESHOLD,
} from '../scripts/lib/theme-diversity.mjs';

const editorialTheme = {
  name: 'Light Blade',
  date: '2026-06-15',
  hero: { layout: 'editorial' },
  layout: { gridStyle: 'asymmetric' },
  cards: { style: 'flat' },
  links: { style: 'bracket' },
  footer: { style: 'brutalist' },
  shader: { type: 'grain' },
  background: { texture: 'grain' },
  images: { style: 'grayscale', hover: 'colorize' },
  colors: { colorScheme: 'split-complementary', contrastMode: 'high' },
  fonts: {
    heading: { name: 'Clash Display' },
    body: { name: 'IBM Plex Sans' },
  },
};

const distinctTheme = {
  name: 'Swiss Pool',
  hero: { layout: 'rolodex' },
  layout: { gridStyle: 'magazine' },
  cards: { style: 'elevated' },
  links: { style: 'highlight' },
  footer: { style: 'minimal' },
  shader: { type: 'none' },
  background: { texture: 'dots' },
  images: { style: 'vivid', hover: 'lift' },
  colors: { colorScheme: 'triadic', contrastMode: 'standard' },
  fonts: {
    heading: { name: 'Fraunces' },
    body: { name: 'DM Sans' },
  },
};

describe('computeSimilarity', () => {
  it('returns 1 for identical themes', () => {
    expect(computeSimilarity(editorialTheme, editorialTheme)).toBe(1);
  });

  it('returns a low score for clearly different themes', () => {
    const score = computeSimilarity(editorialTheme, distinctTheme);
    expect(score).toBeLessThan(0.35);
  });

  it('returns a high score when hero, grid, and fonts match', () => {
    const clone = {
      ...distinctTheme,
      hero: { layout: 'editorial' },
      layout: { gridStyle: 'asymmetric' },
      fonts: editorialTheme.fonts,
    };
    expect(computeSimilarity(editorialTheme, clone)).toBeGreaterThan(0.45);
  });
});

describe('extractFingerprint', () => {
  it('captures key categorical fields', () => {
    const fingerprint = extractFingerprint(editorialTheme);
    expect(fingerprint.heroLayout).toBe('editorial');
    expect(fingerprint.gridStyle).toBe('asymmetric');
    expect(fingerprint.headingFont).toBe('Clash Display');
    expect(fingerprint.bodyFont).toBe('IBM Plex Sans');
  });
});

describe('assessDiversity', () => {
  it('passes when there is no recent history', () => {
    const result = assessDiversity(editorialTheme, []);
    expect(result.pass).toBe(true);
  });

  it('fails when a theme is nearly identical to yesterday', () => {
    const result = assessDiversity(editorialTheme, [editorialTheme]);
    expect(result.pass).toBe(false);
    expect(result.score).toBe(1);
    expect(result.changesFromYesterday).toBe(0);
  });

  it('passes for a meaningfully different theme', () => {
    const result = assessDiversity(distinctTheme, [editorialTheme]);
    expect(result.pass).toBe(true);
    expect(result.score).toBeLessThan(DEFAULT_SIMILARITY_THRESHOLD);
    expect(result.changesFromYesterday).toBeGreaterThanOrEqual(3);
  });
});

describe('prompt helpers', () => {
  it('includes recent theme summaries and diversity requirements', () => {
    const section = formatRecentThemesPromptSection([editorialTheme]);
    expect(section).toContain('Light Blade');
    expect(section).toContain('editorial');
    expect(section).toContain('DIVERSITY REQUIREMENTS');
    expect(section).toContain('Clash Display');
  });

  it('formats retry feedback with overlapping fields', () => {
    const assessment = assessDiversity(editorialTheme, [editorialTheme]);
    const section = formatDiversityRetrySection(assessment);
    expect(section).toContain('DIVERSITY RETRY');
    expect(section).toContain('Hero');
  });
});
