import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { buildContentMarkdown, markdownResponse } from '../../utils/contentMarkdown';

export const prerender = true;

export const getStaticPaths = (async () => {
  const posts = await getCollection('writing', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}) satisfies GetStaticPaths;

type Props = { post: CollectionEntry<'writing'> };

export const GET: APIRoute<Props> = ({ props, site }) => {
  const { post } = props;
  const markdown = buildContentMarkdown({
    kind: 'writing',
    id: post.id,
    body: post.body,
    data: post.data as unknown as Record<string, unknown>,
    site,
  });
  const origin = String(site ?? 'https://www.davidhoang.com').replace(/\/+$/, '');
  return markdownResponse(markdown, `${origin}/writing/${post.id}`);
};
