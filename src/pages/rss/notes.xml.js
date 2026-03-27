import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

export async function GET(context) {
  const allNotes = await getCollection('notes');
  const notes = (import.meta.env.PROD
    ? allNotes.filter((note) => !note.data.draft)
    : allNotes
  ).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: 'David Hoang — Notes',
    description: 'Digital garden notes on design, AI, and building products.',
    site: context.site,
    items: notes.map((note) => ({
      title: note.data.title,
      pubDate: note.data.pubDate,
      description: note.data.description || `A note on ${note.data.title}`,
      link: `/notes/${note.slug}/`,
      content: sanitizeHtml(md.render(note.body), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      }),
      categories: ['notes', ...(note.data.tags || [])],
    })),
    customData: [
      `<language>en-us</language>`,
      `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      `<atom:link href="${new URL('rss/notes.xml', context.site)}" rel="self" type="application/rss+xml"/>`,
    ].join(''),
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
      content: 'http://purl.org/rss/1.0/modules/content/',
    },
    stylesheet: '/rss-styles.xsl',
  });
}
