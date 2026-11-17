import { describe, expect, it } from 'vitest';
import { markdownToHtml } from '../src/utils/aboutBioMarkdown';

describe('About bio markdownToHtml links', () => {
  it('adds target, rel, and sr-only hint for external http(s) URLs', () => {
    const html = markdownToHtml('Read [Example](https://example.com) for more.');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('<span class="sr-only"> (opens in a new tab)</span>');
    expect(html).toMatch(/<a[^>]*>Example<span class="sr-only"> \(opens in a new tab\)<\/span><\/a>/);
  });

  it('omits target, rel, and sr-only hint for internal relative URLs', () => {
    const html = markdownToHtml('See [Writing](/writing) on this site.');
    expect(html).toContain('href="/writing"');
    expect(html).not.toContain('target="_blank"');
    expect(html).not.toContain('rel="noopener noreferrer"');
    expect(html).not.toContain('sr-only');
    expect(html).toMatch(/<a href="\/writing">Writing<\/a>/);
  });
});