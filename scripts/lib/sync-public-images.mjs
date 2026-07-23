/**
 * Mirror src/assets/images → public/images.
 *
 * Source of truth is src/assets/images (Astro imports, remark upgrades,
 * optimize-images). public/images is generated so /images/... URLs keep working
 * for markdown, CSS backgrounds, and React cards.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../..');

export const ASSETS_IMAGES_DIR = join(rootDir, 'src/assets/images');
export const PUBLIC_IMAGES_DIR = join(rootDir, 'public/images');

const PRESERVE_IN_PUBLIC = new Set(['README.md']);

/**
 * @param {{ clean?: boolean }} [options]
 * @returns {{ copied: boolean, source: string, dest: string }}
 */
export function syncPublicImages({ clean = true } = {}) {
  if (!existsSync(ASSETS_IMAGES_DIR)) {
    return { copied: false, source: ASSETS_IMAGES_DIR, dest: PUBLIC_IMAGES_DIR };
  }

  mkdirSync(PUBLIC_IMAGES_DIR, { recursive: true });

  if (clean) {
    for (const entry of readdirSync(PUBLIC_IMAGES_DIR, { withFileTypes: true })) {
      if (PRESERVE_IN_PUBLIC.has(entry.name)) continue;
      rmSync(join(PUBLIC_IMAGES_DIR, entry.name), { recursive: true, force: true });
    }
  }

  cpSync(ASSETS_IMAGES_DIR, PUBLIC_IMAGES_DIR, { recursive: true, force: true });

  return { copied: true, source: ASSETS_IMAGES_DIR, dest: PUBLIC_IMAGES_DIR };
}
