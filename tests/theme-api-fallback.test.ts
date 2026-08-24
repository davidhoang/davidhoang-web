import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ANTHROPIC_API_KEY_MISSING_CODE,
  CLAUDE_API_UNAVAILABLE_CODE,
  allErrorsAreClaudeApiUnavailable,
  createClaudeApiUnavailableError,
  isClaudeApiUnavailableError,
  loadLastGoodTheme,
  resolveLastGoodFallback,
  reuseLastGoodTheme,
  saveLastGoodTheme,
  shouldUseLastGoodFallback,
} from '../scripts/lib/theme-api-fallback.mjs';

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

function sampleTheme(date: string) {
  return {
    name: 'Fallback Fixture',
    description: 'A cached theme for API outages.',
    date,
    colors: {
      colorScheme: 'complementary',
      contrastMode: 'standard',
      light: {
        '--color-text': '#111111',
        '--color-bg': '#f5f5f5',
        '--color-link': '#0055aa',
        '--color-link-hover': '#003377',
        '--color-border': '#cccccc',
        '--color-muted': '#666666',
        '--color-sidebar-bg': '#eeeeee',
        '--color-nav-bg': '#f5f5f5',
        '--color-nav-text': '#111111',
        '--color-card-bg': '#fafafa',
      },
      dark: {
        '--color-text': '#f5f5f5',
        '--color-bg': '#111111',
        '--color-link': '#88ccff',
        '--color-link-hover': '#aadfff',
        '--color-border': '#333333',
        '--color-muted': '#999999',
        '--color-sidebar-bg': '#1a1a1a',
        '--color-nav-bg': '#111111',
        '--color-nav-text': '#f5f5f5',
        '--color-card-bg': '#1f1f1f',
      },
    },
    fonts: {
      heading: { name: 'Lora', category: 'serif' },
      body: { name: 'Figtree', category: 'sans-serif' },
    },
    showcase: {
      root: 'card',
      elements: {
        card: {
          type: 'ThemeCard',
          props: { title: 'Fallback Fixture', subtitle: date },
          children: [],
        },
      },
    },
  };
}

describe('isClaudeApiUnavailableError', () => {
  it('detects missing API key and typed unavailable errors', () => {
    expect(
      isClaudeApiUnavailableError(
        createClaudeApiUnavailableError('missing', { code: ANTHROPIC_API_KEY_MISSING_CODE }),
      ),
    ).toBe(true);

    expect(
      isClaudeApiUnavailableError(
        createClaudeApiUnavailableError('down', { code: CLAUDE_API_UNAVAILABLE_CODE }),
      ),
    ).toBe(true);
  });

  it('detects Anthropic SDK-shaped and network failures', () => {
    expect(
      isClaudeApiUnavailableError({ name: 'APIConnectionTimeoutError', message: 'Request timed out.' }),
    ).toBe(true);
    expect(isClaudeApiUnavailableError({ name: 'RateLimitError', status: 429, message: '429' })).toBe(
      true,
    );
    expect(isClaudeApiUnavailableError({ name: 'InternalServerError', status: 529, message: 'overloaded' })).toBe(
      true,
    );
    expect(isClaudeApiUnavailableError({ code: 'ECONNRESET', message: 'socket hang up' })).toBe(true);
    expect(isClaudeApiUnavailableError({ message: 'fetch failed' })).toBe(true);
  });

  it('does not treat local validation failures as API outages', () => {
    expect(
      isClaudeApiUnavailableError(
        new Error('All theme candidates failed validation or WCAG AA contrast checks. No theme was saved.'),
      ),
    ).toBe(false);
    expect(isClaudeApiUnavailableError(new Error('Unrecognized key "background"'))).toBe(false);
  });

  it('treats aggregated candidate API failures as unavailable', () => {
    expect(
      allErrorsAreClaudeApiUnavailable([
        { name: 'APIConnectionError', message: 'Connection error.' },
        { status: 503, message: '503 Service Unavailable' },
      ]),
    ).toBe(true);

    expect(
      allErrorsAreClaudeApiUnavailable([
        { name: 'APIConnectionError', message: 'Connection error.' },
        new Error('schema validation failed'),
      ]),
    ).toBe(false);
  });
});

describe('last-good theme cache', () => {
  it('round-trips the cache and falls back to daily-themes history', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'theme-fallback-'));
    tempDirs.push(rootDir);

    const theme = sampleTheme('2026-08-07');
    saveLastGoodTheme(rootDir, theme);

    const cached = loadLastGoodTheme(rootDir);
    expect(cached?.name).toBe('Fallback Fixture');
    expect(cached?.date).toBe('2026-08-07');

    const otherRoot = mkdtempSync(join(tmpdir(), 'theme-fallback-hist-'));
    tempDirs.push(otherRoot);
    mkdirSync(join(otherRoot, 'src', 'data'), { recursive: true });
    writeFileSync(
      join(otherRoot, 'src', 'data', 'daily-themes.json'),
      JSON.stringify({ currentDate: '2026-08-06', themes: [sampleTheme('2026-08-06')] }, null, 2),
    );

    expect(loadLastGoodTheme(otherRoot)?.date).toBe('2026-08-06');
  });

  it('reuses a prior theme for a new date without mutating the source', () => {
    const source = sampleTheme('2026-08-07');
    const reused = reuseLastGoodTheme(source, {
      date: '2026-08-08',
      reason: '529 overloaded',
    });

    expect(source.date).toBe('2026-08-07');
    expect(reused.date).toBe('2026-08-08');
    expect(reused.name).toBe(source.name);
    expect(reused._fallback).toMatchObject({
      reused: true,
      sourceDate: '2026-08-07',
      reason: '529 overloaded',
    });
    expect(reused.showcase.elements.card.props.subtitle).toBe('2026-08-08');
  });

  it('only enables fallback for API outages when a usable theme exists', () => {
    const theme = sampleTheme('2026-08-07');
    const apiError = createClaudeApiUnavailableError('Claude API unavailable');
    const validationError = new Error('schema validation failed');

    expect(shouldUseLastGoodFallback(apiError, theme)).toBe(true);
    expect(shouldUseLastGoodFallback(validationError, theme)).toBe(false);
    expect(shouldUseLastGoodFallback(apiError, null)).toBe(false);
  });

  it('writes a durable cache payload', () => {
    const rootDir = mkdtempSync(join(tmpdir(), 'theme-fallback-write-'));
    tempDirs.push(rootDir);

    const theme = sampleTheme('2026-08-08');
    saveLastGoodTheme(rootDir, { ...theme, _contextImage: 'mood.jpg', _fallback: { reused: true } });

    const raw = JSON.parse(
      readFileSync(join(rootDir, 'src', 'data', 'last-good-theme.json'), 'utf-8'),
    );
    expect(raw.sourceDate).toBe('2026-08-08');
    expect(raw.theme.name).toBe('Fallback Fixture');
    expect(raw.theme._contextImage).toBeUndefined();
    expect(raw.theme._fallback).toBeUndefined();
  });
});

describe('resolveLastGoodFallback', () => {
  it('keeps an existing theme already written for today regardless of error kind', () => {
    const existingToday = sampleTheme('2026-08-09');
    const validationError = new Error('schema validation failed');

    const outcome = resolveLastGoodFallback({
      error: validationError,
      today: '2026-08-09',
      existingToday,
      // A last-good is present but must be ignored in favor of today's theme.
      lastGood: sampleTheme('2026-08-01'),
    });

    expect(outcome.action).toBe('keep');
    expect(outcome.theme).toBe(existingToday);
    expect(outcome.sourceDate).toBe('2026-08-09');
    expect(outcome.reason).toBe('schema validation failed');
  });

  it('reuses the last-good theme on an API outage when today has nothing yet', () => {
    const lastGood = sampleTheme('2026-08-07');
    const outcome = resolveLastGoodFallback({
      error: createClaudeApiUnavailableError('529 overloaded'),
      today: '2026-08-09',
      existingToday: null,
      lastGood,
    });

    expect(outcome.action).toBe('reuse');
    expect(outcome.sourceDate).toBe('2026-08-07');
    expect(outcome.theme?.date).toBe('2026-08-09');
    expect(outcome.theme?._fallback).toMatchObject({ reused: true, sourceDate: '2026-08-07' });
    // Source theme is never mutated.
    expect(lastGood.date).toBe('2026-08-07');
  });

  it('returns "none" for non-outage errors even when a last-good exists', () => {
    const outcome = resolveLastGoodFallback({
      error: new Error('Unrecognized key "background"'),
      today: '2026-08-09',
      existingToday: null,
      lastGood: sampleTheme('2026-08-07'),
    });

    expect(outcome.action).toBe('none');
    expect(outcome.theme).toBeNull();
  });

  it('returns "none" on an API outage when no usable fallback theme exists', () => {
    const outcome = resolveLastGoodFallback({
      error: createClaudeApiUnavailableError('Claude API unavailable'),
      today: '2026-08-09',
      existingToday: null,
      lastGood: null,
    });

    expect(outcome.action).toBe('none');
    expect(outcome.theme).toBeNull();
    expect(outcome.reason).toBe('Claude API unavailable');
  });

  it('falls back to a default reason when the error has no message', () => {
    const outcome = resolveLastGoodFallback({
      error: {},
      today: '2026-08-09',
      existingToday: null,
      lastGood: null,
    });

    expect(outcome.action).toBe('none');
    expect(outcome.reason).toBe('Claude API unavailable');
  });
});
