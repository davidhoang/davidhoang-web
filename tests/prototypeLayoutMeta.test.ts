import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CANONICAL_SITE, DEFAULT_PAGE_ROBOTS } from '../src/utils/structuredData';

const distDir = join(process.cwd(), 'dist/client');

function readPrototypeHtml(relativePath: string): string | null {
  const filePath = join(distDir, relativePath);
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, 'utf8');
}

function metaContent(html: string, key: string): string | null {
  const re = new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`);
  return html.match(re)?.[1] ?? null;
}

describe('PrototypeLayout head metadata (dist build)', () => {
  it('emits robots and twitter:url on prototype pages', () => {
    const indexHtml = readPrototypeHtml('prototypes/index.html');
    const obductionHtml = readPrototypeHtml('prototypes/design-leadership-obduction/index.html');
    if (!indexHtml || !obductionHtml) return;

    for (const [html, canonical] of [
      [indexHtml, `${CANONICAL_SITE}/prototypes`],
      [obductionHtml, `${CANONICAL_SITE}/prototypes/design-leadership-obduction`],
    ] as const) {
      expect(metaContent(html, 'robots')).toBe(DEFAULT_PAGE_ROBOTS);
      expect(metaContent(html, 'twitter:url')).toBe(canonical);
      expect(metaContent(html, 'og:url')).toBe(canonical);
    }
  });
});
