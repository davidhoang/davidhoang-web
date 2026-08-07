import { describe, expect, it } from 'vitest';
import { commandPalettePages, discoverableStaticPages } from '../src/data/navigation';
import {
  absoluteUrl,
  buildSearchIndexDocument,
  normalizePath,
  parseSearchIndexItems,
  SEARCH_INDEX_SCHEMA_VERSION,
  SEARCH_INDEX_SITE,
  toIsoDate,
} from '../src/utils/searchIndex';

describe('normalizePath / absoluteUrl', () => {
  it('normalizes paths without trailing slash (except root)', () => {
    expect(normalizePath('/')).toBe('/');
    expect(normalizePath('/about/')).toBe('/about');
    expect(normalizePath('writing/hello')).toBe('/writing/hello');
  });

  it('builds canonical absolute URLs', () => {
    expect(absoluteUrl('/works')).toBe(`${SEARCH_INDEX_SITE}/works`);
    expect(absoluteUrl('/')).toBe(`${SEARCH_INDEX_SITE}/`);
  });
});

describe('toIsoDate', () => {
  it('formats Date and date-like strings as YYYY-MM-DD', () => {
    expect(toIsoDate(new Date('2025-01-04T12:00:00.000Z'))).toBe('2025-01-04');
    expect(toIsoDate('2026-08-07')).toBe('2026-08-07');
    expect(toIsoDate(undefined)).toBeUndefined();
  });
});

describe('discoverableStaticPages', () => {
  it('includes every command-palette page plus sitemap-visible destinations', () => {
    const paths = new Set(discoverableStaticPages.map((page) => page.path));
    for (const page of commandPalettePages) {
      expect(paths.has(page.path)).toBe(true);
    }
    expect(paths.has('/')).toBe(true);
    expect(paths.has('/works')).toBe(true);
    expect(paths.has('/design-resources')).toBe(true);
    expect(paths.has('/thesis')).toBe(true);
    expect(paths.has('/cv')).toBe(true);
    expect(paths.has('/prototypes')).toBe(true);
  });

  it('excludes utility and deprecated destinations', () => {
    const paths = discoverableStaticPages.map((page) => page.path);
    expect(paths).not.toContain('/default-layout');
    expect(paths).not.toContain('/labs');
    expect(paths).not.toContain('/404');
  });
});

describe('buildSearchIndexDocument', () => {
  const generatedAt = '2026-08-07T01:00:00.000Z';

  const document = buildSearchIndexDocument({
    generatedAt,
    pages: [
      { title: 'Home', description: 'Home page', path: '/' },
      { title: 'Works', description: 'Selected work', path: '/works' },
      { title: 'About', description: 'About David', path: '/about/' },
    ],
    writing: [
      {
        id: 'hello',
        title: 'Hello',
        description: 'A published post',
        pubDate: new Date('2025-06-15T00:00:00.000Z'),
        tags: ['design', 'ai'],
      },
    ],
    notes: [
      {
        id: 'seed',
        title: 'Seed note',
        description: 'Short description',
        overview: 'A longer overview for agents',
        pubDate: new Date('2025-01-04T00:00:00.000Z'),
        updatedDate: new Date('2025-02-01T00:00:00.000Z'),
        stage: 'thoughts',
        tags: ['software'],
      },
    ],
  });

  it('emits a stable versioned envelope', () => {
    expect(document.schemaVersion).toBe(SEARCH_INDEX_SCHEMA_VERSION);
    expect(document.schemaVersion).toBe(1);
    expect(document.generatedAt).toBe(generatedAt);
    expect(document.site).toBe(SEARCH_INDEX_SITE);
    expect(Array.isArray(document.items)).toBe(true);
  });

  it('preserves command-palette fields on every item', () => {
    for (const item of document.items) {
      expect(typeof item.title).toBe('string');
      expect(typeof item.description).toBe('string');
      expect(typeof item.path).toBe('string');
      expect(['page', 'writing', 'note']).toContain(item.type);
      expect(item.url).toBe(absoluteUrl(item.path));
    }
  });

  it('adds richer fields for writing and notes', () => {
    const writing = document.items.find((item) => item.path === '/writing/hello');
    expect(writing).toMatchObject({
      type: 'writing',
      pubDate: '2025-06-15',
      tags: ['design', 'ai'],
      url: `${SEARCH_INDEX_SITE}/writing/hello`,
    });

    const note = document.items.find((item) => item.path === '/notes/seed');
    expect(note).toMatchObject({
      type: 'note',
      pubDate: '2025-01-04',
      updatedDate: '2025-02-01',
      stage: 'thoughts',
      tags: ['software'],
      excerpt: 'A longer overview for agents',
      url: `${SEARCH_INDEX_SITE}/notes/seed`,
    });
  });

  it('dedupes by path and normalizes trailing slashes', () => {
    const aboutMatches = document.items.filter((item) => item.path === '/about');
    expect(aboutMatches).toHaveLength(1);
  });
});

describe('parseSearchIndexItems', () => {
  it('reads items from the v1 envelope', () => {
    const items = parseSearchIndexItems({
      schemaVersion: 1,
      generatedAt: '2026-08-07T00:00:00.000Z',
      site: SEARCH_INDEX_SITE,
      items: [
        { title: 'About', description: 'Bio', path: '/about', type: 'page' },
      ],
    });
    expect(items).toEqual([
      { title: 'About', description: 'Bio', path: '/about', type: 'page' },
    ]);
  });

  it('keeps legacy bare arrays working for older consumers', () => {
    const legacy = [
      { title: 'About', description: 'Bio', path: '/about', type: 'page' as const },
    ];
    expect(parseSearchIndexItems(legacy)).toEqual(legacy);
  });

  it('rejects invalid payloads', () => {
    expect(() => parseSearchIndexItems(null)).toThrow(/Invalid search index/);
    expect(() => parseSearchIndexItems({})).toThrow(/Invalid search index/);
  });
});
