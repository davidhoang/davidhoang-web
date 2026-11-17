import { describe, expect, it } from 'vitest';
import { serializeDocumentTitle } from '../src/utils/documentTitle';

describe('serializeDocumentTitle', () => {
  it('keeps apostrophes literal (no &#39;)', () => {
    expect(serializeDocumentTitle("Jodorowsky's Product Roadmap — David Hoang")).toBe(
      "Jodorowsky's Product Roadmap — David Hoang",
    );
  });

  it('escapes unsafe HTML characters', () => {
    expect(serializeDocumentTitle('Tom & Jerry <3>')).toBe('Tom &amp; Jerry &lt;3&gt;');
  });
});