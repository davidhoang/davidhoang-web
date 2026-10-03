import { describe, expect, it } from 'vitest';
import { workCaseStudies, workCaseStudySlugs } from '../src/data/workCaseStudies';
import { works } from '../src/data/works';
import { commandPalettePages, discoverableStaticPages } from '../src/data/navigation';
import { isExcludedFromSearchIndex } from '../src/data/searchIndexConfig';

describe('works case studies (PC-21)', () => {
  it('links every role card with a case study to /works/{slug}', () => {
    for (const study of workCaseStudies) {
      const entry = works.find((item) => item.id === study.slug);
      expect(entry, `missing works entry for ${study.slug}`).toBeDefined();
      expect(entry?.kind).toBe('role');
      expect(entry?.href).toBe(`/works/${study.slug}`);
    }
  });

  it('keeps slugs aligned with work entry ids', () => {
    for (const slug of workCaseStudySlugs) {
      expect(works.some((entry) => entry.id === slug)).toBe(true);
    }
  });

  it('indexes case study paths for search and sitemap', () => {
    for (const study of workCaseStudies) {
      const path = `/works/${study.slug}`;
      expect(isExcludedFromSearchIndex(path)).toBe(false);
    }
  });
});

describe('/uses page (PC-32)', () => {
  it('is discoverable via command palette and search index static pages', () => {
    const palette = commandPalettePages.find((page) => page.path === '/uses');
    expect(palette?.title).toBe('Uses');

    const indexed = discoverableStaticPages.find((page) => page.path === '/uses');
    expect(indexed).toBeDefined();
    expect(isExcludedFromSearchIndex('/uses')).toBe(false);
  });
});
