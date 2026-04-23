import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { filterDraftsInProd, filterByTag, sortByPubDateDesc } from '../../../utils/rss-helpers.ts';

const md = new MarkdownIt();

export async function getStaticPaths() {
  const allPosts = await getCollection('writing');

  const allTags = new Set();
  allPosts.forEach((post) =>
    (post.data.tags || []).forEach((tag) => allTags.add(tag))
  );

  return [...allTags].map((tag) => ({ params: { tag } }));
}

export async function GET(context) {
  const { tag } = context.params;

  const allPosts = await getCollection('writing');

  const posts = sortByPubDateDesc(
    filterByTag(filterDraftsInProd(allPosts, import.meta.env.PROD), tag),
  );

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
    title: `David Hoang — Writing — ${tag}`,
    description: `Writing tagged “${tag}”. For notes, use /rss/notes.xml.`,
    site: context.site,
    items,
    customData: [
      `<language>en-us</language>`,
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      `<atom:link href="${new URL(`rss/tag/${tag}.xml`, context.site)}" rel="self" type="application/rss+xml"/>`,
    ].join(''),
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
      content: 'http://purl.org/rss/1.0/modules/content/',
    },
    stylesheet: '/rss-styles.xsl',
  });
}
