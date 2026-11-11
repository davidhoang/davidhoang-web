/**
 * Deterministic art direction for generated writing covers. Each post slug maps
 * to one stable set of Paper dithering shader params, so a post looks the same
 * on the index, tag pages, and its own hero.
 */

export const WRITING_COVER_SHAPES = ['warp', 'simplex', 'wave', 'ripple', 'swirl'] as const;
export const WRITING_COVER_DITHER_TYPES = ['4x4', '8x8'] as const;

export type WritingCoverShape = (typeof WRITING_COVER_SHAPES)[number];
export type WritingCoverDitherType = (typeof WRITING_COVER_DITHER_TYPES)[number];

export interface WritingCoverArt {
  shape: WritingCoverShape;
  type: WritingCoverDitherType;
  /** Dither cell size in px */
  size: number;
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
  /** Starting animation frame (ms) so static covers differ within one shape */
  frame: number;
}

/** FNV-1a 32-bit */
export function hashWritingCoverSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(state: number): () => number {
  let a = state;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round(value: number, places: number): number {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

export function getWritingCoverArt(seed: string): WritingCoverArt {
  const next = mulberry32(hashWritingCoverSeed(seed));
  const pick = <T,>(items: readonly T[]): T => items[Math.floor(next() * items.length)];
  const range = (min: number, max: number) => min + next() * (max - min);

  return {
    shape: pick(WRITING_COVER_SHAPES),
    type: pick(WRITING_COVER_DITHER_TYPES),
    size: round(range(2, 3.2), 1),
    scale: round(range(0.85, 1.5), 2),
    rotation: Math.round(range(0, 360)),
    offsetX: round(range(-0.25, 0.25), 2),
    offsetY: round(range(-0.25, 0.25), 2),
    frame: Math.round(range(0, 40000)),
  };
}
