import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('ContentsNav markup', () => {
  it('uses a nav landmark without redundant role on aside', () => {
    const source = readFileSync('src/components/ContentsNav.astro', 'utf8');
    expect(source).toMatch(/<nav class="contents-nav" aria-label=/);
    expect(source).not.toMatch(/role="navigation"/);
    expect(source).not.toMatch(/<aside class="contents-nav"/);
  });
});
