import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { commandPalettePages } from '../data/navigation';

export const prerender = true;

export const GET: APIRoute = async () => {
  const writingPosts = await getCollection('writing', ({ data }) => !data.draft);
  const notesPosts = await getCollection('notes', ({ data }) => !data.draft);

  const searchIndex = [
    ...commandPalettePages.map((page) => ({ ...page })),
    ...writingPosts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      path: `/writing/${post.id}`,
      type: 'writing' as const,
    })),
    ...notesPosts.map((note) => ({
      title: note.data.title,
      description: note.data.description || '',
      path: `/notes/${note.id}`,
      type: 'note' as const,
    })),
  ];

  return new Response(JSON.stringify(searchIndex), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
};
