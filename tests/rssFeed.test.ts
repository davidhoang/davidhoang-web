import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getRssString } from '@astrojs/rss';
import { rssEntriesForFeed } from '../src/utils/rssFeed';
import {
  RSS_TRAILING_SLASH,
  rssLegacyGuidUrl,
  rssNoteItemPermalinks,
  rssWritingItemPermalinks,
} from '../src/utils/rssFeedItems';
import {
  loadNoteEntriesFromDisk,
  loadWritingEntriesFromDisk,
} from './helpers/contentEntriesFromDisk';

const SITE = 'https://www.davidhoang.com';

/** Stable legacy guids — do not change without a deliberate subscriber migration (see PR #234). */
const LEGACY_WRITING_GUIDS: Record<string, string> = {
  'design-engineering': `${SITE}/writing/design-engineering/`,
  'optimizing-for-agents': `${SITE}/writing/optimizing-for-agents/`,
};

function parseRssItems(xml: string) {
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((match) => match[1]);
  return blocks.map((block) => {
    const readTag = (name: string) => block.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`))?.[1];
    const guid = block.match(/<guid[\s\S]*?<\/guid>/)?.[0] ?? '';
    return {
      title: readTag('title') ?? '',
      link: readTag('link') ?? '',
      guid,
      description: readTag('description') ?? '',
      pubDate: readTag('pubDate') ?? '',
    };
  });
}

describe('rssFeedItems', () => {
  it('builds slash-less link paths and legacy slash guids', () => {
    const writing = rssWritingItemPermalinks(SITE, 'design-engineering');
    expect(writing.link).toBe('/writing/design-engineering');
    expect(writing.customData).toBe(
      `<guid isPermaLink="true">${SITE}/writing/design-engineering/</guid>`,
    );

    const note = rssNoteItemPermalinks(SITE, 'agent-experience');
    expect(note.link).toBe('/notes/agent-experience');
    expect(note.customData).toContain(`${SITE}/notes/agent-experience/`);
  });

  it('rssLegacyGuidUrl matches live feed guid shape', () => {
    expect(rssLegacyGuidUrl(SITE, '/writing/optimizing-for-agents')).toBe(
      `${SITE}/writing/optimizing-for-agents/`,
    );
  });
});

describe('rssEntriesForFeed', () => {
  it('drops drafts in production mode and keeps them in dev', () => {
    const entries = [
      { id: 'a', data: { draft: false, pubDate: new Date('2026-01-02') } },
      { id: 'b', data: { draft: true, pubDate: new Date('2026-01-03') } },
    ];
    expect(rssEntriesForFeed(entries, { production: true }).map((e) => e.id)).toEqual(['a']);
    expect(rssEntriesForFeed(entries, { production: false }).map((e) => e.id)).toEqual(['b', 'a']);
  });
});

describe('RSS feed output', () => {
  it('item links have no trailing slash; guids keep legacy trailing slash', async () => {
    const { link, customData } = rssWritingItemPermalinks(SITE, 'sample-post');
    const xml = await getRssString({
      title: 'Test',
      description: 'Test feed',
      site: SITE,
      trailingSlash: RSS_TRAILING_SLASH,
      items: [
        {
          title: 'Sample',
          description: 'Sample item',
          pubDate: new Date('2026-01-01T00:00:00Z'),
          link,
          customData,
        },
      ],
    });

    expect(xml).toContain(`<link>${SITE}/writing/sample-post</link>`);
    expect(xml).toContain(
      `<guid isPermaLink="true">${SITE}/writing/sample-post/</guid>`,
    );
    expect(xml).not.toContain(`${SITE}/writing/sample-post/</link>`);
  });

  it('escapes HTML in titles and descriptions', async () => {
    const { link, customData } = rssWritingItemPermalinks(SITE, 'escaped-post');
    const xml = await getRssString({
      title: 'Test',
      description: 'Test feed',
      site: SITE,
      trailingSlash: RSS_TRAILING_SLASH,
      items: [
        {
          title: 'Hello & "World" <script>',
          description: 'Tom & Jerry\'s "RSS"',
          pubDate: new Date('2026-01-01T00:00:00Z'),
          link,
          customData,
        },
      ],
    });

    expect(xml).toContain('<title>Hello &amp; &quot;World&quot; &lt;script&gt;</title>');
    expect(xml).toContain('<description>Tom &amp; Jerry&apos;s &quot;RSS&quot;</description>');
    expect(xml).not.toContain('<script>');
  });

  it('builds a production writing feed with 24 published items, sorted newest-first', async () => {
    const posts = rssEntriesForFeed(loadWritingEntriesFromDisk(), { production: true });
    expect(posts).toHaveLength(24);
    expect(posts.some((post) => post.data.draft)).toBe(false);

    const items = posts.map((post) => ({
      ...rssWritingItemPermalinks(SITE, post.id),
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
    }));

    const xml = await getRssString({
      title: 'David Hoang — Writing',
      description: 'Essays',
      site: SITE,
      trailingSlash: RSS_TRAILING_SLASH,
      items,
      stylesheet: '/rss-styles.xsl',
    });

    expect(xml).toContain('href="/rss-styles.xsl"');
    const parsed = parseRssItems(xml);
    expect(parsed).toHaveLength(24);

    for (const item of parsed) {
      expect(item.link).toMatch(new RegExp(`^${SITE.replace(/\./g, '\\.')}/writing/[^/]+$`));
      expect(item.link.endsWith('/')).toBe(false);
      expect(item.guid).toMatch(
        new RegExp(`^<guid isPermaLink="true">${SITE.replace(/\./g, '\\.')}/writing/[^/]+/</guid>$`),
      );
      expect(Date.parse(item.pubDate)).not.toBeNaN();
    }

    const timestamps = parsed.map((item) => Date.parse(item.pubDate));
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeLessThanOrEqual(timestamps[i - 1]);
    }

    for (const [slug, guidUrl] of Object.entries(LEGACY_WRITING_GUIDS)) {
      const item = parsed.find((entry) => entry.link.endsWith(`/writing/${slug}`));
      expect(item?.guid).toBe(`<guid isPermaLink="true">${guidUrl}</guid>`);
    }
  });

  it('notes feed uses absolute slash-less links and legacy guids', async () => {
    const notes = rssEntriesForFeed(loadNoteEntriesFromDisk(), { production: true });
    expect(notes.length).toBeGreaterThan(0);

    const xml = await getRssString({
      title: 'David Hoang — Notes',
      description: 'Notes',
      site: SITE,
      trailingSlash: RSS_TRAILING_SLASH,
      items: notes.slice(0, 5).map((note) => ({
        ...rssNoteItemPermalinks(SITE, note.id),
        title: note.data.title,
        description: note.data.description,
        pubDate: note.data.pubDate,
      })),
      stylesheet: '/rss-styles.xsl',
    });

    expect(xml).toContain('href="/rss-styles.xsl"');
    for (const item of parseRssItems(xml)) {
      expect(item.link.startsWith(`${SITE}/notes/`)).toBe(true);
      expect(item.link.endsWith('/')).toBe(false);
      expect(item.guid).toContain(`${item.link}/</guid>`);
    }
  });

  it('ships the RSS XSL stylesheet in public/', () => {
    const xsl = readFileSync(join(process.cwd(), 'public/rss-styles.xsl'), 'utf8');
    expect(xsl).toContain('<xsl:stylesheet');
    expect(xsl).toContain('rss/channel');
  });
});
