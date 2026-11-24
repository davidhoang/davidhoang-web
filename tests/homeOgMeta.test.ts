import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HOME_OG_PREVIEW } from '../src/utils/ogVideo';

const distDir = join(process.cwd(), 'dist/client');

function metaContent(html: string, key: string): string | null {
  const re = new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`);
  return html.match(re)?.[1] ?? null;
}

describe('Homepage Open Graph image metadata (dist build)', () => {
  it('declares og:image dimensions that match the config talk poster', () => {
    const indexPath = join(distDir, 'index.html');
    if (!existsSync(indexPath)) return;

    const html = readFileSync(indexPath, 'utf8');
    expect(metaContent(html, 'og:image:width')).toBe(String(HOME_OG_PREVIEW.width));
    expect(metaContent(html, 'og:image:height')).toBe(String(HOME_OG_PREVIEW.height));
    expect(metaContent(html, 'og:image')).toContain('davidhoang-web-config-still.webp');
  });
});