import { describe, expect, it } from 'vitest';
import { getRssString } from '@astrojs/rss';
import {
  RSS_TRAILING_SLASH,
  rssLegacyGuidUrl,
  rssNoteItemPermalinks,
  rssWritingItemPermalinks,
} from '../src/utils/rssFeedItems';

const SITE = 'https://www.davidhoang.com';

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
});
