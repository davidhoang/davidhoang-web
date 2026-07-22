/**
 * Persist Playwright edge signatures for recent themes so daily generation
 * only re-renders new candidates (plus cache misses), not the full history.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/** Bump when signature algorithm or home layout contract changes. */
export const THEME_SIGNATURE_CACHE_VERSION = 1;

/** Must match `THEME_RENDER_VIEWPORTS` names in theme-renderer.mjs */
const CACHED_VIEWPORT_NAMES = ['mobile', 'desktop', 'wide'];

const CACHE_RELATIVE_PATH = join('src', 'data', 'theme-render-signatures.json');

/**
 * Stable hash of theme fields that affect homepage screenshots.
 * @param {object} theme
 */
export function themeRenderFingerprint(theme) {
  const payload = {
    date: theme?.date || null,
    name: theme?.name || null,
    hero: theme?.hero?.layout || null,
    grid: theme?.layout?.gridStyle || null,
    cards: theme?.cards || null,
    links: theme?.links?.style || null,
    footer: theme?.footer?.style || null,
    texture: theme?.background?.texture || null,
    images: theme?.images || null,
    shader: theme?.shader || null,
    typography: theme?.typography || null,
    layout: {
      borderRadius: theme?.layout?.borderRadius,
      containerMaxWidth: theme?.layout?.containerMaxWidth,
      sectionSpacing: theme?.layout?.sectionSpacing,
      contentPadding: theme?.layout?.contentPadding,
    },
    fonts: {
      heading: theme?.fonts?.heading?.name || theme?.fonts?.heading || null,
      body: theme?.fonts?.body?.name || theme?.fonts?.body || null,
      headingUrl: theme?.fonts?.heading?.url || null,
      bodyUrl: theme?.fonts?.body?.url || null,
    },
    colors: {
      contrastMode: theme?.colors?.contrastMode || null,
      light: theme?.colors?.light || null,
      dark: theme?.colors?.dark || null,
    },
  };
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 24);
}

export function signatureCachePath(rootDir) {
  return join(rootDir, CACHE_RELATIVE_PATH);
}

/**
 * @param {string} rootDir
 * @returns {{ version: number, entries: Record<string, object> }}
 */
export function loadSignatureCache(rootDir) {
  const path = signatureCachePath(rootDir);
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    if (parsed?.version !== THEME_SIGNATURE_CACHE_VERSION || typeof parsed.entries !== 'object') {
      return emptyCache();
    }
    return { version: THEME_SIGNATURE_CACHE_VERSION, entries: parsed.entries || {} };
  } catch {
    return emptyCache();
  }
}

/**
 * @param {string} rootDir
 * @param {{ version: number, entries: Record<string, object> }} cache
 */
export function saveSignatureCache(rootDir, cache) {
  const path = signatureCachePath(rootDir);
  mkdirSync(dirname(path), { recursive: true });
  const pruned = pruneCacheEntries(cache.entries);
  writeFileSync(path, `${JSON.stringify({
    version: THEME_SIGNATURE_CACHE_VERSION,
    updatedAt: new Date().toISOString(),
    entries: pruned,
  }, null, 2)}\n`);
}

/**
 * @param {object} cache
 * @param {object} theme
 * @returns {{ viewports: Record<string, { signature: number[], metrics?: object }> } | null}
 */
export function getCachedRenderResult(cache, theme) {
  if (!theme?.date) return null;
  const entry = cache?.entries?.[theme.date];
  if (!entry) return null;
  if (entry.fingerprint !== themeRenderFingerprint(theme)) return null;
  if (!hasCompleteSignatures(entry.viewports)) return null;
  return {
    viewports: Object.fromEntries(
      Object.entries(entry.viewports).map(([name, viewport]) => [
        name,
        {
          signature: viewport.signature,
          metrics: viewport.metrics || { issues: [] },
        },
      ]),
    ),
  };
}

/**
 * Write newly rendered themes into the cache (by date).
 * @param {object} cache
 * @param {Array<{ id: string, theme: object }>} entries
 * @param {{ results: Record<string, { viewports: object }> }} renderReport
 */
export function mergeRenderResultsIntoCache(cache, entries, renderReport) {
  if (!renderReport?.results) return cache;
  for (const { id, theme } of entries) {
    if (!theme?.date) continue;
    const rendered = renderReport.results[id];
    if (!rendered?.viewports || !hasCompleteSignatures(rendered.viewports)) continue;
    cache.entries[theme.date] = {
      fingerprint: themeRenderFingerprint(theme),
      name: theme.name || null,
      cachedAt: new Date().toISOString(),
      viewports: Object.fromEntries(
        Object.entries(rendered.viewports).map(([name, viewport]) => [
          name,
          {
            signature: viewport.signature,
            // Persist empty issues for cache hits used only as distance baselines.
            metrics: { issues: [] },
          },
        ]),
      ),
    };
  }
  return cache;
}

/**
 * Split entries into cache hits and themes that still need Playwright.
 * @param {object} cache
 * @param {Array<{ id: string, theme: object }>} entries
 */
export function partitionCachedEntries(cache, entries) {
  const cachedResults = {};
  const missing = [];
  for (const entry of entries) {
    const hit = getCachedRenderResult(cache, entry.theme);
    if (hit) {
      cachedResults[entry.id] = hit;
    } else {
      missing.push(entry);
    }
  }
  return { cachedResults, missing };
}

function emptyCache() {
  return { version: THEME_SIGNATURE_CACHE_VERSION, entries: {} };
}

function hasCompleteSignatures(viewports) {
  if (!viewports || typeof viewports !== 'object') return false;
  return CACHED_VIEWPORT_NAMES.every((name) => {
    const signature = viewports[name]?.signature;
    return Array.isArray(signature) && signature.length > 0;
  });
}

/** Keep ~30 days of signatures; prefer dated keys sorted descending. */
function pruneCacheEntries(entries) {
  const dated = Object.entries(entries || {})
    .filter(([date]) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort(([left], [right]) => right.localeCompare(left))
    .slice(0, 30);
  return Object.fromEntries(dated);
}

/**
 * True when the cache file exists on disk (used by workflow checks).
 * @param {string} rootDir
 */
export function signatureCacheExists(rootDir) {
  return existsSync(signatureCachePath(rootDir));
}
