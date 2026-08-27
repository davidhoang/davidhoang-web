import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const prerender = true;

const markdown = readFileSync(join(process.cwd(), 'poc-ventures.md'), 'utf8');

export const GET: APIRoute = () =>
  new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      Link: '</fund>; rel="canonical"',
    },
  });
