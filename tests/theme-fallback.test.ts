import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  allCandidatesFailedFromApi,
  buildFallbackTheme,
  ClaudeApiUnavailableError,
  isClaudeApiError,
  LAST_GOOD_THEME_CACHE_VERSION,
  loadLastGoodTheme,
  resolveLastGoodFallback,
  saveLastGoodTheme,
} from '../scripts/lib/theme-fallback.mjs';

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

function sampleTheme(date: string, name = 'Sample Theme') {
  return {
    name,
    description: 'A sample theme',
    date,
    colors: {
      light: { '--color-bg': '#ffffff', '--color-text': '#111111' },
      dark: { '--color-bg': '#111111', '--color-text': '#ffffff' },
    },
    fonts: {
      heading: { name: 'Lora' },
      body: { name: 'Inter' },
    },
    _contextImage: 'mood.jpg',
    _contextMarkdown: 'note.md',
  };
}

describe('isClaudeApiError', () => {
  it('detects typed Claude API unavailable errors', () => {
    expect(isClaudeApiError(new ClaudeApiUnavailableError('down'))).toBe(true);
  });

  it('detects Anthropic-style status and connection failures', () => {
    expect(isClaudeApiError({ status: 529, message: 'Overloaded' })).toBe(true);
    expect(isClaudeApiError({ status: 429, message: 'rate limited' })).toBe(true);
    expect(isClaudeApiError({ name: 'APIConnectionError', message: 'fetch failed' })).toBe(true);
    expect(isClaudeApiError(new Error('ANTHROPIC_API_KEY environment variable is required'))).toBe(
      true,
    );
  });

  it('does not treat schema/contrast failures as API outages', () => {
    expect(
      isClaudeApiError(
        new Error('Theme candidate was not valid JSON after retry: Unexpected token'),
      ),
    ).toBe(false);
    expect(
      isClaudeApiError(
        new Error('All theme candidates failed validation or WCAG AA contrast checks.'),
      ),
    ).toBe(false);
  });

  it('walks error.cause', () => {
    const nested = new Error('wrapper');
    (nested as Error & { cause: Error }).cause = new ClaudeApiUnavailableError('down');
    expect(isClaudeApiError(nested)).toBe(true);
  });
});

describe('allCandidatesFailedFromApi', () => {
  it('requires every candidate failure to be API-related', () => {
    expect(
      allCandidatesFailedFromApi([
        { error: new ClaudeApiUnavailableError('a') },
        { error: new ClaudeApiUnavailableError('b') },
      ]),
    ).toBe(true);

    expect(
      allCandidatesFailedFromApi([
        { error: new ClaudeApiUnavailableError('a') },
        { error: new Error('invalid JSON') },
      ]),
    ).toBe(false);
  });
});

describe('last-good theme cache', () => {
  it('round-trips a sanitized theme and strips internal fields', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'theme-fallback-'));
    tempDirs.push(rootDir);

    const theme = sampleTheme('2026-08-08', 'Botanical');
    const saved = saveLastGoodTheme(rootDir, theme, { savedAt: '2026-08-08T12:00:00.000Z' });

    expect(saved.version).toBe(LAST_GOOD_THEME_CACHE_VERSION);
    expect(saved.theme).not.toHaveProperty('_contextImage');
    expect(saved.theme).not.toHaveProperty('_contextMarkdown');
    expect(saved.sourceDate).toBe('2026-08-08');

    const loaded = loadLastGoodTheme(rootDir);
    expect(loaded?.source).toBe('cache');
    expect(loaded?.theme.name).toBe('Botanical');
    expect(loaded?.theme).not.toHaveProperty('_contextImage');

    const raw = JSON.parse(
      readFileSync(join(rootDir, 'src/data/last-good-theme.json'), 'utf-8'),
    );
    expect(raw.savedAt).toBe('2026-08-08T12:00:00.000Z');
  });

  it('falls back to daily-themes.json history when cache is missing', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'theme-fallback-hist-'));
    tempDirs.push(rootDir);
    mkdirSync(join(rootDir, 'src/data'), { recursive: true });
    writeFileSync(
      join(rootDir, 'src/data/daily-themes.json'),
      JSON.stringify({
        currentDate: '2026-08-07',
        themes: [sampleTheme('2026-08-07', 'Arroyo Ledger')],
      }),
    );

    const loaded = loadLastGoodTheme(rootDir);
    expect(loaded?.source).toBe('history');
    expect(loaded?.theme.name).toBe('Arroyo Ledger');
  });

  it('builds a dated fallback theme for today', () => {
    const theme = sampleTheme('2026-08-07', 'Arroyo Ledger');
    const next = buildFallbackTheme(theme, '2026-08-09');
    expect(next.date).toBe('2026-08-09');
    expect(next.name).toBe('Arroyo Ledger');
    expect(next).not.toHaveProperty('_contextImage');
  });

  it('resolveLastGoodFallback returns a reusable today-dated theme', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'theme-fallback-resolve-'));
    tempDirs.push(rootDir);
    saveLastGoodTheme(rootDir, sampleTheme('2026-08-08', 'Botanical'));

    const resolved = resolveLastGoodFallback(rootDir, '2026-08-09');
    expect(resolved?.theme.date).toBe('2026-08-09');
    expect(resolved?.reusedFrom).toBe('Botanical');
    expect(resolved?.source).toBe('cache');
  });
});
