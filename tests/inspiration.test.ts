import { describe, expect, it } from 'vitest';
import {
  INSPIRATION_BANK,
  TIME_PERIOD_ORDER,
  generateInspirationPrompt,
  getRandomInspiration,
  getRotatingTimePeriod,
  getTimePeriod,
  pickAvoidingRecent,
} from '../scripts/lib/inspiration.mjs';

describe('getRotatingTimePeriod', () => {
  it('cycles through the six periods by UTC date, not clock hour', () => {
    expect(getRotatingTimePeriod(new Date('2026-01-01T06:00:00Z'))).toBe('dawn');
    expect(getRotatingTimePeriod(new Date('2026-01-02T06:00:00Z'))).toBe('morning');
    expect(getRotatingTimePeriod(new Date('2026-01-03T06:00:00Z'))).toBe('afternoon');
    expect(getRotatingTimePeriod(new Date('2026-01-04T06:00:00Z'))).toBe('evening');
    expect(getRotatingTimePeriod(new Date('2026-01-05T06:00:00Z'))).toBe('night');
    expect(getRotatingTimePeriod(new Date('2026-01-06T06:00:00Z'))).toBe('lateNight');
    expect(getRotatingTimePeriod(new Date('2026-01-07T06:00:00Z'))).toBe('dawn');
  });

  it('does not lock the 6am UTC cron to dawn', () => {
    expect(getRotatingTimePeriod(new Date('2026-09-19T06:00:00Z'))).toBe('evening');
    expect(getRotatingTimePeriod(new Date('2026-09-19T23:59:00Z'))).toBe('evening');
  });
});

describe('getTimePeriod', () => {
  it('still maps wall-clock hours for ad-hoc local runs', () => {
    expect(getTimePeriod(6)).toBe('dawn');
    expect(getTimePeriod(15)).toBe('afternoon');
    expect(getTimePeriod(22)).toBe('night');
  });
});

describe('pickAvoidingRecent', () => {
  it('skips excluded items when others remain', () => {
    expect(pickAvoidingRecent(['a', 'b', 'c'], ['a', 'b'], undefined, () => 0)).toBe('c');
  });

  it('falls back to the full pool when everything is excluded', () => {
    expect(pickAvoidingRecent(['a', 'b'], ['a', 'b'], undefined, () => 0)).toBe('a');
  });

  it('returns null for an empty list', () => {
    expect(pickAvoidingRecent([])).toBeNull();
  });
});

describe('generateInspirationPrompt', () => {
  it('honors an explicit time period over the clock hour', () => {
    const result = generateInspirationPrompt({
      inspirationName: 'Swiss Modernism',
      hour: 6,
      timePeriod: 'night',
    });
    expect(result.timePeriod).toBe('night');
    expect(result.fullPrompt).toContain('TIME-OF-DAY INFLUENCE (night)');
    expect(TIME_PERIOD_ORDER).toContain(result.timePeriod);
  });

  it('avoids recently used inspirations when alternatives exist', () => {
    const allowed = 'Swiss Modernism';
    const excludeNames = INSPIRATION_BANK.map((item) => item.name).filter((name) => name !== allowed);
    const result = generateInspirationPrompt({ excludeNames });
    expect(result.inspirationName).toBe(allowed);
  });
});

describe('getRandomInspiration', () => {
  it('still returns items if every name is excluded', () => {
    const excludeNames = INSPIRATION_BANK.map((item) => item.name);
    expect(getRandomInspiration(1, excludeNames)[0]).toBeTruthy();
  });
});
