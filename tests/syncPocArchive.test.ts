import { describe, expect, it } from 'vitest';
import {
  buildArchivePageUrl,
  normalizeCoverImageUrl,
  parseArchivePage,
  resolveDeadTwitterEmbedCover,
  resizeSubstackCdnCoverForArchive,
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
      'https://substackcdn.com/image/fetch/w_600,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fbucketeer-e05bbc84-baa3-437e-9518-adb32be77984.s3.amazonaws.com%2Fpublic%2Fimages%2F788b62f0-df52-481b-a26b-317accf45794_1800x1206.jpeg',
    );
    expect(
      normalizeCoverImageUrl(
        'https://substackcdn.com/image/fetch/$s_!BKdm!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fx.jpeg',
      ),
    ).toBe(
      'https://substackcdn.com/image/fetch/w_600,c_limit,$s_!BKdm!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fx.jpeg',
    );
    expect(resizeSubstackCdnCoverForArchive('https://example.test/x')).toBe('https://example.test/x');
  });

  it('rewrites dead pbs.substack.com Twitter embed covers to post_preview art', () => {
    const dead =
      'https://substackcdn.com/image/fetch/$s_!Nrxo!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fpbs.substack.com%2Fmedia%2FEpetRQpWMAEh6LX.jpg';
  expect(resolveDeadTwitterEmbedCover(26776496, dead)).toBe(
      'https://www.proofofconcept.pub/api/v1/post_preview/26776496/twitter.jpg',
    );
    expect(resolveDeadTwitterEmbedCover(1, 'https://substackcdn.com/image/fetch/x.jpeg')).toBe(
      'https://substackcdn.com/image/fetch/x.jpeg',
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
