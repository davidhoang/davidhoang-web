import { describe, expect, it } from 'vitest';
import {
  buildArchivePageUrl,
  normalizeCoverImageUrl,
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

  it('rewrites legacy cdn.substack.com cover URLs to substackcdn.com', () => {
    const legacy =
      'https://cdn.substack.com/image/fetch/h_600,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2F788b62f0-df52-481b-a26b-317accf45794_1800x1206.jpeg';
    expect(normalizeCoverImageUrl(legacy)).toBe(
      'https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2F788b62f0-df52-481b-a26b-317accf45794_1800x1206.jpeg',
    );
    expect(
      normalizeCoverImageUrl(
        'https://substackcdn.com/image/fetch/$s_!BKdm!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fx.jpeg',
      ),
    ).toBe(
      'https://substackcdn.com/image/fetch/$s_!BKdm!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fx.jpeg',
    );
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
