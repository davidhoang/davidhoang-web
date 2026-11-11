import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageTitle = 'David Hoang — Designer, Investor & Builder';

describe('homepage heading', () => {
  it('server-renders a single h1 because the visible hero title hydrates later', () => {
    const page = readFileSync('src/pages/index.astro', 'utf8');
    const hero = readFileSync('src/components/hero/HeroTitle.tsx', 'utf8');

    expect(page).toContain(`const pageTitle = '${pageTitle}';`);
    expect(page).toContain('<h1 class="sr-only">{pageTitle}</h1>');
    expect(page).not.toMatch(/<h1(?![^>]*sr-only)/);
    expect(hero).toContain('<motion.h2');
    expect(hero).not.toContain('<motion.h1');
  });
});
