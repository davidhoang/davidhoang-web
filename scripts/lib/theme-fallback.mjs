/**
 * Last-good daily theme cache for Claude API outages.
 *
 * Successful generations write `src/data/last-good-theme.json`.
 * When the Claude API is unavailable, generation reuses that theme
 * (dated for today) so the daily-theme workflow can still complete.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * @typedef {Record<string, any>} ThemeRecord
 */

export const LAST_GOOD_THEME_CACHE_VERSION = 1;
export const CLAUDE_API_UNAVAILABLE_CODE = 'CLAUDE_API_UNAVAILABLE';

const CACHE_RELATIVE_PATH = join('src', 'data', 'last-good-theme.json');
const THEMES_RELATIVE_PATH = join('src', 'data', 'daily-themes.json');

/**
 * Error thrown when Claude cannot be reached or refuses the request
 * in a way that should trigger last-good fallback.
 */
export class ClaudeApiUnavailableError extends Error {
  /**
   * @param {string} message
   * @param {{ cause?: unknown }} [options]
   */
  constructor(message, options = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'ClaudeApiUnavailableError';
    this.code = CLAUDE_API_UNAVAILABLE_CODE;
  }
}

/**
 * @param {string} rootDir
 */
export function lastGoodThemeCachePath(rootDir) {
  return join(rootDir, CACHE_RELATIVE_PATH);
}

/**
 * Strip internal generator tracking fields before caching/saving.
 * @param {ThemeRecord | null | undefined} theme
 * @returns {ThemeRecord | null}
 */
export function sanitizeThemeForCache(theme) {
  if (!theme || typeof theme !== 'object') return null;
  const {
    _contextImage,
    _contextMarkdown,
    ...rest
  } = theme;
  return /** @type {ThemeRecord} */ (structuredClone(rest));
}

/**
 * Persist a successfully generated theme as the last-good cache.
 * @param {string} rootDir
 * @param {ThemeRecord} theme
 * @param {{ savedAt?: string }} [options]
 * @returns {{ version: number, savedAt: string, sourceDate: string | null, theme: ThemeRecord }}
 */
export function saveLastGoodTheme(rootDir, theme, options = {}) {
  const sanitized = sanitizeThemeForCache(theme);
  if (!sanitized) {
    throw new Error('Cannot cache an empty theme as last-good');
  }

  const payload = {
    version: LAST_GOOD_THEME_CACHE_VERSION,
    savedAt: options.savedAt || new Date().toISOString(),
    sourceDate: typeof sanitized.date === 'string' ? sanitized.date : null,
    theme: sanitized,
  };

  const path = lastGoodThemeCachePath(rootDir);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}

/**
 * Load the dedicated last-good cache, falling back to daily-themes.json[0].
 * @param {string} rootDir
 * @returns {{ theme: ThemeRecord, source: 'cache' | 'history', sourceDate: string | null } | null}
 */
export function loadLastGoodTheme(rootDir) {
  const cachePath = lastGoodThemeCachePath(rootDir);
  try {
    const raw = JSON.parse(readFileSync(cachePath, 'utf-8'));
    if (raw?.theme && typeof raw.theme === 'object') {
      return {
        theme: /** @type {ThemeRecord} */ (structuredClone(raw.theme)),
        source: 'cache',
        sourceDate: raw.sourceDate || raw.theme.date || null,
      };
    }
  } catch {
    // Fall through to history
  }

  try {
    const themesPath = join(rootDir, THEMES_RELATIVE_PATH);
    const themesData = JSON.parse(readFileSync(themesPath, 'utf-8'));
    const latest = themesData?.themes?.[0];
    if (latest && typeof latest === 'object') {
      return {
        theme: /** @type {ThemeRecord} */ (structuredClone(latest)),
        source: 'history',
        sourceDate: latest.date || null,
      };
    }
  } catch {
    // No recoverable theme
  }

  return null;
}

/**
 * Clone a prior theme for reuse on a new calendar day.
 * @param {ThemeRecord} theme
 * @param {string} date YYYY-MM-DD
 * @returns {ThemeRecord}
 */
export function buildFallbackTheme(theme, date) {
  const next = sanitizeThemeForCache(theme);
  if (!next) {
    throw new Error('Cannot build fallback from empty theme');
  }
  next.date = date;
  return next;
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isClaudeApiError(error) {
  if (!error || typeof error !== 'object') return false;

  const err = /** @type {Record<string, any>} */ (error);

  if (err.code === CLAUDE_API_UNAVAILABLE_CODE) return true;
  if (err.name === 'ClaudeApiUnavailableError') return true;

  if (err.cause && isClaudeApiError(err.cause)) return true;

  const status = err.status ?? err.statusCode;
  if (typeof status === 'number') {
    // Auth/quota/server/overload — not schema mistakes in our prompt.
    if (status === 401 || status === 403 || status === 408 || status === 429) return true;
    if (status >= 500) return true;
  }

  const name = String(err.name || '');
  if (
    /APIConnectionError|APIConnectionTimeoutError|RateLimitError|InternalServerError|AuthenticationError|PermissionDeniedError|APIUserAbortError/i.test(
      name,
    )
  ) {
    return true;
  }

  const message = String(err.message || '');
  if (
    /ANTHROPIC_API_KEY|Claude API unavailable|overloaded|connection error|ECONNRESET|ETIMEDOUT|ENOTFOUND|fetch failed|socket hang up|529|503|502|500\b|429\b|401\b/i.test(
      message,
    )
  ) {
    return true;
  }

  return false;
}

/**
 * True when every candidate failure looks like an API outage (not schema/contrast).
 * @param {Array<{ error?: unknown }>} candidateAttempts
 */
export function allCandidatesFailedFromApi(candidateAttempts) {
  if (!Array.isArray(candidateAttempts) || candidateAttempts.length === 0) return false;
  return candidateAttempts.every((attempt) => isClaudeApiError(attempt?.error));
}

/**
 * Resolve a reusable fallback theme for today, or null if none exists.
 * @param {string} rootDir
 * @param {string} [date]
 * @returns {{
 *   theme: ThemeRecord,
 *   source: 'cache' | 'history',
 *   sourceDate: string | null,
 *   reusedFrom: string,
 * } | null}
 */
export function resolveLastGoodFallback(rootDir, date = new Date().toISOString().split('T')[0]) {
  const loaded = loadLastGoodTheme(rootDir);
  if (!loaded) return null;

  return {
    theme: buildFallbackTheme(loaded.theme, date),
    source: loaded.source,
    sourceDate: loaded.sourceDate,
    reusedFrom: typeof loaded.theme?.name === 'string' ? loaded.theme.name : 'unknown',
  };
}
