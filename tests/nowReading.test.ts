import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nowReading, nowReadingHref } from '../src/data/nowReading';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('nowReading', () => {
  it('keeps a short curated list', () => {
    expect(nowReading.length).toBeGreaterThanOrEqual(2);
    expect(nowReading.length).toBeLessThanOrEqual(6);
  });

  it('resolves hrefs and points at real content', () => {
    for (const item of nowReading) {
      const href = nowReadingHref(item);
      if (item.kind === 'external') {
        expect(href.startsWith('http')).toBe(true);
        continue;
      }
      expect(href).toBe(`/${item.kind}/${item.id}`);
      const file = path.join(root, 'src/content', item.kind, `${item.id}.md`);
      expect(existsSync(file), `missing ${file}`).toBe(true);
    }
  });
});
