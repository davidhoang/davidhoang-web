import { describe, expect, it } from 'vitest';
import { absoluteUrl, buildLlmsTxt, CANONICAL_SITE } from '../src/utils/llmsTxt';

describe('absoluteUrl', () => {
  it('builds canonical https://www.davidhoang.com URLs without trailing slash', () => {
    expect(absoluteUrl('/about')).toBe('https://www.davidhoang.com/about');
    expect(absoluteUrl('/writing/hello/')).toBe('https://www.davidhoang.com/writing/hello');
    expect(absoluteUrl('notes/foo')).toBe('https://www.davidhoang.com/notes/foo');
  });

  it('passes through already-absolute URLs', () => {
    expect(absoluteUrl('https://example.com/x')).toBe('https://example.com/x');
  });
});

describe('buildLlmsTxt', () => {
  const sample = buildLlmsTxt({
    pages: [
      { title: 'About', path: '/about', description: 'About David Hoang' },
      { title: 'Writing', path: '/writing', description: 'Essays and articles' },
    ],
    writing: [
      {
        title: 'Hello',
        path: '/writing/hello',
        description: 'A published post',
      },
      {
        title: 'Draft should not be passed in',
        path: '/writing/secret-draft',
        description: 'This tests formatting only; route filters drafts',
      },
    ],
    notes: [{ title: 'Seed note', path: '/notes/seed', description: 'A garden note' }],
  });

  it('follows llms.txt shape: H1, blockquote, then H2 link sections', () => {
    expect(sample.startsWith('# David Hoang\n')).toBe(true);
    expect(sample).toContain(
      '> Personal website of David Hoang — designer, investor, and builder.',
    );
    expect(sample).toMatch(/^## Pages$/m);
    expect(sample).toMatch(/^## Writing$/m);
    expect(sample).toMatch(/^## Notes$/m);
    expect(sample).toMatch(/^## Feeds & indexes$/m);
  });

  it('uses absolute canonical URLs for pages, writing, notes, and discovery endpoints', () => {
    expect(sample).toContain(`- [About](${CANONICAL_SITE}/about): About David Hoang`);
    expect(sample).toContain(`- [Hello](${CANONICAL_SITE}/writing/hello): A published post`);
    expect(sample).toContain(`- [Seed note](${CANONICAL_SITE}/notes/seed): A garden note`);
    expect(sample).toContain(`- [Writing RSS](${CANONICAL_SITE}/rss.xml):`);
    expect(sample).toContain(`- [Notes RSS](${CANONICAL_SITE}/rss/notes.xml):`);
    expect(sample).toContain(`- [Sitemap](${CANONICAL_SITE}/sitemap-index.xml):`);
    expect(sample).toContain(`- [Search index](${CANONICAL_SITE}/search-index.json):`);
  });

  it('omits empty sections when a collection has no links', () => {
    const emptyNotes = buildLlmsTxt({
      pages: [{ title: 'About', path: '/about' }],
      writing: [],
      notes: [],
    });
    expect(emptyNotes).not.toMatch(/^## Writing$/m);
    expect(emptyNotes).not.toMatch(/^## Notes$/m);
    expect(emptyNotes).toMatch(/^## Feeds & indexes$/m);
  });

  it('keeps site identity concise and points agents at canonical discovery surfaces', () => {
    expect(sample).toContain('https://www.davidhoang.com');
    expect(sample).toContain('Draft writing and notes are omitted');
    expect(sample).toContain('search-index.json');
  });
});
