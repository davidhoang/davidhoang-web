import { describe, expect, it } from 'vitest';
import {
  collectWritingTags,
  filterWritingByTag,
  formatWritingTagLabel,
  writingTagPath,
} from '../src/utils/writingTags';

const entries = [
  { id: 'a', data: { tags: ['design', 'ai'] } },
  { id: 'b', data: { tags: ['ai', 'ai', 'craft'] } },
  { id: 'c', data: { tags: ['ai'] } },
  { id: 'd', data: {} },
];

describe('writingTagPath', () => {
  it('links a tag to its listing page', () => {
    expect(writingTagPath('interface-design')).toBe('/writing/tag/interface-design');
  });

  it('encodes characters that are unsafe in a path segment', () => {
    expect(writingTagPath('design systems')).toBe('/writing/tag/design%20systems');
  });
});

describe('formatWritingTagLabel', () => {
  it('sentence-cases hyphenated tags', () => {
    expect(formatWritingTagLabel('interface-design')).toBe('Interface design');
    expect(formatWritingTagLabel('career')).toBe('Career');
  });

  it('keeps acronyms uppercase', () => {
    expect(formatWritingTagLabel('ai')).toBe('AI');
    expect(formatWritingTagLabel('AI')).toBe('AI');
  });
});

describe('collectWritingTags', () => {
  it('counts each post once per tag and sorts by count, then name', () => {
    expect(collectWritingTags(entries)).toEqual([
      { tag: 'ai', count: 3 },
      { tag: 'craft', count: 1 },
      { tag: 'design', count: 1 },
    ]);
  });

  it('returns nothing when no post is tagged', () => {
    expect(collectWritingTags([{ data: {} }])).toEqual([]);
  });
});

describe('filterWritingByTag', () => {
  it('keeps only posts carrying the tag', () => {
    expect(filterWritingByTag(entries, 'ai').map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(filterWritingByTag(entries, 'design').map((e) => e.id)).toEqual(['a']);
    expect(filterWritingByTag(entries, 'missing')).toEqual([]);
  });
});
