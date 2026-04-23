import { describe, expect, it } from 'vitest';
import {
  clampTitleFontSize,
  truncateDescription,
  typeLabel,
} from '../../src/pages/api/og-helpers';

describe('clampTitleFontSize', () => {
  it('uses 56px for short titles (<= 50 chars)', () => {
    expect(clampTitleFontSize(1)).toBe(56);
    expect(clampTitleFontSize(50)).toBe(56);
  });

  it('steps down to 48px between 51 and 80 chars inclusive', () => {
    expect(clampTitleFontSize(51)).toBe(48);
    expect(clampTitleFontSize(80)).toBe(48);
  });

  it('steps down to 40px beyond 80 chars', () => {
    expect(clampTitleFontSize(81)).toBe(40);
    expect(clampTitleFontSize(200)).toBe(40);
  });

  it('handles 0-length titles at the largest size', () => {
    expect(clampTitleFontSize(0)).toBe(56);
  });
});

describe('truncateDescription', () => {
  it('returns short descriptions untouched', () => {
    expect(truncateDescription('Short')).toBe('Short');
  });

  it('returns a 120-char description untouched (boundary)', () => {
    const text = 'a'.repeat(120);
    expect(truncateDescription(text, 120)).toBe(text);
  });

  it('truncates to max-3 chars + "..." when over the limit', () => {
    const text = 'a'.repeat(121);
    const out = truncateDescription(text, 120);
    expect(out.length).toBe(120);
    expect(out.endsWith('...')).toBe(true);
  });

  it('returns empty string for empty input', () => {
    expect(truncateDescription('')).toBe('');
  });

  it('accepts a custom max length', () => {
    expect(truncateDescription('abcdefghij', 5)).toBe('ab...');
  });
});

describe('typeLabel', () => {
  it('returns "Notes" for notes, "Writing" otherwise', () => {
    expect(typeLabel('notes')).toBe('Notes');
    expect(typeLabel('writing')).toBe('Writing');
    expect(typeLabel('')).toBe('Writing');
    expect(typeLabel(null)).toBe('Writing');
    expect(typeLabel(undefined)).toBe('Writing');
    expect(typeLabel('something-else')).toBe('Writing');
  });
});
