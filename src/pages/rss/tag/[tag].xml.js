import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

export async function getStaticPaths() {
  const allPosts = await getCollection('writing');
  const allNotes = await getCollection('notes');

  const allTags = new Set();
  allPosts.forEach(post => (post.data.tags || []).forEach(tag => allTags.add(tag)));
  allNotes.forEach(note => (note.data.tags || []).forEach(tag => allTags.add(tag)));

  return [...allTags].map(tag => ({ params: { tag } }));
}

export async function GET(context) {
  const { tag } = context.params;

  const allPosts = await getCollection('writing');
  const allNotes = await getCollection('notes');

  const posts = (import.meta.env.PROD
    ? allPosts.filter((post) => !post.data.draft)
    : allPosts
  ).filter(post => (post.data.tags || []).includes(tag));

  const notes = (import.meta.env.PROD
    ? allNotes.filter((note) => !note.data.draft)
    : allNotes
  ).filter(note => (note.data.tags || []).includes(tag));

  const items = [
    ...posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/writing/${post.slug}/`,
      content: sanitizeHtml(md.render(post.body), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      }),
      categories: ['writing', ...(post.data.tags || [])],
    })),
    ...notes.map((note) => ({
      title: note.data.title,
      pubDate: note.data.pubDate,
      description: note.data.description || `A note on ${note.data.title}`,
      link: `/notes/${note.slug}/`,
      content: sanitizeHtml(md.render(note.body), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      }),
      categories: ['notes', ...(note.data.tags || [])],
    })),
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: `David Hoang — ${tag}`,
    description: `Writing and notes tagged "${tag}".`,
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
