import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const allPosts = await getCollection('writing');
  // Filter out drafts in production, but show them in development
  const posts = (import.meta.env.PROD 
    ? allPosts.filter((post) => !post.data.draft)
    : allPosts
  ).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  return rss({
    title: 'David Hoang',
    description: 'Writing about design, technology, and building products.',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/writing/${post.slug}/`,
    })),
    customData: `<language>en-us</language>`,
  });
} 