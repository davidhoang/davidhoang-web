/**
 * /search-index.json — machine-readable discovery index for ⌘K and agents.
 *
 * Schema version: SEARCH_INDEX_SCHEMA_VERSION (integer).
 * Published on every response as header SEARCH_INDEX_SCHEMA_VERSION_HEADER
 * (`X-Search-Index-Schema-Version`). Bump when removing/renaming item fields or
 * changing the top-level JSON shape (must remain a bare array). Additive
 * optional fields on items do not require a bump.
 *
 * Response body (v1): SearchIndexItem[] — a JSON array (not an object envelope).
 *
 * Each item always includes title, description, path, type for command-palette
 * and external-consumer compatibility. Agents also get url (absolute), optional
 * dates/tags/stage/excerpt.
 */

import type { NoteStage } from '../content/noteStages';

/** Canonical public origin (matches astro.config `site`). */
export const SEARCH_INDEX_SITE = 'https://www.davidhoang.com';

/**
 * Integer schema version for item fields and the bare-array body shape.
 * Exposed to clients via SEARCH_INDEX_SCHEMA_VERSION_HEADER.
 */
export const SEARCH_INDEX_SCHEMA_VERSION = 1;

/** Stable response header that advertises SEARCH_INDEX_SCHEMA_VERSION. */
export const SEARCH_INDEX_SCHEMA_VERSION_HEADER = 'X-Search-Index-Schema-Version';

export type SearchIndexItemType = 'page' | 'writing' | 'note';

/** Legacy / command-palette fields — always present on every item. */
export type SearchIndexCompatFields = {
  title: string;
  description: string;
  path: string;
  type: SearchIndexItemType;
};

export type SearchIndexItem = SearchIndexCompatFields & {
  /** Absolute canonical URL (trailingSlash: never). */
  url: string;
  /** ISO date YYYY-MM-DD when the entry was published. */
  pubDate?: string;
  /** ISO date YYYY-MM-DD when the entry was last updated. */
  updatedDate?: string;
  tags?: string[];
  /** Digital garden stage for notes. */
  stage?: NoteStage;
  /**
   * Longer blurb when available (e.g. note overview).
   * When omitted, agents should treat `description` as the excerpt.
   */
  excerpt?: string;
};

export type SearchIndexPageInput = {
  title: string;
  description: string;
  path: string;
  type?: 'page';
};

export type SearchIndexWritingInput = {
  id: string;
  title: string;
  description: string;
  pubDate: Date;
  tags?: string[];
};

export type SearchIndexNoteInput = {
  id: string;
  title: string;
  description?: string;
  overview?: string;
  pubDate: Date;
  updatedDate?: Date;
  stage: NoteStage;
  tags?: string[];
};

export type BuildSearchIndexInput = {
  site?: string;
  pages: readonly SearchIndexPageInput[];
  writing: readonly SearchIndexWritingInput[];
  notes: readonly SearchIndexNoteInput[];
};

/** Normalize to a site path with leading slash and no trailing slash (except root). */
export function normalizePath(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    try {
      const url = new URL(path);
      const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
      return pathname || '/';
    } catch {
      // fall through
    }
  }
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash;
}

export function absoluteUrl(path: string, site: string = SEARCH_INDEX_SITE): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = site.replace(/\/+$/, '');
  return `${base}${normalizePath(path)}`;
}

export function toIsoDate(value: Date | string | undefined): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.valueOf())) return undefined;
    return parsed.toISOString().slice(0, 10);
  }
  if (Number.isNaN(value.valueOf())) return undefined;
  return value.toISOString().slice(0, 10);
}

function uniqueByPath(items: SearchIndexItem[]): SearchIndexItem[] {
  const seen = new Set<string>();
  const out: SearchIndexItem[] = [];
  for (const item of items) {
    if (seen.has(item.path)) continue;
    seen.add(item.path);
    out.push(item);
  }
  return out;
}

function buildPageItem(page: SearchIndexPageInput, site: string): SearchIndexItem {
  const path = normalizePath(page.path);
  const description = page.description?.trim() ?? '';
  return {
    title: page.title,
    description,
    path,
    type: 'page',
    url: absoluteUrl(path, site),
  };
}

function buildWritingItem(post: SearchIndexWritingInput, site: string): SearchIndexItem {
  const path = normalizePath(`/writing/${post.id}`);
  const description = post.description?.trim() ?? '';
  const item: SearchIndexItem = {
    title: post.title,
    description,
    path,
    type: 'writing',
    url: absoluteUrl(path, site),
    pubDate: toIsoDate(post.pubDate),
  };
  if (post.tags?.length) item.tags = [...post.tags];
  return item;
}

function buildNoteItem(note: SearchIndexNoteInput, site: string): SearchIndexItem {
  const path = normalizePath(`/notes/${note.id}`);
  const description = (note.description ?? '').trim();
  const overview = (note.overview ?? '').trim();
  const item: SearchIndexItem = {
    title: note.title,
    description,
    path,
    type: 'note',
    url: absoluteUrl(path, site),
    pubDate: toIsoDate(note.pubDate),
    stage: note.stage,
  };
  const updatedDate = toIsoDate(note.updatedDate);
  if (updatedDate) item.updatedDate = updatedDate;
  if (note.tags?.length) item.tags = [...note.tags];
  if (overview && overview !== description) item.excerpt = overview;
  return item;
}

/**
 * Pure builder for the search-index array body.
 * Callers must exclude drafts before passing writing/notes.
 * Schema version is advertised via SEARCH_INDEX_SCHEMA_VERSION_HEADER, not the body.
 */
export function buildSearchIndex(input: BuildSearchIndexInput): SearchIndexItem[] {
  const site = (input.site ?? SEARCH_INDEX_SITE).replace(/\/+$/, '');

  const byPubDateDesc = <T extends { pubDate: Date }>(a: T, b: T) =>
    b.pubDate.valueOf() - a.pubDate.valueOf();

  const pageItems = input.pages.map((page) => buildPageItem(page, site));
  const writingItems = input.writing
    .slice()
    .sort(byPubDateDesc)
    .map((post) => buildWritingItem(post, site));
  const noteItems = input.notes
    .slice()
    .sort(byPubDateDesc)
    .map((note) => buildNoteItem(note, site));

  return uniqueByPath([...pageItems, ...writingItems, ...noteItems]);
}

/**
 * Normalize a fetched payload for command-palette consumers.
 * Accepts the public bare array, or a transitional `{ items }` envelope.
 */
export function parseSearchIndexItems(payload: unknown): SearchIndexCompatFields[] {
  if (Array.isArray(payload)) {
    return payload.filter(isCompatItem);
  }
  if (
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as { items?: unknown }).items)
  ) {
    return ((payload as { items: unknown[] }).items).filter(isCompatItem);
  }
  throw new Error('Invalid search index payload');
}

function isCompatItem(value: unknown): value is SearchIndexCompatFields {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.title === 'string' &&
    typeof item.description === 'string' &&
    typeof item.path === 'string' &&
    (item.type === 'page' || item.type === 'writing' || item.type === 'note')
  );
}
