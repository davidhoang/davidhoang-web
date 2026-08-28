import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { discoverableStaticPages } from '../src/data/navigation';
import {
  SEARCH_INDEX_COLLECTIONS,
  SEARCH_INDEX_EXCLUDE_PATHS,
  SEARCH_INDEX_INCLUDE_DRAFTS,
  isExcludedFromSearchIndex,
  isIndexedSitemapPage,
} from '../src/data/searchIndexConfig';
import { normalizePath } from '../src/utils/searchIndex';

const PAGES_ROOT = join(process.cwd(), 'src/pages');

function walkFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walkFiles(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function astroFileToPath(relFromPages: string): string | null {
  if (!relFromPages.endsWith('.astro')) return null;
  const withoutExt = relFromPages.replace(/\.astro$/, '');
  const segments = withoutExt.split('/');
  if (segments.some((segment) => segment.startsWith('['))) return null;
  if (segments[segments.length - 1] === 'index') {
    segments.pop();
  }
  return `/${segments.join('/')}`.replace(/\/+$/, '') || '/';
}

function collectionFromDynamicAstro(relFromPages: string): string | null {
  const match = relFromPages.match(/^([^/]+)\/\[[^\]]+\]\.astro$/);
  return match?.[1] ?? null;
}

describe('search index policy (PC-40)', () => {
  it('does not index drafts', () => {
    expect(SEARCH_INDEX_INCLUDE_DRAFTS).toBe(false);
  });

  it('keeps discoverable pages out of the exclude list', () => {
    const indexed = new Set(discoverableStaticPages.map((page) => normalizePath(page.path)));
    for (const path of SEARCH_INDEX_EXCLUDE_PATHS) {
      expect(indexed.has(path)).toBe(false);
    }
    for (const page of discoverableStaticPages) {
      expect(isExcludedFromSearchIndex(page.path)).toBe(false);
    }
  });

  it('excludes utility, deprecated, feed, and machine endpoints', () => {
    expect(isExcludedFromSearchIndex('/labs')).toBe(true);
    expect(isExcludedFromSearchIndex('/404')).toBe(true);
    expect(isExcludedFromSearchIndex('/default-layout')).toBe(true);
    expect(isExcludedFromSearchIndex('/api/og')).toBe(true);
    expect(isExcludedFromSearchIndex('/rss.xml')).toBe(true);
    expect(isExcludedFromSearchIndex('/rss/notes.xml')).toBe(true);
    expect(isExcludedFromSearchIndex('/search-index.json')).toBe(true);
    expect(isExcludedFromSearchIndex('/llms.txt')).toBe(true);
    expect(isExcludedFromSearchIndex('/.well-known/agent.json')).toBe(true);
    expect(isExcludedFromSearchIndex('/design.md')).toBe(true);
  });

  it('aligns sitemap filtering with the same exclude contract', () => {
    expect(isIndexedSitemapPage('https://www.davidhoang.com/about')).toBe(true);
    expect(isIndexedSitemapPage('https://www.davidhoang.com/labs')).toBe(false);
    expect(isIndexedSitemapPage('https://www.davidhoang.com/default-layout')).toBe(false);
  });

  it('classifies every src/pages HTML route as indexed, excluded, or a known collection', () => {
    const indexed = new Set(discoverableStaticPages.map((page) => normalizePath(page.path)));
    const files = walkFiles(PAGES_ROOT).map((full) => relative(PAGES_ROOT, full));

    for (const rel of files) {
      if (rel.endsWith('.astro')) {
        const staticPath = astroFileToPath(rel);
        if (staticPath) {
          const allowed = indexed.has(staticPath) || isExcludedFromSearchIndex(staticPath);
          expect(allowed, `${rel} → ${staticPath} is neither indexed nor excluded`).toBe(true);
          continue;
        }
        const collection = collectionFromDynamicAstro(rel);
        expect(
          collection && (SEARCH_INDEX_COLLECTIONS as readonly string[]).includes(collection),
          `${rel} is a dynamic page outside SEARCH_INDEX_COLLECTIONS`,
        ).toBeTruthy();
        continue;
      }

      const machine =
        rel.endsWith('.ts') ||
        rel.endsWith('.js') ||
        rel.endsWith('.json.ts') ||
        rel.endsWith('.txt.ts') ||
        rel.endsWith('.md.ts');
      expect(machine, `${rel} is an unclassified page source`).toBe(true);
    }
  });
});
