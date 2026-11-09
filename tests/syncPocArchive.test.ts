import { describe, expect, it } from 'vitest';
import {
  buildArchivePageUrl,
  parseArchivePage,
} from '../scripts/sync-poc-archive.mjs';

describe('sync-poc-archive Substack API shape', () => {
  it('reads cursor-paged archive responses', () => {
    const { posts, nextCursor } = parseArchivePage({
      posts: [{ id: 1, slug: 'a', cover_image: 'https://example.test/c.webp' }],
      nextCursor: 'abc123',
    });
    expect(posts).toHaveLength(1);
    expect(nextCursor).toBe('abc123');
  });

  it('builds the first and subsequent page URLs', () => {
    expect(buildArchivePageUrl(null)).toBe(
      'https://www.proofofconcept.pub/api/v1/archive?order_by=display_date',
    );
    expect(buildArchivePageUrl('eyJhIjoxfQ==')).toBe(
      'https://www.proofofconcept.pub/api/v1/archive?order_by=display_date&cursor=eyJhIjoxfQ%3D%3D',
    );
  });
});
