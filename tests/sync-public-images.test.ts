import { describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * After sync, every source file exists under public/images and README.md is preserved.
 */
describe('syncPublicImages', () => {
  it('mirrors assets into public and keeps README.md', async () => {
    const { syncPublicImages, ASSETS_IMAGES_DIR, PUBLIC_IMAGES_DIR } = await import(
      '../scripts/lib/sync-public-images.mjs'
    );

    expect(existsSync(ASSETS_IMAGES_DIR)).toBe(true);

    mkdirSync(PUBLIC_IMAGES_DIR, { recursive: true });
    writeFileSync(join(PUBLIC_IMAGES_DIR, 'README.md'), '# Generated image mirror\n', 'utf8');
    writeFileSync(join(PUBLIC_IMAGES_DIR, 'stale-should-be-removed.webp'), 'stale', 'utf8');

    const result = syncPublicImages();
    expect(result.copied).toBe(true);
    expect(existsSync(join(PUBLIC_IMAGES_DIR, 'README.md'))).toBe(true);
    expect(existsSync(join(PUBLIC_IMAGES_DIR, 'stale-should-be-removed.webp'))).toBe(false);
    expect(existsSync(join(PUBLIC_IMAGES_DIR, 'img-dh.webp'))).toBe(true);
    expect(readFileSync(join(PUBLIC_IMAGES_DIR, 'README.md'), 'utf8')).toContain('Generated');
  });
});
