import { describe, expect, it } from 'vitest';
import { findRelatedContent, getKeywords, scoreRelatedMatch } from '../src/utils/relatedContent';

describe('relatedContent', () => {
  it('scores tag overlap higher than keyword overlap', () => {
    const score = scoreRelatedMatch({
      sourceTags: ['ai', 'architecture'],
      sourceKeywords: getKeywords('model view controller'),
      targetTags: ['ai', 'software'],
      targetKeywords: getKeywords('something else entirely'),
    });

    expect(score).toBeGreaterThanOrEqual(10);
  });

  it('finds cross-collection matches by shared tags', () => {
    const writing = [
      {
        id: 'a-new-mvc-is-emerging',
        data: {
          title: 'A new MVC is emerging',
          description: 'AI is breaking MVC',
          tags: ['ai', 'software', 'architecture'],
          pubDate: new Date('2025-06-15'),
        },
      },
    ];

    const notes = [
      {
        id: 'mvc-is-decoupling',
        data: {
          title: 'A New MVC is Emerging',
          description: 'How AI reshapes MVC',
          tags: ['software', 'ai', 'architecture'],
          pubDate: new Date('2025-01-04'),
        },
      },
    ];

    const related = findRelatedContent({
      kind: 'writing',
      id: 'other-post',
      title: 'Unrelated',
      description: 'No overlap',
      tags: ['ai'],
      writingEntries: writing,
      noteEntries: notes,
      limit: 3,
    });

    expect(related.some((item) => item.id === 'mvc-is-decoupling')).toBe(true);
  });
});
