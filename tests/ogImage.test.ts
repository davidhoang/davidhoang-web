import { describe, expect, it } from 'vitest';
import {
  buildOgImageUrl,
  isSharedGenericOgImage,
  resolveContentOgImage,
  resolveOgBadge,
  resolveOgTitleFontSize,
} from '../src/utils/ogImage';

describe('resolveOgBadge', () => {
  it('labels writing and notes cards', () => {
    expect(resolveOgBadge('writing')).toBe('Writing');
    expect(resolveOgBadge('notes')).toBe('Notes');
  });

  it('returns no badge for general pages / unknown types', () => {
    expect(resolveOgBadge('page')).toBe('');
    expect(resolveOgBadge(undefined)).toBe('');
    expect(resolveOgBadge(null)).toBe('');
    expect(resolveOgBadge('anything-else')).toBe('');
  });
});

describe('resolveOgTitleFontSize', () => {
  it('shrinks the headline as length grows', () => {
    expect(resolveOgTitleFontSize(10)).toBe(56);
    expect(resolveOgTitleFontSize(50)).toBe(56);
    expect(resolveOgTitleFontSize(51)).toBe(48);
    expect(resolveOgTitleFontSize(80)).toBe(48);
    expect(resolveOgTitleFontSize(81)).toBe(40);
  });
});

describe('buildOgImageUrl', () => {
  it('builds a /api/og URL with encoded title and description', () => {
    const url = buildOgImageUrl({
      title: 'CV & Résumé',
      description: 'A short bio',
      type: 'page',
    });
    const parsed = new URL(url, 'https://www.davidhoang.com');
    expect(parsed.pathname).toBe('/api/og');
    expect(parsed.searchParams.get('title')).toBe('CV & Résumé');
    expect(parsed.searchParams.get('description')).toBe('A short bio');
    expect(parsed.searchParams.get('type')).toBe('page');
  });

  it('defaults type to page and omits an empty description', () => {
    const url = buildOgImageUrl({ title: 'Daily Themes' });
    const parsed = new URL(url, 'https://www.davidhoang.com');
    expect(parsed.searchParams.get('type')).toBe('page');
    expect(parsed.searchParams.has('description')).toBe(false);
  });

  it('passes writing/notes types through for branded badges', () => {
    expect(buildOgImageUrl({ title: 'Post', type: 'writing' })).toContain('type=writing');
    expect(buildOgImageUrl({ title: 'Note', type: 'notes' })).toContain('type=notes');
  });
});

describe('isSharedGenericOgImage', () => {
  it('flags reused stock paths', () => {
    expect(isSharedGenericOgImage('/images/img-dh.webp')).toBe(true);
    expect(isSharedGenericOgImage('https://www.davidhoang.com/images/img-dh.webp')).toBe(true);
  });

  it('allows bespoke art', () => {
    expect(isSharedGenericOgImage('/images/img-david-sf.webp')).toBe(false);
  });
});

describe('resolveContentOgImage', () => {
  it('prefers a non-generic cover', () => {
    expect(
      resolveContentOgImage({
        title: 'Essay',
        coverImage: '/images/blog/2025/cover.webp',
        type: 'writing',
      }),
    ).toBe('/images/blog/2025/cover.webp');
  });

  it('generates when only stock art is available', () => {
    const url = resolveContentOgImage({
      title: 'One Medical',
      description: 'Case study',
      coverImage: '/images/highlights/img-highlights-proof-of-concept.webp',
      type: 'page',
    });
    expect(url).toContain('/api/og');
    expect(url).toContain('title=One+Medical');
  });
});
