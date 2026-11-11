import { describe, expect, it } from 'vitest';
import {
  WRITING_COVER_DITHER_TYPES,
  WRITING_COVER_SHAPES,
  getWritingCoverArt,
  hashWritingCoverSeed,
} from '../src/utils/writingCoverArt';

const seeds = [
  'optimizing-for-agents',
  'ecosystem-design',
  'the-obsession-over-craft',
  '40-things-i-learned-in-40-years',
  'crafting-a-leadership-portfolio',
  'designs-seat-at-the-cap-table-part-i',
  'designs-seat-at-the-cap-table-part-ii',
  'tech-is-going-through-a-factory-reset-moment',
  '',
];

describe('hashWritingCoverSeed', () => {
  it('is a stable unsigned 32-bit hash', () => {
    expect(hashWritingCoverSeed('')).toBe(2166136261);
    expect(hashWritingCoverSeed('a')).toBe(0xe40c292c);
    for (const seed of seeds) {
      const hash = hashWritingCoverSeed(seed);
      expect(Number.isInteger(hash)).toBe(true);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThanOrEqual(0xffffffff);
    }
  });
});

describe('getWritingCoverArt', () => {
  it('returns the same art for the same post', () => {
    for (const seed of seeds) {
      expect(getWritingCoverArt(seed)).toEqual(getWritingCoverArt(seed));
    }
  });

  it('keeps every param inside the range the shader is tuned for', () => {
    for (const seed of seeds) {
      const art = getWritingCoverArt(seed);
      expect(WRITING_COVER_SHAPES).toContain(art.shape);
      expect(WRITING_COVER_DITHER_TYPES).toContain(art.type);
      expect(art.size).toBeGreaterThanOrEqual(2);
      expect(art.size).toBeLessThanOrEqual(3.2);
      expect(art.scale).toBeGreaterThanOrEqual(0.85);
      expect(art.scale).toBeLessThanOrEqual(1.5);
      expect(art.rotation).toBeGreaterThanOrEqual(0);
      expect(art.rotation).toBeLessThanOrEqual(360);
      expect(Math.abs(art.offsetX)).toBeLessThanOrEqual(0.25);
      expect(Math.abs(art.offsetY)).toBeLessThanOrEqual(0.25);
      expect(art.frame).toBeGreaterThanOrEqual(0);
      expect(art.frame).toBeLessThanOrEqual(40000);
    }
  });

  it('gives different posts different art', () => {
    const unique = new Set(seeds.map((seed) => JSON.stringify(getWritingCoverArt(seed))));
    expect(unique.size).toBe(seeds.length);
  });
});
