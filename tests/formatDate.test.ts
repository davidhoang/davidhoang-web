import { describe, expect, it } from 'vitest';
import { formatListDate, formatLongDate, formatRelative } from '../src/utils/formatDate';

describe('formatListDate', () => {
  const now = new Date('2026-09-28T12:00:00.000Z').getTime();

  it('uses relative labels within 14 days', () => {
    const today = new Date('2026-09-28T08:00:00.000Z');
    expect(formatListDate(today, now)).toBe('Today');
  });

  it('uses long date beyond 14 days', () => {
    const old = new Date('2026-08-01T12:00:00.000Z');
    expect(formatListDate(old, now)).toBe(formatLongDate(old));
  });

  it('matches formatRelative for recent week', () => {
    const threeDaysAgo = new Date('2026-09-25T12:00:00.000Z');
    expect(formatListDate(threeDaysAgo, now)).toBe(formatRelative(threeDaysAgo, now));
  });
});
