import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { discoverableStaticPages } from '../data/navigation';
import {
  SEARCH_INDEX_INCLUDE_DRAFTS,
  isExcludedFromSearchIndex,
} from '../data/searchIndexConfig';
import { resolveNoteStage } from '../content/noteStages';
import {
  buildSearchIndex,
  SEARCH_INDEX_SCHEMA_VERSION,
  SEARCH_INDEX_SCHEMA_VERSION_HEADER,
  SEARCH_INDEX_SITE,
} from '../utils/searchIndex';

export const prerender = true;

/** Align with vercel.json Cache-Control for non-Vercel previews. */
const CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=86400';

const isPublished = ({ data }: { data: { draft?: boolean } }) =>
  SEARCH_INDEX_INCLUDE_DRAFTS || !data.draft;

export const GET: APIRoute = async () => {
  const writingPosts = await getCollection('writing', isPublished);
  const notesPosts = await getCollection('notes', isPublished);

  const items = buildSearchIndex({
    site: SEARCH_INDEX_SITE,
    pages: discoverableStaticPages
      .filter((page) => !isExcludedFromSearchIndex(page.path))
      .map((page) => ({
        title: page.title,
        description: page.description,
        path: page.path,
      })),
    writing: writingPosts.map((post) => ({
      id: post.id,
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      tags: post.data.tags,
    })),
    notes: notesPosts.map((note) => ({
      id: note.id,
      title: note.data.title,
      description: note.data.description,
      overview: note.data.overview,
      pubDate: note.data.pubDate,
      updatedDate: note.data.updatedDate,
      stage: resolveNoteStage(note.data.stage),
      tags: note.data.tags,
    })),
  });

  return new Response(JSON.stringify(items), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': CACHE_CONTROL,
      [SEARCH_INDEX_SCHEMA_VERSION_HEADER]: String(SEARCH_INDEX_SCHEMA_VERSION),
    },
  });
};
