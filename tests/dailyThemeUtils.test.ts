import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import dailyThemes from '../src/data/daily-themes.json';
import {
  buildThemeApply,
  clampMinContentPadding,
} from '../src/utils/dailyThemeApply';
import { resolveDailyTheme } from '../src/utils/dailyThemes';
import {
  createClaudeApiUnavailableError,
  loadDailyThemesData,
  loadLastGoodTheme,
  resolveLastGoodFallback,
  reuseLastGoodTheme,
} from '../scripts/lib/theme-api-fallback.mjs';

describe('resolveDailyTheme', () => {
  it('returns the theme for an exact date', () => {
    const theme = resolveDailyTheme(dailyThemes.themes, '2026-10-23');
    expect(theme?.date).toBe('2026-10-23');
    expect(theme?.name).toBeTruthy();
  });

  it('falls back to the first theme when the date is missing', () => {
    const theme = resolveDailyTheme(dailyThemes.themes, '2099-01-01');
    expect(theme?.date).toBe(dailyThemes.themes[0]?.date);
  });

  it('is deterministic for a given date', () => {
    const first = resolveDailyTheme(dailyThemes.themes, dailyThemes.currentDate);
    const second = resolveDailyTheme(dailyThemes.themes, dailyThemes.currentDate);
    expect(second?.date).toBe(first?.date);
    expect(second?.name).toBe(first?.name);
  });
});

describe('buildThemeApply', () => {
  it('emits well-formed CSS custom properties and data attributes', () => {
    const theme = dailyThemes.themes[0];
    const applied = buildThemeApply(theme);

    for (const [key, value] of Object.entries(applied.lightColors)) {
      expect(key.startsWith('--')).toBe(true);
      expect(value).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }

    expect(applied.styles['--font-heading']).toBe(theme.fonts.heading.stack);
    expect(applied.styles['--font-body']).toBe(theme.fonts.body.stack);
    expect(applied.attrs['data-daily-theme']).toBe(theme.date);
    expect(applied.attrs['data-shader']).toBeTruthy();
  });

  it('clamps sub-minimum content padding to 1rem', () => {
    expect(clampMinContentPadding('0.5rem')).toBe('1rem');
    expect(clampMinContentPadding('8px')).toBe('1rem');
    expect(clampMinContentPadding('1.5rem')).toBe('1.5rem');
  });
});

describe('daily theme data + last-good fallback', () => {
  it('loads daily-themes.json with a currentDate present in themes', () => {
    const data = loadDailyThemesData(process.cwd());
    expect(data.themes.length).toBeGreaterThan(0);
    expect(data.currentDate).toBeTruthy();
    expect(data.themes.some((theme) => theme.date === data.currentDate)).toBe(true);
  });

  it('reuses last-good theme data when Claude is unavailable', () => {
    const lastGood = loadLastGoodTheme(process.cwd());
    expect(lastGood).toBeTruthy();

    const outcome = resolveLastGoodFallback({
      error: createClaudeApiUnavailableError('upstream outage'),
      today: '2099-12-31',
      lastGood,
    });
    expect(outcome.action).toBe('reuse');
    expect(outcome.theme?.date).toBe('2099-12-31');
    expect(reuseLastGoodTheme(lastGood!, { date: '2099-12-31' })._fallback?.reused).toBe(true);
  });

  it('reads last-good-theme.json when present', () => {
    const lastGoodPath = join(process.cwd(), 'src/data/last-good-theme.json');
    if (!readFileSync(lastGoodPath, 'utf8')) return;
    const theme = loadLastGoodTheme(process.cwd());
    if (theme) {
      expect(theme.colors?.light).toBeTruthy();
      expect(theme.colors?.dark).toBeTruthy();
    }
  });
});
