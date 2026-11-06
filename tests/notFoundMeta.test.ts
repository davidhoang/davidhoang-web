import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readFileSync as readSource } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('404 page SEO', () => {
  it('declares noindex so soft-404 URLs are not indexed', () => {
    const source = readSource(join(process.cwd(), 'src/pages/404.astro'), 'utf8');
    expect(source).toMatch(/robots="noindex,\s*follow"/);
  });

  it('reveals cmd-hint with transform-only motion so muted text keeps full contrast (PCD-192)', () => {
    const source = readSource(join(process.cwd(), 'src/pages/404.astro'), 'utf8');
    expect(source).toMatch(/@keyframes cmdHintReveal/);
    expect(source).not.toMatch(/\.cmd-hint[\s\S]*?animation:\s*fadeUp/);
    expect(source).toMatch(/\.cmd-hint[\s\S]*?opacity:\s*1/);
  });

  it('emits noindex in built HTML when dist/ exists', () => {
    const htmlPath = join(process.cwd(), 'dist/client/404.html');
    if (!existsSync(htmlPath)) {
      return;
    }
    const html = readFileSync(htmlPath, 'utf8');
    expect(html).toMatch(/<meta name="robots" content="noindex, follow"\s*\/?>/);
  });
});
