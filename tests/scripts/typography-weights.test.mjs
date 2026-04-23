import { describe, expect, it } from 'vitest';
import {
  enforceHeadingHeavierThanBody,
  parseFontWeight,
} from '../../scripts/lib/typography-weights.mjs';

describe('parseFontWeight', () => {
  it('parses plain numeric strings and snaps to the 100 grid', () => {
    expect(parseFontWeight('400')).toBe(400);
    expect(parseFontWeight('450')).toBe(500);
    expect(parseFontWeight('449')).toBe(400);
  });

  it('extracts a weight-shaped token from noisy input', () => {
    expect(parseFontWeight('weight: 600 please')).toBe(600);
  });

  it('clamps into the 100-900 range', () => {
    expect(parseFontWeight('50')).toBe(100);
    expect(parseFontWeight('9999')).toBe(900);
  });

  it('returns null for empty or non-numeric input', () => {
    expect(parseFontWeight('')).toBeNull();
    expect(parseFontWeight(null)).toBeNull();
    expect(parseFontWeight(undefined)).toBeNull();
    expect(parseFontWeight('bold')).toBeNull();
  });
});

describe('enforceHeadingHeavierThanBody', () => {
  it('leaves a valid hierarchy untouched', () => {
    const t = { headingWeight: '700', bodyWeight: '400' };
    enforceHeadingHeavierThanBody(t);
    expect(t).toEqual({ headingWeight: '700', bodyWeight: '400' });
  });

  it('raises heading by 100 when it equals body', () => {
    const t = { headingWeight: '500', bodyWeight: '500' };
    enforceHeadingHeavierThanBody(t);
    expect(Number(t.headingWeight)).toBe(600);
    expect(Number(t.bodyWeight)).toBe(500);
  });

  it('raises heading when it is lighter than body', () => {
    const t = { headingWeight: '300', bodyWeight: '500' };
    enforceHeadingHeavierThanBody(t);
    expect(Number(t.headingWeight)).toBe(600);
  });

  it('lowers body when heading is already at the 900 ceiling', () => {
    const t = { headingWeight: '900', bodyWeight: '900' };
    enforceHeadingHeavierThanBody(t);
    expect(Number(t.headingWeight)).toBe(900);
    expect(Number(t.bodyWeight)).toBe(800);
  });

  it('uses defaults (600/400) when weights are missing or invalid', () => {
    const t = {};
    enforceHeadingHeavierThanBody(t);
    expect(t.headingWeight).toBe('600');
    expect(t.bodyWeight).toBe('400');
  });

  it('is a no-op for non-objects', () => {
    expect(() => enforceHeadingHeavierThanBody(null)).not.toThrow();
    expect(() => enforceHeadingHeavierThanBody(undefined)).not.toThrow();
  });
});
