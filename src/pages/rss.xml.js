import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const allPosts = await getCollection('writing');
  const allNotes = await getCollection('notes');

  const posts = (import.meta.env.PROD
    ? allPosts.filter((post) => !post.data.draft)
    : allPosts
  );

  const notes = (import.meta.env.PROD
    ? allNotes.filter((note) => !note.data.draft)
    : allNotes
  );

  const items = [
    ...posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/writing/${post.slug}/`,
    })),
    ...notes.map((note) => ({
      title: note.data.title,
      pubDate: note.data.pubDate,
      description: note.data.description || `A note on ${note.data.title}`,
      link: `/notes/${note.slug}/`,
    })),
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: 'David Hoang',
    description: 'Writing about design, technology, and building products.',
    site: context.site,
    items,
    customData: `<language>en-us</language>`,
  });
}
