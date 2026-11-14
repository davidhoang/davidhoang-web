import { describe, expect, it } from 'vitest';
import { resizeSubstackCdnCover } from '../src/utils/substackCoverImage';

describe('resizeSubstackCdnCover', () => {
  it('adds width limit to substackcdn fetch URLs', () => {
    const full =
      'https://substackcdn.com/image/fetch/$s_!BKdm!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fx.jpeg';
    expect(resizeSubstackCdnCover(full)).toBe(
      'https://substackcdn.com/image/fetch/w_600,c_limit,$s_!BKdm!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fx.jpeg',
    );
  });

  it('replaces an existing width hint', () => {
    const legacy =
      'https://substackcdn.com/image/fetch/w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fexample.jpeg';
    expect(resizeSubstackCdnCover(legacy)).toBe(
      'https://substackcdn.com/image/fetch/w_600,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fexample.jpeg',
    );
  });

  it('wraps bare Substack S3 URLs through the CDN resizer', () => {
    const bare =
      'https://substack-post-media.s3.amazonaws.com/public/images/61a14540-dac9-408c-a583-d0084a570d7c_2200x440.png';
    expect(resizeSubstackCdnCover(bare)).toBe(
      `https://substackcdn.com/image/fetch/w_600,c_limit,f_auto,q_auto:good,fl_progressive:steep/${encodeURIComponent(bare)}`,
    );
  });

  it('passes through non-Substack URLs', () => {
    expect(resizeSubstackCdnCover('https://example.test/cover.webp')).toBe(
      'https://example.test/cover.webp',
    );
  });
});