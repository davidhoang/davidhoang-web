import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { commandPalettePages } from '../data/navigation';
import { buildLlmsTxt, CANONICAL_SITE } from '../utils/llmsTxt';

export const prerender = true;

export const GET: APIRoute = async () => {
  const writingPosts = await getCollection('writing', ({ data }) => !data.draft);
  const notesPosts = await getCollection('notes', ({ data }) => !data.draft);

  const byPubDateDesc = <T extends { data: { pubDate: Date } }>(a: T, b: T) =>
    b.data.pubDate.valueOf() - a.data.pubDate.valueOf();

  const body = buildLlmsTxt({
    site: CANONICAL_SITE,
    pages: commandPalettePages.map((page) => ({
      title: page.title,
      path: page.path,
      description: page.description,
    })),
    writing: writingPosts
      .slice()
      .sort(byPubDateDesc)
      .map((post) => ({
        title: post.data.title,
        path: `/writing/${post.id}`,
        description: post.data.description,
      })),
    notes: notesPosts
      .slice()
      .sort(byPubDateDesc)
      .map((note) => ({
        title: note.data.title,
        path: `/notes/${note.id}`,
        description: note.data.description || undefined,
      })),
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
