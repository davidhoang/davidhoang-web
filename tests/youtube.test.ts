import { describe, it, expect } from 'vitest';
import { parseYoutubeVideoId } from '../src/utils/youtube';

const ID = 'dQw4w9WgXcQ';

describe('parseYoutubeVideoId', () => {
  it('returns null for null / undefined / empty', () => {
    expect(parseYoutubeVideoId(null)).toBeNull();
    expect(parseYoutubeVideoId(undefined)).toBeNull();
    expect(parseYoutubeVideoId('')).toBeNull();
  });

  it('returns null for non-string types (defensive)', () => {
    // @ts-expect-error — runtime guard
    expect(parseYoutubeVideoId(123)).toBeNull();
  });

  it('accepts a bare 11-character id', () => {
    expect(parseYoutubeVideoId(ID)).toBe(ID);
  });

  it('rejects ids that are not exactly 11 chars', () => {
    expect(parseYoutubeVideoId('1234567890')).toBeNull();
    expect(parseYoutubeVideoId('123456789012')).toBeNull();
  });

  it('parses youtube.com/watch?v= URLs', () => {
    expect(parseYoutubeVideoId(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID);
  });

  it('parses watch URLs with additional query params', () => {
    expect(
      parseYoutubeVideoId(`https://www.youtube.com/watch?feature=shared&v=${ID}&t=10s`),
    ).toBe(ID);
  });

  it('parses youtu.be short URLs', () => {
    expect(parseYoutubeVideoId(`https://youtu.be/${ID}`)).toBe(ID);
  });

  it('parses /embed/ URLs', () => {
    expect(parseYoutubeVideoId(`https://www.youtube.com/embed/${ID}`)).toBe(ID);
  });

  it('parses /shorts/ URLs', () => {
    expect(parseYoutubeVideoId(`https://www.youtube.com/shorts/${ID}`)).toBe(ID);
  });

  it('trims surrounding whitespace', () => {
    expect(parseYoutubeVideoId(`  https://youtu.be/${ID}  `)).toBe(ID);
  });

  it('returns null for non-youtube URLs', () => {
    expect(parseYoutubeVideoId('https://example.com/watch?v=abc')).toBeNull();
  });
});
