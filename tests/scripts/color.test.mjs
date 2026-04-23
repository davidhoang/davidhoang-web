import { describe, expect, it } from 'vitest';
import { hexToHsl, hslToHex } from '../../scripts/lib/color.mjs';

describe('hexToHsl', () => {
  it('parses a 6-char hex with leading #', () => {
    expect(hexToHsl('#ffffff')).toEqual({ h: 0, s: 0, l: 100 });
    expect(hexToHsl('#000000')).toEqual({ h: 0, s: 0, l: 0 });
  });

  it('parses a 3-char shorthand by doubling each nibble', () => {
    const short = hexToHsl('#f00');
    const long = hexToHsl('#ff0000');
    expect(short).toEqual(long);
  });

  it('accepts hex without a leading #', () => {
    expect(hexToHsl('00ff00')).toEqual(hexToHsl('#00ff00'));
  });

  it('returns an achromatic grey (saturation 0) for grey inputs', () => {
    const grey = hexToHsl('#808080');
    expect(grey?.s).toBe(0);
  });

  it('computes plausible hue/saturation for pure red', () => {
    const red = hexToHsl('#ff0000');
    expect(red?.h).toBe(0);
    expect(red?.s).toBe(100);
    expect(red?.l).toBe(50);
  });

  it.each(['', '#', '#12', '#12345', 'zzzzzz', '#gghhii', null, undefined, 42])(
    'returns null for malformed input %p',
    (input) => {
      expect(hexToHsl(input)).toBeNull();
    },
  );
});

describe('hslToHex', () => {
  it('produces a 7-character lowercase #rrggbb value', () => {
    const out = hslToHex(0, 100, 50);
    expect(out).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('wraps hue modulo 360 and treats negatives symmetrically', () => {
    expect(hslToHex(360, 0, 50)).toBe(hslToHex(0, 0, 50));
    expect(hslToHex(-120, 50, 50)).toBe(hslToHex(240, 50, 50));
  });

  it('clamps out-of-range saturation and lightness', () => {
    expect(hslToHex(0, 150, 50)).toBe(hslToHex(0, 100, 50));
    expect(hslToHex(0, -30, 50)).toBe(hslToHex(0, 0, 50));
    expect(hslToHex(0, 50, 150)).toBe(hslToHex(0, 50, 100));
    expect(hslToHex(0, 50, -10)).toBe(hslToHex(0, 50, 0));
  });

  it('pads single-digit hex bytes to two characters', () => {
    // lightness low enough that r/g/b < 16 means the raw hex would be one char
    const out = hslToHex(0, 0, 1);
    expect(out).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('hexToHsl + hslToHex roundtrip', () => {
  it.each([
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#123456',
    '#abcdef',
    '#808080',
  ])('roundtrips %s within 1 rgb unit', (hex) => {
    const hsl = hexToHsl(hex);
    expect(hsl).not.toBeNull();
    const roundTripped = hslToHex(hsl.h, hsl.s, hsl.l);
    // Allow off-by-one from rounding on each channel
    const toRgb = (h) => [
      parseInt(h.slice(1, 3), 16),
      parseInt(h.slice(3, 5), 16),
      parseInt(h.slice(5, 7), 16),
    ];
    const [r1, g1, b1] = toRgb(hex);
    const [r2, g2, b2] = toRgb(roundTripped);
    expect(Math.abs(r1 - r2)).toBeLessThanOrEqual(1);
    expect(Math.abs(g1 - g2)).toBeLessThanOrEqual(1);
    expect(Math.abs(b1 - b2)).toBeLessThanOrEqual(1);
  });
});
