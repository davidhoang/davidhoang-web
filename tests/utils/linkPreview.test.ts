import { describe, expect, it } from 'vitest';
import { parseOpenGraphFromHtml } from '../../src/utils/linkPreview';

describe('parseOpenGraphFromHtml', () => {
  it('reads og:title, og:description, og:image', () => {
    const html = `
      <html><head>
        <meta property="og:title" content="Example" />
        <meta property="og:description" content="A description" />
        <meta property="og:image" content="https://example.com/cover.png" />
      </head></html>
    `;
    expect(parseOpenGraphFromHtml(html)).toEqual({
      title: 'Example',
      description: 'A description',
      image: 'https://example.com/cover.png',
    });
  });

  it('handles the content attribute appearing before property', () => {
    const html = `<meta content="Hi" property="og:title" />`;
    expect(parseOpenGraphFromHtml(html).title).toBe('Hi');
  });

  it('falls back to twitter:* when og:* is absent', () => {
    const html = `
      <meta name="twitter:title" content="Twitter Title" />
      <meta name="twitter:description" content="Twitter desc" />
      <meta name="twitter:image" content="https://example.com/tw.png" />
    `;
    expect(parseOpenGraphFromHtml(html)).toEqual({
      title: 'Twitter Title',
      description: 'Twitter desc',
      image: 'https://example.com/tw.png',
    });
  });

  it('falls back to <title> and <meta name="description"> last', () => {
    const html = `
      <title>Plain title</title>
      <meta name="description" content="Plain description" />
    `;
    const og = parseOpenGraphFromHtml(html);
    expect(og.title).toBe('Plain title');
    expect(og.description).toBe('Plain description');
    expect(og.image).toBeNull();
  });

  it('decodes common HTML entities in values', () => {
    const html = `<meta property="og:title" content="Tom &amp; Jerry &#8212; Episode 1" />`;
    expect(parseOpenGraphFromHtml(html).title).toBe('Tom & Jerry — Episode 1');
  });

  it('returns empty strings and null image when nothing is found', () => {
    expect(parseOpenGraphFromHtml('<html></html>')).toEqual({
      title: '',
      description: '',
      image: null,
    });
  });

  it('is case-insensitive on meta attributes', () => {
    const html = `<META PROPERTY="og:title" CONTENT="Shouting" />`;
    expect(parseOpenGraphFromHtml(html).title).toBe('Shouting');
  });
});
