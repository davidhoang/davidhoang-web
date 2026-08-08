/**
 * Last-good theme cache + Claude API unavailability detection.
 *
 * When daily theme generation cannot reach Claude, reuse the cached theme so
 * scheduled builds stay green instead of failing the deploy pipeline.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * @typedef {Record<string, any>} ThemeRecord
 */

export const LAST_GOOD_THEME_RELATIVE_PATH = join('src', 'data', 'last-good-theme.json');
export const DAILY_THEMES_RELATIVE_PATH = join('src', 'data', 'daily-themes.json');

export const CLAUDE_API_UNAVAILABLE_CODE = 'CLAUDE_API_UNAVAILABLE';
export const ANTHROPIC_API_KEY_MISSING_CODE = 'ANTHROPIC_API_KEY_MISSING';

const API_STATUS_FALLBACK = new Set([401, 403, 408, 429, 500, 502, 503, 504, 529]);

const NETWORK_ERROR_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETIMEDOUT',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_SOCKET',
]);

const API_MESSAGE_PATTERNS = [
  /anthropic/i,
  /claude api/i,
  /api[_ ]?key/i,
  /rate limit/i,
  /overloaded/i,
  /timed?\s*out/i,
  /timeout/i,
  /network/i,
  /fetch failed/i,
  /socket hang up/i,
  /econnreset/i,
  /enotfound/i,
  /connection error/i,
  /service unavailable/i,
  /internal server error/i,
];

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isClaudeApiUnavailableError(error) {
  if (!error) return false;

  if (typeof error === 'string') {
    return API_MESSAGE_PATTERNS.some((pattern) => pattern.test(error));
  }

  if (typeof error !== 'object') return false;

  const err = /** @type {Record<string, any>} */ (error);

  if (
    err.code === CLAUDE_API_UNAVAILABLE_CODE ||
    err.code === ANTHROPIC_API_KEY_MISSING_CODE
  ) {
    return true;
  }

  if (typeof err.status === 'number' && API_STATUS_FALLBACK.has(err.status)) {
    return true;
  }

  if (typeof err.statusCode === 'number' && API_STATUS_FALLBACK.has(err.statusCode)) {
    return true;
  }

  const name = String(err.name || '');
  if (
    name === 'APIConnectionError' ||
    name === 'APIConnectionTimeoutError' ||
    name === 'AuthenticationError' ||
    name === 'PermissionDeniedError' ||
    name === 'RateLimitError' ||
    name === 'InternalServerError' ||
    name === 'APIUserAbortError'
  ) {
    return true;
  }

  if (err.code && NETWORK_ERROR_CODES.has(String(err.code))) {
    return true;
  }

  if (err.cause && isClaudeApiUnavailableError(err.cause)) {
    return true;
  }

  const message = String(err.message || '');
  if (message && API_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))) {
    return true;
  }

  // Aggregated candidate failures: "reason A | reason B"
  if (message.includes(' | ')) {
    const parts = message.split(' | ').map((part) => part.trim()).filter(Boolean);
    if (parts.length > 0 && parts.every((part) => isClaudeApiUnavailableError(part))) {
      return true;
    }
  }

  return false;
}

/**
 * @param {unknown[]} errors
 * @returns {boolean}
 */
export function allErrorsAreClaudeApiUnavailable(errors) {
  if (!Array.isArray(errors) || errors.length === 0) return false;
  return errors.every((error) => isClaudeApiUnavailableError(error));
}

/**
 * @param {string} message
 * @param {object} [options]
 * @param {unknown} [options.cause]
 * @param {string} [options.code]
 */
export function createClaudeApiUnavailableError(
  message,
  { cause, code = CLAUDE_API_UNAVAILABLE_CODE } = {},
) {
  const error = new Error(message);
  error.code = code;
  if (cause !== undefined) error.cause = cause;
  return error;
}

/**
 * @param {string} rootDir
 */
export function lastGoodThemePath(rootDir) {
  return join(rootDir, LAST_GOOD_THEME_RELATIVE_PATH);
}

/**
 * @param {string} rootDir
 */
export function dailyThemesPath(rootDir) {
  return join(rootDir, DAILY_THEMES_RELATIVE_PATH);
}

/**
 * @param {ThemeRecord | null | undefined} theme
 * @returns {boolean}
 */
export function isUsableTheme(theme) {
  return Boolean(
    theme &&
      typeof theme === 'object' &&
      typeof theme.name === 'string' &&
      theme.colors?.light &&
      theme.colors?.dark,
  );
}

/**
 * Persist a successfully generated theme as the last-good cache.
 * @param {string} rootDir
 * @param {ThemeRecord} theme
 * @returns {{ cachedAt: string, sourceDate: string | null, theme: ThemeRecord }}
 */
export function saveLastGoodTheme(rootDir, theme) {
  if (!isUsableTheme(theme)) {
    throw new Error('Cannot cache an incomplete theme as last-good');
  }

  const path = lastGoodThemePath(rootDir);
  mkdirSync(dirname(path), { recursive: true });

  const { _contextImage, _contextMarkdown, _fallback, ...themeToSave } = theme;
  const payload = {
    cachedAt: new Date().toISOString(),
    sourceDate: themeToSave.date || null,
    theme: /** @type {ThemeRecord} */ (themeToSave),
  };

  writeFileSync(path, JSON.stringify(payload, null, 2));
  return payload;
}

/**
 * Load the dedicated last-good cache, if present.
 * @param {string} rootDir
 * @returns {ThemeRecord | null}
 */
export function loadLastGoodThemeCache(rootDir) {
  try {
    const raw = JSON.parse(readFileSync(lastGoodThemePath(rootDir), 'utf-8'));
    if (isUsableTheme(raw?.theme)) return /** @type {ThemeRecord} */ (raw.theme);
    if (isUsableTheme(raw)) return /** @type {ThemeRecord} */ (raw);
    return null;
  } catch {
    return null;
  }
}

/**
 * Load themes history file.
 * @param {string} rootDir
 * @returns {{ themes: ThemeRecord[], currentDate: string | null }}
 */
export function loadDailyThemesData(rootDir) {
  try {
    return JSON.parse(readFileSync(dailyThemesPath(rootDir), 'utf-8'));
  } catch {
    return { themes: [], currentDate: null };
  }
}

/**
 * Resolve the best last-good theme from cache, then history.
 * @param {string} rootDir
 * @returns {ThemeRecord | null}
 */
export function loadLastGoodTheme(rootDir) {
  const cached = loadLastGoodThemeCache(rootDir);
  if (cached) return cached;

  const themesData = loadDailyThemesData(rootDir);
  const themes = Array.isArray(themesData.themes) ? themesData.themes : [];
  return themes.find((theme) => isUsableTheme(theme)) || null;
}

/**
 * Clone a prior theme for today's date when Claude is unavailable.
 * @param {ThemeRecord} theme
 * @param {{ date: string, reason?: string }} options
 * @returns {ThemeRecord}
 */
export function reuseLastGoodTheme(theme, { date, reason = 'Claude API unavailable' } = {}) {
  if (!isUsableTheme(theme)) {
    throw new Error('No usable last-good theme available for fallback');
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Fallback theme requires a YYYY-MM-DD date');
  }

  const reused = /** @type {ThemeRecord} */ (structuredClone(theme));
  const sourceDate = reused.date || null;

  reused.date = date;
  reused._fallback = {
    reused: true,
    sourceDate,
    reason,
    reusedAt: new Date().toISOString(),
  };

  // Keep showcase in sync with the reused date when subtitle is a date string.
  const subtitle = reused.showcase?.elements?.card?.props?.subtitle;
  if (typeof subtitle === 'string' && sourceDate && subtitle.includes(sourceDate)) {
    reused.showcase.elements.card.props.subtitle = subtitle.replace(sourceDate, date);
  }

  return reused;
}

/**
 * Decide whether generation should fall back instead of failing the job.
 * @param {unknown} error
 * @param {ThemeRecord | null} lastGood
 * @returns {boolean}
 */
export function shouldUseLastGoodFallback(error, lastGood) {
  return isClaudeApiUnavailableError(error) && isUsableTheme(lastGood);
}
