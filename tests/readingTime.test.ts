import { describe, it, expect } from 'vitest';
import { calculateReadingTime } from '../src/utils/readingTime';

describe('calculateReadingTime', () => {
  it('returns 1 for undefined input', () => {
    expect(calculateReadingTime(undefined)).toBe(1);
  });

  it('returns 1 for empty string (floor at 1 min)', () => {
    expect(calculateReadingTime('')).toBe(1);
  });

  it('returns 1 for very short prose', () => {
    expect(calculateReadingTime('hello world')).toBe(1);
  });

  it('rounds to nearest minute at 225 wpm', () => {
    // 450 words => exactly 2 minutes
    const words = Array(450).fill('word').join(' ');
    expect(calculateReadingTime(words)).toBe(2);
  });

  it('strips fenced code blocks before counting', () => {
    const codeOnly = '```js\n' + Array(1000).fill('let x = 1;').join('\n') + '\n```';
    // With code stripped, prose is empty => still floor 1
    expect(calculateReadingTime(codeOnly)).toBe(1);
  });

  it('counts prose around fenced code blocks', () => {
    const prose = Array(450).fill('word').join(' ');
    const mixed = `${prose}\n\n\`\`\`js\nlet x = 1;\n\`\`\`\n\n${prose}`;
    // 900 prose words / 225 = 4 min
    expect(calculateReadingTime(mixed)).toBe(4);
  });
});
