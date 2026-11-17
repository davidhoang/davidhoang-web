import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ABOUT_SOURCE = readFileSync(join(process.cwd(), 'src/pages/about.astro'), 'utf8');

describe('About bio markdown external links', () => {
  it('adds noopener and a screen-reader new-tab hint for external URLs', () => {
    expect(ABOUT_SOURCE).toContain('rel="noopener noreferrer"');
    expect(ABOUT_SOURCE).toContain('<span class="sr-only"> (opens in a new tab)</span>');
  });
});