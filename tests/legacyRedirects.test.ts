import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const LEGACY_REDIRECTS = [
  { source: '/rss/notes', destination: '/rss/notes.xml' },
  { source: '/rss/writing', destination: '/rss/writing.xml' },
  { source: '/rss/tag/:tag', destination: '/rss/tag/:tag.xml' },
  { source: '/feed', destination: '/rss.xml' },
  { source: '/feed.xml', destination: '/rss.xml' },
  { source: '/atom.xml', destination: '/rss.xml' },
  { source: '/notes.xml', destination: '/rss/notes.xml' },
  { source: '/blog', destination: '/writing' },
  { source: '/newsletter', destination: '/subscribe' },
  { source: '/resume', destination: '/cv' },
  { source: '/writing/tag', destination: '/writing' },
  { source: '/writing/tags', destination: '/writing' },
  {
    source: '/writing/optimizing-a-personal-website-for-ai-agents',
    destination: '/writing/optimizing-for-agents',
  },
  { source: '/about.md', destination: '/bio.md' },
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