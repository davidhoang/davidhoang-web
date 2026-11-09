import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SITE_DESCRIPTION, SITE_NAME } from '../src/utils/structuredData';

const publicDir = join(process.cwd(), 'public');
const mainLayout = readFileSync(join(process.cwd(), 'src/layouts/MainLayout.astro'), 'utf8');

describe('site.webmanifest', () => {
  const manifestPath = join(publicDir, 'site.webmanifest');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
    name: string;
    short_name: string;
    description: string;
    start_url: string;
    display: string;
    theme_color: string;
    background_color: string;
    icons: Array<{ src: string; sizes: string; type: string }>;
  };

  it('ships a static manifest beside existing favicons', () => {
    expect(existsSync(manifestPath)).toBe(true);
  });

  it('uses site metadata and default light background tokens', () => {
    expect(manifest.name).toBe(SITE_NAME);
    expect(manifest.short_name).toBe(SITE_NAME);
    expect(manifest.description).toBe(SITE_DESCRIPTION);
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toMatch(/^(browser|minimal-ui)$/);
    expect(manifest.theme_color).toBe('#ffffff');
    expect(manifest.background_color).toBe('#ffffff');
  });

  it('references only icon files that exist in public/', () => {
    for (const icon of manifest.icons) {
      const filePath = join(publicDir, icon.src.replace(/^\//, ''));
      expect(existsSync(filePath), icon.src).toBe(true);
    }
  });

  it('is linked from the shared layout head', () => {
    expect(mainLayout).toContain('<link rel="manifest" href="/site.webmanifest" />');
  });
});
