import { describe, expect, it } from 'vitest';
import {
  HERO_SIZES,
  CONTENT_SIZES,
  generateSrcSet,
  generateSizes,
  createResponsiveImage,
  getOptimizedImagePath,
  getResponsiveVariants,
} from '../../src/utils/responsive-images';

describe('generateSrcSet', () => {
  it('produces a srcset with width descriptors for each breakpoint', () => {
    expect(generateSrcSet('/images/blog/cover.webp', CONTENT_SIZES)).toBe(
      '/images/blog/cover-400w.webp 400w, /images/blog/cover-800w.webp 800w, /images/blog/cover-1200w.webp 1200w',
    );
  });

  it('preserves the original extension', () => {
    const result = generateSrcSet('/images/cover.png', { small: 400, medium: 800, large: 1200 });
    expect(result).toContain('/images/cover-400w.png 400w');
    expect(result).toContain('/images/cover-1200w.png 1200w');
  });

  it('defaults to .webp when the path has no extension', () => {
    const result = generateSrcSet('/images/cover', { small: 400, medium: 800, large: 1200 });
    expect(result).toContain('/images/cover-400w.webp 400w');
  });

  it('handles filenames with dots in the base name', () => {
    const result = generateSrcSet('/images/v1.0/hero.webp', { small: 400, medium: 800, large: 1200 });
    // Only the final extension should be stripped; the dot in "v1.0" must survive.
    expect(result).toContain('/images/v1.0/hero-400w.webp 400w');
  });

  it('includes xlarge when present on hero sizes', () => {
    const result = generateSrcSet('/hero.webp', HERO_SIZES);
    expect(result).toContain('hero-768w.webp 768w');
    expect(result).toContain('hero-2560w.webp 2560w');
  });
});

describe('generateSizes', () => {
  it('returns a custom sizes string when provided', () => {
    expect(generateSizes('content', '(max-width: 500px) 100vw, 50vw')).toBe(
      '(max-width: 500px) 100vw, 50vw',
    );
  });

  it('returns the hero breakpoints for hero', () => {
    expect(generateSizes('hero')).toBe(
      '(max-width: 768px) 100vw, (max-width: 1280px) 100vw, (max-width: 1920px) 100vw, 2560px',
    );
  });

  it('returns content breakpoints for content', () => {
    expect(generateSizes('content')).toBe(
      '(max-width: 480px) 100vw, (max-width: 768px) 90vw, (max-width: 1200px) 80vw, 1200px',
    );
  });

  it('falls back to 100vw for custom without a value', () => {
    expect(generateSizes('custom')).toBe('100vw');
  });
});

describe('createResponsiveImage', () => {
  it('defaults to lazy loading and content sizes', () => {
    const img = createResponsiveImage({ src: '/pic.webp', alt: 'alt' });
    expect(img.loading).toBe('lazy');
    expect(img.sizes).toContain('(max-width: 480px)');
    expect(img.srcSet).toContain('pic-400w.webp 400w');
    expect(img.alt).toBe('alt');
  });

  it('honors the hero type and passes through eager loading', () => {
    const img = createResponsiveImage({ src: '/h.webp', alt: 'h', loading: 'eager' }, 'hero');
    expect(img.loading).toBe('eager');
    expect(img.srcSet).toContain('h-2560w.webp 2560w');
  });
});

describe('getOptimizedImagePath', () => {
  it('converts jpg/jpeg/png to webp', () => {
    expect(getOptimizedImagePath('/a.jpg')).toBe('/a.webp');
    expect(getOptimizedImagePath('/a.JPEG')).toBe('/a.webp');
    expect(getOptimizedImagePath('/a.png')).toBe('/a.webp');
  });

  it('leaves already-webp and other extensions untouched', () => {
    expect(getOptimizedImagePath('/a.webp')).toBe('/a.webp');
    expect(getOptimizedImagePath('/a.gif')).toBe('/a.gif');
  });
});

describe('getResponsiveVariants', () => {
  it('lists one variant per breakpoint width', () => {
    const variants = getResponsiveVariants('/cover.webp', { small: 400, medium: 800, large: 1200 });
    expect(variants).toEqual([
      '/cover-400w.webp',
      '/cover-800w.webp',
      '/cover-1200w.webp',
    ]);
  });
});
