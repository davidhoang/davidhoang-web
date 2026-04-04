import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

export async function GET(context) {
  const allPosts = await getCollection('writing');

  const posts = (import.meta.env.PROD
    ? allPosts.filter((post) => !post.data.draft)
    : allPosts
  ).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const items = posts.map((post) => ({
    title: post.data.title,
    pubDate: post.data.pubDate,
    description: post.data.description,
    link: `/writing/${post.slug}/`,
    content: sanitizeHtml(md.render(post.body), {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    }),
    categories: ['writing', ...(post.data.tags || [])],
  }));

  return rss({
    title: 'David Hoang — Writing',
    description:
      'Essays and articles on design, technology, and building products. Notes live separately at /rss/notes.xml.',
    site: context.site,
    items,
    customData: [
      `<language>en-us</language>`,
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      `<atom:link href="${new URL('rss.xml', context.site)}" rel="self" type="application/rss+xml"/>`,
    ].join(''),
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
      content: 'http://purl.org/rss/1.0/modules/content/',
    },
    stylesheet: '/rss-styles.xsl',
  });
}
