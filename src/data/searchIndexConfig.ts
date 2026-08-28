/**
 * Explicit /search-index.json indexing policy (PC-40).
 *
 * Pagefind used to index `dist/` with implicit defaults (no pagefind.json).
 * Full-text Pagefind was removed in 372d421; ⌘K and agents now use
 * `/search-index.json`. This module is the documented include/exclude
 * contract so indexing is not implicit in the route builder.
 *
 * Strategy:
 * - Static HTML destinations: `discoverableStaticPages` in navigation.ts
 * - Writing + notes: published collections only (`includeDrafts: false`)
 * - Utility, deprecated, API, and feed routes: listed below and never indexed
 */
import { normalizePath } from '../utils/searchIndex';

export const SEARCH_INDEX_INCLUDE_DRAFTS = false;

/** Content collections whose published entries are indexed as items. */
export const SEARCH_INDEX_COLLECTIONS = ['writing', 'notes'] as const;

export type SearchIndexCollection = (typeof SEARCH_INDEX_COLLECTIONS)[number];

/**
 * Exact HTML paths that exist as routes but must not appear in the index.
 * Keep this list explicit so a new page cannot be omitted by accident
 * without a test failure (see tests/searchIndexConfig.test.ts).
 */
export const SEARCH_INDEX_EXCLUDE_PATHS = [
  '/labs',
  '/404',
  '/default-layout',
] as const;

/**
 * Prefixes for machine/feed endpoints that are never search destinations.
 * `/rss` also covers `/rss.xml` and `/rss/…`.
 */
export const SEARCH_INDEX_EXCLUDE_PATH_PREFIXES = [
  '/api/',
  '/rss',
  '/.well-known/',
] as const;

const EXACT_EXCLUDES = new Set<string>(SEARCH_INDEX_EXCLUDE_PATHS);

export function searchIndexPathname(input: string): string {
  return normalizePath(input);
}

export function isExcludedFromSearchIndex(input: string): boolean {
  const path = searchIndexPathname(input);
  if (EXACT_EXCLUDES.has(path)) return true;
  if (path === '/search-index.json' || path === '/llms.txt') return true;
  if (path === '/design.md' || path === '/design-guide.md') return true;
  return SEARCH_INDEX_EXCLUDE_PATH_PREFIXES.some((prefix) => {
    if (prefix.endsWith('/')) {
      return path === prefix.slice(0, -1) || path.startsWith(prefix);
    }
    return path === prefix || path.startsWith(`${prefix}.`) || path.startsWith(`${prefix}/`);
  });
}

/** Sitemap should not advertise the same utility/deprecated HTML as search. */
export function isIndexedSitemapPage(pageUrl: string): boolean {
  return !isExcludedFromSearchIndex(pageUrl);
}
