import { describe, expect, it } from 'vitest';
import {
  filterByTag,
  filterDraftsInProd,
  prepareRssEntries,
  sortByPubDateDesc,
} from '../../src/utils/rss-helpers';

type Entry = {
  slug: string;
  data: { draft?: boolean; pubDate: Date; tags?: string[] };
};

const entry = (
  slug: string,
  pubDate: string,
  extras: { draft?: boolean; tags?: string[] } = {},
): Entry => ({
  slug,
  data: { pubDate: new Date(pubDate), ...extras },
});

describe('filterDraftsInProd', () => {
  const posts: Entry[] = [
    entry('a', '2024-01-01'),
    entry('b', '2024-02-01', { draft: true }),
    entry('c', '2024-03-01', { draft: false }),
  ];

  it('removes drafts in production', () => {
    const out = filterDraftsInProd(posts, true);
    expect(out.map((p) => p.slug)).toEqual(['a', 'c']);
  });

  it('keeps drafts in development so authors can preview them', () => {
    const out = filterDraftsInProd(posts, false);
    expect(out.map((p) => p.slug)).toEqual(['a', 'b', 'c']);
  });

  it('never mutates the input array', () => {
    const input = [entry('a', '2024-01-01', { draft: true })];
    const before = [...input];
    filterDraftsInProd(input, true);
    expect(input).toEqual(before);
  });

  it('treats missing draft field as not-draft', () => {
    const posts = [entry('no-field', '2024-01-01')];
    expect(filterDraftsInProd(posts, true)).toHaveLength(1);
  });
});

describe('sortByPubDateDesc', () => {
  it('sorts newest first', () => {
    const out = sortByPubDateDesc([
      entry('old', '2023-01-01'),
      entry('newest', '2025-06-01'),
      entry('mid', '2024-03-15'),
    ]);
    expect(out.map((p) => p.slug)).toEqual(['newest', 'mid', 'old']);
  });

  it('does not mutate the input', () => {
    const input = [entry('a', '2024-01-01'), entry('b', '2025-01-01')];
    const snapshot = input.map((e) => e.slug);
    sortByPubDateDesc(input);
    expect(input.map((e) => e.slug)).toEqual(snapshot);
  });
});

describe('prepareRssEntries', () => {
  it('filters drafts in prod AND sorts by newest first', () => {
    const posts = [
      entry('draft-newest', '2025-06-01', { draft: true }),
      entry('published-oldest', '2023-01-01'),
      entry('published-newest', '2025-01-01'),
    ];
    const out = prepareRssEntries(posts, true);
    expect(out.map((p) => p.slug)).toEqual(['published-newest', 'published-oldest']);
  });

  it('in dev keeps drafts but still sorts', () => {
    const posts = [
      entry('old', '2023-01-01'),
      entry('draft-new', '2025-06-01', { draft: true }),
    ];
    const out = prepareRssEntries(posts, false);
    expect(out.map((p) => p.slug)).toEqual(['draft-new', 'old']);
  });
});

describe('filterByTag', () => {
  const posts = [
    entry('a', '2024-01-01', { tags: ['design', 'ai'] }),
    entry('b', '2024-02-01', { tags: ['ai'] }),
    entry('c', '2024-03-01', { tags: ['ops'] }),
    entry('d', '2024-04-01'),
  ];

  it('keeps only posts whose tags include the given tag', () => {
    expect(filterByTag(posts, 'ai').map((p) => p.slug)).toEqual(['a', 'b']);
    expect(filterByTag(posts, 'ops').map((p) => p.slug)).toEqual(['c']);
  });

  it('returns an empty array for an unknown tag', () => {
    expect(filterByTag(posts, 'nope')).toEqual([]);
  });

  it('handles posts that have no tags field', () => {
    expect(filterByTag(posts, 'anything').some((p) => p.slug === 'd')).toBe(false);
  });
});
