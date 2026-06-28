import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseOpenGraphFromHtml } from '../src/utils/openGraph';
import { resolveFeaturedMedia } from '../src/utils/featuredMedia';

describe('parseOpenGraphFromHtml', () => {
  it('reads og:title, og:description, og:image', () => {
    const html = `
      <html><head>
        <meta property="og:title" content="Hello"/>
        <meta property="og:description" content="A short description."/>
        <meta property="og:image" content="https://example.com/cover.png"/>
      </head></html>`;
    const og = parseOpenGraphFromHtml(html);
    expect(og.title).toBe('Hello');
    expect(og.description).toBe('A short description.');
    expect(og.image).toBe('https://example.com/cover.png');
  });

  it('falls back to twitter:* when og:* is missing', () => {
    const html = `
      <meta name="twitter:title" content="TW title">
      <meta name="twitter:description" content="TW description">
      <meta name="twitter:image" content="https://example.com/tw.png">`;
    const og = parseOpenGraphFromHtml(html);
    expect(og.title).toBe('TW title');
    expect(og.description).toBe('TW description');
    expect(og.image).toBe('https://example.com/tw.png');
  });

  it('falls back to <title> and name="description" as last resort', () => {
    const html = `
      <html><head>
        <title>Plain title</title>
        <meta name="description" content="Plain desc">
      </head></html>`;
    const og = parseOpenGraphFromHtml(html);
    expect(og.title).toBe('Plain title');
    expect(og.description).toBe('Plain desc');
    expect(og.image).toBeNull();
  });

  it('prefers og:* over twitter:* over <title>', () => {
    const html = `
      <title>From title tag</title>
      <meta property="og:title" content="From OG">
      <meta name="twitter:title" content="From Twitter">`;
    const og = parseOpenGraphFromHtml(html);
    expect(og.title).toBe('From OG');
  });

  it('handles meta tags with attributes in reverse order', () => {
    const html = `<meta content="Reverse" property="og:title">`;
    expect(parseOpenGraphFromHtml(html).title).toBe('Reverse');
  });

  it('decodes named HTML entities', () => {
    const html = `<meta property="og:title" content="Tom &amp; Jerry &lt;3">`;
    expect(parseOpenGraphFromHtml(html).title).toBe('Tom & Jerry <3');
  });

  it('decodes numeric HTML entities', () => {
    const html = `<meta property="og:title" content="It&#39;s here">`;
    expect(parseOpenGraphFromHtml(html).title).toBe("It's here");
  });

  it('decodes hex HTML entities', () => {
    const html = `<meta property="og:title" content="It&#x27;s here">`;
    expect(parseOpenGraphFromHtml(html).title).toBe("It's here");
  });

  it('returns empty defaults for HTML with no meta', () => {
    const og = parseOpenGraphFromHtml('<html><body>nothing</body></html>');
    expect(og.title).toBe('');
    expect(og.description).toBe('');
    expect(og.image).toBeNull();
  });
});

describe('resolveFeaturedMedia', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('truncates descriptions longer than 280 chars with an ellipsis', async () => {
    const long = 'a'.repeat(400);
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(`<meta property="og:description" content="${long}">`, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    );
    const [resolved] = await resolveFeaturedMedia([
      {
        url: 'https://example.com/post',
        kicker: 'Article',
        fallbackTitle: 'Fallback title here',
        fallbackDescription: 'Fallback desc',
      },
    ]);
    expect(resolved.description.length).toBeLessThanOrEqual(280);
    expect(resolved.description.endsWith('…')).toBe(true);
  });

  it('uses fallback title when og:title is too terse (≤2 words) and fallback has ≥4 words', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(`<meta property="og:title" content="My Site">`, {
        status: 200,
      }),
    );
    const [resolved] = await resolveFeaturedMedia([
      {
        url: 'https://example.com/post',
        kicker: 'Article',
        fallbackTitle: 'A specific article title here',
        fallbackDescription: 'Fallback desc',
      },
    ]);
    expect(resolved.title).toBe('A specific article title here');
  });

  it('keeps og:title when it is substantive', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(`<meta property="og:title" content="A long enough og title">`, {
        status: 200,
      }),
    );
    const [resolved] = await resolveFeaturedMedia([
      {
        url: 'https://example.com/post',
        kicker: 'Article',
        fallbackTitle: 'Some fallback',
        fallbackDescription: 'd',
      },
    ]);
    expect(resolved.title).toBe('A long enough og title');
  });

  it('extracts a clean hostname, stripping leading www.', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('<html></html>', { status: 200 }),
    );
    const [resolved] = await resolveFeaturedMedia([
      {
        url: 'https://www.example.com/article',
        kicker: 'Article',
        fallbackTitle: 'Title',
        fallbackDescription: 'd',
      },
    ]);
    expect(resolved.hostname).toBe('example.com');
  });

  it('falls back gracefully when fetch throws', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'));
    const [resolved] = await resolveFeaturedMedia([
      {
        url: 'https://example.com/post',
        kicker: 'Article',
        fallbackTitle: 'Fallback title here',
        fallbackDescription: 'Fallback desc',
      },
    ]);
    expect(resolved.title).toBe('Fallback title here');
    expect(resolved.description).toBe('Fallback desc');
    expect(resolved.image).toBeNull();
  });

  it('never resolves an image (cards are text-only)', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        `<meta property="og:image" content="https://example.com/img.png">`,
        { status: 200 },
      ),
    );
    const [resolved] = await resolveFeaturedMedia([
      {
        url: 'https://example.com/post',
        kicker: 'Article',
        fallbackTitle: 'Title',
        fallbackDescription: 'd',
        fallbackImage: 'https://example.com/fallback.png',
      },
    ]);
    expect(resolved.image).toBeNull();
  });
});
