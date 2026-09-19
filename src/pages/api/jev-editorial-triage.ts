import { APICallError } from 'ai';
import type { APIRoute } from 'astro';
import {
  evaluateEditorialIdea,
  resolveJevConfiguration,
} from '../../utils/jevEditorialTriage';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ error: 'Send a JSON request body.' }, 400);
  }

  if (!body || typeof body !== 'object') {
    return json({ error: 'Send an idea to evaluate.' }, 400);
  }

  const { title, excerpt } = body as Record<string, unknown>;
  const normalizedTitle = typeof title === 'string' ? title.trim() : '';
  const normalizedExcerpt = typeof excerpt === 'string' ? excerpt.trim() : '';

  if (normalizedTitle.length > 120) {
    return json({ error: 'Keep the title to 120 characters or fewer.' }, 400);
  }

  if (normalizedExcerpt.length < 20 || normalizedExcerpt.length > 5_000) {
    return json(
      { error: 'The idea must be between 20 and 5,000 characters.' },
      400,
    );
  }

  const configuration = resolveJevConfiguration();
  if (!configuration.model) {
    return json(
      {
        error:
          'Jev is not configured locally. Pull Vercel OIDC credentials or add a TypeSafe API key.',
        code: 'JEV_NOT_CONFIGURED',
      },
      503,
    );
  }

  try {
    const result = await evaluateEditorialIdea(
      { title: normalizedTitle || undefined, excerpt: normalizedExcerpt },
      configuration.model,
    );

    return json({ ...result, authMode: configuration.mode });
  } catch (error) {
    if (APICallError.isInstance(error)) {
      if (error.statusCode === 401 || error.statusCode === 403) {
        return json(
          {
            error:
              'Jev authentication failed. Refresh the local OIDC token or check the TypeSafe API key.',
            code: 'JEV_AUTH_FAILED',
          },
          503,
        );
      }

      if (error.statusCode === 429) {
        return json(
          {
            error: 'Jev is receiving too many requests. Try again shortly.',
            code: 'JEV_RATE_LIMITED',
          },
          429,
        );
      }
    }

    console.error('Jev editorial triage failed:', error);
    return json(
      {
        error: 'Jev could not evaluate this idea. Try again.',
        code: 'JEV_EVALUATION_FAILED',
      },
      502,
    );
  }
};
