import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { RSS_TRAILING_SLASH, rssWritingItemPermalinks } from '../../utils/rssFeedItems';

const md = new MarkdownIt();

export async function GET(context) {
  const allPosts = await getCollection('writing');
  const posts = (import.meta.env.PROD
    ? allPosts.filter((post) => !post.data.draft)
    : allPosts
  ).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: 'David Hoang — Writing',
    description: 'Essays and articles on design, technology, and building products.',
    site: context.site,
    trailingSlash: RSS_TRAILING_SLASH,
    items: posts.map((post) => ({
      ...rssWritingItemPermalinks(context.site, post.id),
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      content: sanitizeHtml(md.render(post.body), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      }),
      categories: ['writing', ...(post.data.tags || [])],
    })),
    customData: [
      `<language>en-us</language>`,
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      `<atom:link href="${new URL('rss/writing.xml', context.site)}" rel="self" type="application/rss+xml"/>`,
    ].join(''),
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
      content: 'http://purl.org/rss/1.0/modules/content/',
    },
    stylesheet: '/rss-styles.xsl',
  });
}
