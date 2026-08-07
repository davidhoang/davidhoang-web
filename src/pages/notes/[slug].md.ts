import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { buildContentMarkdown, markdownResponse } from '../../utils/contentMarkdown';

export const prerender = true;

export const getStaticPaths = (async () => {
  const notes = await getCollection('notes', ({ data }) => !data.draft);
  return notes.map((note) => ({
    params: { slug: note.id },
    props: { note },
  }));
}) satisfies GetStaticPaths;

type Props = { note: CollectionEntry<'notes'> };

export const GET: APIRoute<Props> = ({ props, site }) => {
  const { note } = props;
  const markdown = buildContentMarkdown({
    kind: 'notes',
    id: note.id,
    body: note.body,
    data: note.data as unknown as Record<string, unknown>,
    site,
  });
  const origin = String(site ?? 'https://www.davidhoang.com').replace(/\/+$/, '');
  return markdownResponse(markdown, `${origin}/notes/${note.id}`);
};
