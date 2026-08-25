import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { thesisReadingHref, thesisSections } from '../src/data/thesis';

const root = path.resolve(import.meta.dirname, '..');

describe('thesis hub data', () => {
  it('keeps reading lists short and complete', () => {
    expect(thesisSections.length).toBeGreaterThanOrEqual(4);
    for (const section of thesisSections) {
      expect(section.id).toBeTruthy();
      expect(section.title).toBeTruthy();
      expect(section.lede.length).toBeGreaterThan(40);
      expect(section.points.length).toBeGreaterThanOrEqual(2);
      expect(section.reading.length).toBeGreaterThanOrEqual(2);
      expect(section.reading.length).toBeLessThanOrEqual(4);
    }
  });

  it('resolves reading hrefs and points at real content', () => {
    for (const section of thesisSections) {
      for (const link of section.reading) {
        const href = thesisReadingHref(link);
        if (link.kind === 'external') {
          expect(href.startsWith('http')).toBe(true);
          continue;
        }
        expect(href).toBe(`/${link.kind}/${link.id}`);
        const file = path.join(root, 'src/content', link.kind, `${link.id}.md`);
        expect(existsSync(file), `missing ${file}`).toBe(true);
      }
    }
  });

  it('uses unique section ids', () => {
    const ids = thesisSections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
