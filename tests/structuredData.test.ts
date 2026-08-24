import { describe, expect, it } from 'vitest';
import {
  BLOG_ID,
  NOTES_ID,
  PERSON_ID,
  WEBSITE_ID,
  absoluteUrl,
  buildBlogPostingJsonLd,
  buildBreadcrumbListJsonLd,
  buildNoteCreativeWorkJsonLd,
  buildNowPageJsonLd,
  buildProfilePageJsonLd,
  buildSiteGraphJsonLd,
  NOW_LAST_UPDATED,
  SITE_LANGUAGE,
  toIsoDate,
  toIsoDateOnly,
} from '../src/utils/structuredData';

describe('structuredData helpers', () => {
  it('absoluteUrl joins site + path without trailing slash', () => {
    expect(absoluteUrl('/writing/hello/')).toBe('https://www.davidhoang.com/writing/hello');
    expect(absoluteUrl('https://example.com/x')).toBe('https://example.com/x');
  });

  it('toIsoDate / toIsoDateOnly normalize inputs', () => {
    expect(toIsoDate('2026-06-06T12:00:00.000Z')).toBe('2026-06-06T12:00:00.000Z');
    expect(toIsoDateOnly('2026-06-06')).toBe('2026-06-06');
    expect(toIsoDateOnly(new Date('2026-06-06T15:00:00.000Z'))).toBe('2026-06-06');
  });
});

describe('buildSiteGraphJsonLd', () => {
  it('emits Person, WebSite, Blog, and Notes with stable linked @ids', () => {
    const graph = buildSiteGraphJsonLd();
    expect(graph['@context']).toBe('https://schema.org');
    const nodes = graph['@graph'] as Array<Record<string, unknown>>;
    const byId = new Map(nodes.map((n) => [n['@id'], n]));

    expect(byId.get(PERSON_ID)?.['@type']).toBe('Person');
    expect(byId.get(WEBSITE_ID)?.['@type']).toBe('WebSite');
    expect(byId.get(BLOG_ID)?.['@type']).toBe('Blog');
    expect(byId.get(NOTES_ID)?.['@type']).toBe('CollectionPage');

    const website = byId.get(WEBSITE_ID)!;
    expect(website.inLanguage).toBe(SITE_LANGUAGE);
    expect(website.author).toEqual({ '@id': PERSON_ID });
    expect(website.publisher).toEqual({ '@id': PERSON_ID });
    expect(website.mainEntity).toEqual({ '@id': PERSON_ID });

    expect(byId.get(BLOG_ID)?.isPartOf).toEqual({ '@id': WEBSITE_ID });
    expect(byId.get(NOTES_ID)?.isPartOf).toEqual({ '@id': WEBSITE_ID });
  });

  it('defaults WebSite description to the stable site blurb', () => {
    const graph = buildSiteGraphJsonLd();
    const website = (graph['@graph'] as Array<Record<string, unknown>>).find(
      (n) => n['@id'] === WEBSITE_ID,
    )!;
    expect(website.description).toBe('The official website of David Hoang');
  });
});

describe('buildBlogPostingJsonLd', () => {
  it('uses BlogPosting with mainEntityOfPage, isPartOf, keywords, and linked author', () => {
    const json = buildBlogPostingJsonLd({
      title: 'Hello',
      description: 'Deck',
      canonicalUrl: 'https://www.davidhoang.com/writing/hello',
      datePublished: '2025-01-02T00:00:00.000Z',
      imageUrl: 'https://www.davidhoang.com/images/x.webp',
      tags: ['design', 'ai'],
    });

    expect(json['@type']).toBe('BlogPosting');
    expect(json['@id']).toBe('https://www.davidhoang.com/writing/hello#blogposting');
    expect(json.inLanguage).toBe(SITE_LANGUAGE);
    expect(json.keywords).toBe('design, ai');
    expect(json.isPartOf).toEqual({ '@id': BLOG_ID });
    expect(json.author).toEqual({ '@id': PERSON_ID });
    expect(json.publisher).toEqual({ '@id': PERSON_ID });
    expect(json.mainEntityOfPage).toEqual({
      '@type': 'WebPage',
      '@id': 'https://www.davidhoang.com/writing/hello',
    });
    expect(json.datePublished).toBe('2025-01-02T00:00:00.000Z');
    expect(json.dateModified).toBe('2025-01-02T00:00:00.000Z');
    expect(json.image).toEqual(['https://www.davidhoang.com/images/x.webp']);
  });

  it('honors an explicit dateModified when provided', () => {
    const json = buildBlogPostingJsonLd({
      title: 'Hello',
      description: 'Deck',
      canonicalUrl: 'https://www.davidhoang.com/writing/hello',
      datePublished: '2025-01-02T00:00:00.000Z',
      dateModified: '2025-02-01T00:00:00.000Z',
    });
    expect(json.dateModified).toBe('2025-02-01T00:00:00.000Z');
  });
});

describe('buildNoteCreativeWorkJsonLd', () => {
  it('uses CreativeWork (not BlogPosting/Article) and links the notes garden', () => {
    const json = buildNoteCreativeWorkJsonLd({
      title: 'Garden note',
      description: 'A thought',
      canonicalUrl: 'https://www.davidhoang.com/notes/garden-note',
      datePublished: '2024-12-01T00:00:00.000Z',
      dateModified: '2025-01-02T00:00:00.000Z',
      tags: ['systems'],
    });

    expect(json['@type']).toBe('CreativeWork');
    expect(json['@type']).not.toBe('BlogPosting');
    expect(json['@type']).not.toBe('Article');
    expect(json.isPartOf).toEqual({ '@id': NOTES_ID });
    expect(json.author).toEqual({ '@id': PERSON_ID });
    expect(json.keywords).toBe('systems');
    expect(json.datePublished).toBe('2024-12-01T00:00:00.000Z');
    expect(json.dateModified).toBe('2025-01-02T00:00:00.000Z');
    expect(json.mainEntityOfPage).toEqual({
      '@type': 'WebPage',
      '@id': 'https://www.davidhoang.com/notes/garden-note',
    });
  });

  it('omits keywords and image when source data has none', () => {
    const json = buildNoteCreativeWorkJsonLd({
      title: 'Sparse',
      description: 'No extras',
      canonicalUrl: 'https://www.davidhoang.com/notes/sparse',
      datePublished: '2024-01-01T00:00:00.000Z',
    });
    expect(json.keywords).toBeUndefined();
    expect(json.image).toBeUndefined();
  });
});

describe('buildNowPageJsonLd', () => {
  it('emits WebPage freshness with day-level dateModified', () => {
    const json = buildNowPageJsonLd({
      description: 'What I am up to',
      dateModified: NOW_LAST_UPDATED,
    });
    expect(json['@type']).toBe('WebPage');
    expect(json.dateModified).toBe(NOW_LAST_UPDATED);
    expect(json.inLanguage).toBe(SITE_LANGUAGE);
    expect(json.isPartOf).toEqual({ '@id': WEBSITE_ID });
    expect(json.mainEntity).toEqual({ '@id': PERSON_ID });
  });
});

describe('buildProfilePageJsonLd', () => {
  it('marks the about page as a ProfilePage whose subject is the Person', () => {
    const json = buildProfilePageJsonLd();
    expect(json['@type']).toBe('ProfilePage');
    expect(json['@id']).toBe('https://www.davidhoang.com/about#profilepage');
    expect(json.url).toBe('https://www.davidhoang.com/about');
    expect(json.inLanguage).toBe(SITE_LANGUAGE);
    expect(json.isPartOf).toEqual({ '@id': WEBSITE_ID });
    expect(json.mainEntity).toEqual({ '@id': PERSON_ID });
    expect(json.about).toEqual({ '@id': PERSON_ID });
    expect(json.dateModified).toBeUndefined();
  });

  it('includes an ISO dateModified when provided', () => {
    const json = buildProfilePageJsonLd({ dateModified: '2026-01-15T00:00:00.000Z' });
    expect(json.dateModified).toBe('2026-01-15T00:00:00.000Z');
  });
});

describe('buildBreadcrumbListJsonLd', () => {
  it('numbers ListItem positions from 1', () => {
    const json = buildBreadcrumbListJsonLd([
      { name: 'Home', item: 'https://www.davidhoang.com' },
      { name: 'Writing', item: 'https://www.davidhoang.com/writing' },
    ]);
    const items = json.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(2);
    expect(items[0].position).toBe(1);
    expect(items[1].position).toBe(2);
  });
});

describe('JSON-LD serializability', () => {
  it('round-trips builders through JSON.stringify without loss of @keys', () => {
    const payloads = [
      buildSiteGraphJsonLd(),
      buildBlogPostingJsonLd({
        title: 'T',
        description: 'D',
        canonicalUrl: 'https://www.davidhoang.com/writing/t',
        datePublished: '2025-01-01T00:00:00.000Z',
        tags: ['a'],
      }),
      buildNoteCreativeWorkJsonLd({
        title: 'N',
        description: 'D',
        canonicalUrl: 'https://www.davidhoang.com/notes/n',
        datePublished: '2025-01-01T00:00:00.000Z',
      }),
      buildNowPageJsonLd({ description: 'D', dateModified: NOW_LAST_UPDATED }),
      buildProfilePageJsonLd(),
    ];

    for (const payload of payloads) {
      const parsed = JSON.parse(JSON.stringify(payload));
      expect(parsed['@context']).toBe('https://schema.org');
      expect(parsed['@type'] || parsed['@graph']).toBeTruthy();
    }
  });
});
