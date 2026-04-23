import { describe, expect, it } from 'vitest';
import { parseYoutubeVideoId } from '../../src/utils/youtube';

describe('parseYoutubeVideoId', () => {
  const ID = 'dQw4w9WgXcQ';

  it.each([
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/watch?feature=share&v=${ID}`,
  ])('extracts id from %s', (url) => {
    expect(parseYoutubeVideoId(url)).toBe(ID);
  });

  it('accepts a bare 11-character id', () => {
    expect(parseYoutubeVideoId(ID)).toBe(ID);
    expect(parseYoutubeVideoId(`  ${ID}  `)).toBe(ID);
  });

  it('rejects ids of the wrong length', () => {
    expect(parseYoutubeVideoId('short')).toBeNull();
    expect(parseYoutubeVideoId('a'.repeat(12))).toBeNull();
  });

  it('returns null for null, undefined, empty, and non-strings', () => {
    expect(parseYoutubeVideoId(null)).toBeNull();
    expect(parseYoutubeVideoId(undefined)).toBeNull();
    expect(parseYoutubeVideoId('')).toBeNull();
    // @ts-expect-error — testing runtime guard
    expect(parseYoutubeVideoId(123)).toBeNull();
  });

  it('returns null for unrelated urls', () => {
    expect(parseYoutubeVideoId('https://vimeo.com/123456789')).toBeNull();
    expect(parseYoutubeVideoId('https://example.com/watch?v=short')).toBeNull();
  });
});
