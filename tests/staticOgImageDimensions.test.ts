import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const distDir = join(process.cwd(), 'dist/client');

function metaContent(html: string, key: string): string | null {
  const re = new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`);
  return html.match(re)?.[1] ?? null;
}

describe('Static Open Graph image dimensions (dist build)', () => {
  it('declares actual pixel size for writing posts with cover art', () => {
    const htmlPath = join(distDir, 'writing/choosing-a-company/index.html');
    if (!existsSync(htmlPath)) return;

    const html = readFileSync(htmlPath, 'utf8');
    expect(metaContent(html, 'og:image')).toContain('img-2023-01-05-choosing-company.webp');
    expect(metaContent(html, 'og:image:width')).toBe('1280');
    expect(metaContent(html, 'og:image:height')).toBe('720');
  });

  it('still uses 1200×630 for generated /api/og cards', () => {
    const htmlPath = join(distDir, 'cv/index.html');
    if (!existsSync(htmlPath)) return;

    const html = readFileSync(htmlPath, 'utf8');
    expect(metaContent(html, 'og:image')).toContain('/api/og');
    expect(metaContent(html, 'og:image:width')).toBe('1200');
    expect(metaContent(html, 'og:image:height')).toBe('630');
  });
});