import { describe, expect, it } from 'vitest';
import {
  detectLayoutPageKind,
  isWritingTagListingPath,
  openGraphTypeForPageKind,
  resolveLayoutPageKind,
  resolveOpenGraphType,
} from '../src/utils/pageMeta';

describe('pageMeta', () => {
  it('treats /writing and /notes indexes as home (website OG type)', () => {
    expect(detectLayoutPageKind('/writing')).toBe('home');
    expect(detectLayoutPageKind('/notes')).toBe('home');
    expect(openGraphTypeForPageKind('home')).toBe('website');
  });

  it('treats individual writing and note URLs as blog (article OG type)', () => {
    expect(detectLayoutPageKind('/writing/optimizing-for-agents')).toBe('blog');
    expect(detectLayoutPageKind('/notes/product-intuition')).toBe('blog');
    expect(openGraphTypeForPageKind('blog')).toBe('article');
  });

  it('allows explicit pageType to override pathname detection', () => {
    expect(resolveLayoutPageKind('/writing', 'blog')).toBe('blog');
    expect(resolveLayoutPageKind('/about', 'about')).toBe('about');
  });

  it('treats /writing/tag/* as website Open Graph type even though path matches /writing/', () => {
    expect(isWritingTagListingPath('/writing/tag/design')).toBe(true);
    expect(isWritingTagListingPath('/writing/optimizing-for-agents')).toBe(false);
    expect(detectLayoutPageKind('/writing/tag/design')).toBe('blog');
    expect(resolveOpenGraphType('/writing/tag/design')).toBe('website');
    expect(resolveOpenGraphType('/writing/tag/design', 'blog')).toBe('website');
    expect(resolveOpenGraphType('/writing/optimizing-for-agents')).toBe('article');
  });
});
