import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const LEGACY_REDIRECTS = [
  { source: '/feed', destination: '/rss.xml' },
  { source: '/atom.xml', destination: '/rss.xml' },
  { source: '/blog', destination: '/writing' },
  { source: '/newsletter', destination: '/subscribe' },
  { source: '/resume', destination: '/cv' },
  { source: '/writing/tag', destination: '/writing' },
  { source: '/writing/tags', destination: '/writing' },
] as const;

describe('legacy guessable URL paths (vercel.json)', () => {
  const vercel = JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8'));

  it.each(LEGACY_REDIRECTS)(
    'redirects $source → $destination with 301',
  ({ source, destination }) => {
    const redirect = vercel.redirects?.find(
        (entry: { source?: string }) => entry.source === source,
    );
    expect(redirect).toMatchObject({
      destination,
      statusCode: 301,
    });
  });
});