import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, statSync } from 'fs';
import { extname, join } from 'path';

const ROOT = join(process.cwd(), 'src/assets');
const CANONICAL_DIR = join(ROOT, 'images');
const LEGACY_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

function walk(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, files);
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

describe('legacy image sources (PC-35)', () => {
  it('keeps raster sources under src/assets/images only', () => {
    const legacy = walk(ROOT).filter((file) => {
      if (file.startsWith(CANONICAL_DIR)) return false;
      return LEGACY_EXTENSIONS.has(extname(file).toLowerCase());
    });

    expect(legacy).toEqual([]);
  });

  it('provides matilda avatar WebP referenced by career odyssey', () => {
    const avatar = join(CANONICAL_DIR, 'people/img-matilda-dackevall.webp');
    expect(existsSync(avatar)).toBe(true);
    expect(statSync(avatar).size).toBeLessThan(50 * 1024);
  });

  it('uses WebP for large portrait assets', () => {
    for (const name of ['img-david-now.webp', 'img-dh.webp']) {
      const file = join(CANONICAL_DIR, name);
      expect(existsSync(file)).toBe(true);
      expect(statSync(file).size).toBeLessThan(250 * 1024);
    }
  });
});
