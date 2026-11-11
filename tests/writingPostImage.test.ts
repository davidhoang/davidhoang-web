import { describe, it, expect } from 'vitest';
import {
  getWritingPostThumbnail,
  getWritingPostHero,
  hasWritingPostImage,
} from '../src/utils/writingPostImage';

const base = {
  title: 'Test post',
  description: 'A short description',
};

describe('getWritingPostThumbnail', () => {
  it('prefers coverImage over in-body image', () => {
    const post = {
      ...base,
      coverImage: '/cover.webp',
      body: '![diagram](/inline.webp)',
    };
    expect(getWritingPostThumbnail(post)).toBe('/cover.webp');
  });

  it('falls back to first in-body image', () => {
    const post = {
      ...base,
      body: 'Intro\n\n![diagram](/inline.webp)\n\nMore text',
    };
    expect(getWritingPostThumbnail(post)).toBe('/inline.webp');
  });

  it('generates OG URL when no images exist', () => {
    expect(getWritingPostThumbnail({ ...base, body: 'No images here.' })).toBe(
      '/api/og?title=Test+post&type=writing&description=A+short+description',
    );
  });
});

describe('getWritingPostHero', () => {
  it('prefers in-body illustration over cover card', () => {
    const post = {
      ...base,
      coverImage: '/cover.webp',
      body: '![diagram](/inline.webp)',
    };
    expect(getWritingPostHero(post)).toBe('/inline.webp');
  });

  it('uses coverImage when no in-body image exists', () => {
    const post = {
      ...base,
      coverImage: '/cover.webp',
      body: 'Text only.',
    };
    expect(getWritingPostHero(post)).toBe('/cover.webp');
  });

  it('generates OG URL when no images exist', () => {
    expect(getWritingPostHero({ ...base, body: 'No images here.' })).toBe(
      '/api/og?title=Test+post&type=writing&description=A+short+description',
    );
  });
});

describe('hasWritingPostImage', () => {
  it('is true for a cover, an OG image, or an in-body image', () => {
    expect(hasWritingPostImage({ ...base, coverImage: '/cover.webp' })).toBe(true);
    expect(hasWritingPostImage({ ...base, ogImage: '/og.webp' })).toBe(true);
    expect(hasWritingPostImage({ ...base, body: 'Intro\n\n![diagram](/inline.webp)' })).toBe(true);
    expect(hasWritingPostImage({ ...base, body: '<img src="/inline.webp" alt="" />' })).toBe(true);
  });

  it('is false when the post has no image of its own', () => {
    expect(hasWritingPostImage({ ...base })).toBe(false);
    expect(hasWritingPostImage({ ...base, body: 'No images here.' })).toBe(false);
  });
});
