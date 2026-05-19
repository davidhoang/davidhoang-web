import { describe, it, expect } from 'vitest';
import { getTimeBucket, msUntilNextBucket, greetings } from '../src/utils/timeOfDay';

// Constructs a local Date at a given hour today
const at = (hour: number) => {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d;
};

describe('getTimeBucket', () => {
  it('returns night before 5am', () => {
    expect(getTimeBucket(at(0))).toBe('night');
    expect(getTimeBucket(at(4))).toBe('night');
  });

  it('returns morning at 5am up to 11:59', () => {
    expect(getTimeBucket(at(5))).toBe('morning');
    expect(getTimeBucket(at(11))).toBe('morning');
  });

  it('returns afternoon from 12 to 16:59', () => {
    expect(getTimeBucket(at(12))).toBe('afternoon');
    expect(getTimeBucket(at(16))).toBe('afternoon');
  });

  it('returns evening from 17 to 21:59', () => {
    expect(getTimeBucket(at(17))).toBe('evening');
    expect(getTimeBucket(at(21))).toBe('evening');
  });

  it('returns night from 22 onwards', () => {
    expect(getTimeBucket(at(22))).toBe('night');
    expect(getTimeBucket(at(23))).toBe('night');
  });
});

describe('msUntilNextBucket', () => {
  it('returns positive ms until the next boundary in every bucket', () => {
    for (const hour of [0, 4, 5, 11, 12, 16, 17, 21, 22, 23]) {
      const ms = msUntilNextBucket(at(hour));
      expect(ms).toBeGreaterThan(0);
    }
  });

  it('lands on the next boundary hour (5/12/17/22)', () => {
    const base = at(10); // morning
    const expected = at(12).getTime() - base.getTime();
    expect(msUntilNextBucket(base)).toBe(expected);
  });

  it('wraps to 5am next day during the late-night bucket', () => {
    const base = at(23);
    const next = new Date(base);
    next.setHours(29, 0, 0, 0); // JS overflow → 5am tomorrow
    expect(msUntilNextBucket(base)).toBe(next.getTime() - base.getTime());
  });
});

describe('greetings', () => {
  it('has a copy line for every bucket', () => {
    for (const bucket of ['morning', 'afternoon', 'evening', 'night'] as const) {
      expect(greetings[bucket]).toBeTruthy();
    }
  });
});
