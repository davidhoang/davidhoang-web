import { describe, expect, it } from 'vitest';
import {
  countReadableWords,
  estimateReadingMinutes,
  formatReadingTime,
} from '../src/utils/readingTime';

describe('reading time', () => {
  it('counts readable markdown instead of formatting and destinations', () => {
    expect(countReadableWords('# Hello [design systems](https://example.com) `const hidden = true`')).toBe(
      3,
    );
  });

  it('combines multiple content sources and rounds up', () => {
    const words = Array.from({ length: 250 }, () => 'word').join(' ');
    expect(estimateReadingMinutes(['Short overview', words])).toBe(2);
  });

  it('uses a one-minute floor and concise label', () => {
    expect(estimateReadingMinutes([''])).toBe(1);
    expect(formatReadingTime(4)).toBe('4 min read');
  });
});
