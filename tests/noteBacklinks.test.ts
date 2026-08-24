import { describe, expect, it } from 'vitest';
import { extractLinkedNoteIds, findNoteBacklinks } from '../src/utils/noteBacklinks';

describe('extractLinkedNoteIds', () => {
  it('extracts relative and absolute note hrefs', () => {
    const text = [
      'See [Dynamic Interfaces](/notes/dynamic-interfaces) and',
      '[MVC](https://www.davidhoang.com/notes/mvc-is-decoupling#section),',
      'plus [AI](https://davidhoang.com/notes/ai-interface-systems/).',
    ].join(' ');

    expect(extractLinkedNoteIds(text).sort()).toEqual([
      'ai-interface-systems',
      'dynamic-interfaces',
      'mvc-is-decoupling',
    ]);
  });

  it('extracts HTML hrefs and autolinked URLs', () => {
    const text = [
      '<a href="/notes/product-intuition?ref=garden">Product intuition</a>',
      'and <https://www.davidhoang.com/notes/design-systems-thinking>.',
    ].join(' ');

    expect(extractLinkedNoteIds(text).sort()).toEqual([
      'design-systems-thinking',
      'product-intuition',
    ]);
  });

  it('ignores non-note links', () => {
    expect(extractLinkedNoteIds('[Essay](/writing/hello) and [site](https://example.com)')).toEqual(
      [],
    );
  });
});

describe('findNoteBacklinks', () => {
  const notes = [
    {
      id: 'dynamic-interfaces',
      body: 'Sibling of [MVC](/notes/mvc-is-decoupling).',
      data: {
        title: 'Dynamic Interfaces',
        description: 'Adaptive UI',
        relatedNotes: ['ai-interface-systems'],
        pubDate: new Date('2026-04-04'),
      },
    },
    {
      id: 'mvc-is-decoupling',
      body: 'Standalone note.',
      data: {
        title: 'A New MVC is Emerging',
        description: 'MVC shift',
        relatedNotes: ['dynamic-interfaces'],
        pubDate: new Date('2025-01-04'),
      },
    },
    {
      id: 'ai-interface-systems',
      body: 'No outbound note links.',
      data: {
        title: 'AI Interface Systems',
        description: 'AI UI',
        pubDate: new Date('2025-01-15'),
      },
    },
  ];

  it('finds frontmatter and body backlinks', () => {
    const backlinks = findNoteBacklinks({
      noteId: 'dynamic-interfaces',
      notes,
    });

    expect(backlinks.map((item) => item.id)).toEqual(['mvc-is-decoupling']);
    expect(backlinks[0]?.href).toBe('/notes/mvc-is-decoupling');
  });

  it('includes overview markdown links and dedupes with relatedNotes', () => {
    const withOverview = [
      ...notes,
      {
        id: 'design-systems-thinking',
        body: 'Also relatedNotes points at the same target.',
        data: {
          title: 'Design Systems Thinking',
          overview: 'Pairs with [Dynamic Interfaces](/notes/dynamic-interfaces).',
          relatedNotes: ['dynamic-interfaces'],
          pubDate: new Date('2024-12-15'),
          updatedDate: new Date('2025-01-02'),
        },
      },
    ];

    const backlinks = findNoteBacklinks({
      noteId: 'dynamic-interfaces',
      notes: withOverview,
    });

    expect(backlinks.map((item) => item.id)).toEqual([
      'mvc-is-decoupling',
      'design-systems-thinking',
    ]);
  });

  it('ignores self-links and unknown targets', () => {
    const selfLinked = [
      {
        id: 'product-intuition',
        body: 'Loop [self](/notes/product-intuition) and [missing](/notes/does-not-exist).',
        data: {
          title: 'Building Product Intuition',
          relatedNotes: ['product-intuition', 'does-not-exist'],
          pubDate: new Date('2024-11-20'),
        },
      },
    ];

    expect(
      findNoteBacklinks({
        noteId: 'product-intuition',
        notes: selfLinked,
      }),
    ).toEqual([]);
  });

  it('returns empty when nothing links here', () => {
    expect(
      findNoteBacklinks({
        noteId: 'ai-interface-systems',
        notes: notes.filter((note) => note.id !== 'dynamic-interfaces'),
      }),
    ).toEqual([]);
  });
});
