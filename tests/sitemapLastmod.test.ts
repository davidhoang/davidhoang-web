import { describe, expect, it } from 'vitest';
import { absoluteUrl } from '../src/utils/structuredData';
import { getSitemapLastmodMap, resolveSitemapLastmod } from '../src/utils/sitemapLastmod';

describe('sitemapLastmod', () => {
  it('maps writing and notes URLs from frontmatter', () => {
    const map = getSitemapLastmodMap();
    expect(map.has(absoluteUrl('/writing/optimizing-for-agents'))).toBe(true);
    expect(map.has(absoluteUrl('/notes/design-systems-thinking'))).toBe(true);
  });

  it('prefers updatedDate over pubDate for notes', () => {
    const lastmod = resolveSitemapLastmod(absoluteUrl('/notes/design-systems-thinking'));
    expect(lastmod?.toISOString().slice(0, 10)).toBe('2025-01-02');
  });

  it('sets index freshness from the newest child entry', () => {
    const map = getSitemapLastmodMap();
    const writingDates = [...map.entries()]
      .filter(([url]) => url.startsWith(`${absoluteUrl('/writing')}/`))
      .map(([, date]) => date.getTime());
    const writingIndex = resolveSitemapLastmod(absoluteUrl('/writing'));
    expect(writingIndex?.getTime()).toBe(Math.max(...writingDates));
  });

  it('aligns /now with structured data constant', () => {
    expect(resolveSitemapLastmod(absoluteUrl('/now'))?.toISOString().slice(0, 10)).toBe('2026-10-09');
  });

  it('does not invent lastmod for static pages', () => {
    expect(resolveSitemapLastmod(absoluteUrl('/about'))).toBeUndefined();
  });
});
