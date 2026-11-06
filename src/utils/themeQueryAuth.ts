import { GatewayAuthenticationError, GatewayError } from '@ai-sdk/gateway';
import { APICallError } from 'ai';

export type ThemeQueryAuthMode = 'gateway' | 'direct' | 'missing';

type ServerEnvironment = Record<string, string | undefined>;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

/**
 * Map AI Gateway / provider errors to JSON responses for Daily Themes Ask.
 * Returns null when the caller should fall through to a generic handler.
 */
export function themeQueryGatewayErrorResponse(error: unknown): Response | null {
  if (APICallError.isInstance(error)) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return json(
        {
          error:
            'Theme Ask authentication failed. Refresh Vercel OIDC credentials or check AI Gateway access.',
          code: 'THEME_QUERY_AUTH_FAILED',
        },
        503,
      );
    }
    if (error.statusCode === 429) {
      return json(
        {
          error: 'Theme Ask is rate limited. Try again in a moment.',
          code: 'THEME_QUERY_RATE_LIMITED',
        },
        429,
      );
    }
    return json(
      {
        error: 'Theme Ask could not reach the model. Try again.',
        code: 'THEME_QUERY_GATEWAY_FAILED',
      },
      502,
    );
  }

  if (GatewayAuthenticationError.isInstance(error)) {
    return json(
      {
        error:
          'Theme Ask authentication failed. Refresh Vercel OIDC credentials or check AI Gateway access.',
        code: 'THEME_QUERY_AUTH_FAILED',
      },
      503,
    );
  }

  if (GatewayError.isInstance(error)) {
    if (error.statusCode === 429) {
      return json(
        {
          error: 'Theme Ask is rate limited. Try again in a moment.',
          code: 'THEME_QUERY_RATE_LIMITED',
        },
        429,
      );
    }
    if (error.statusCode === 401 || error.statusCode === 403) {
      return json(
        {
          error:
            'Theme Ask authentication failed. Refresh Vercel OIDC credentials or check AI Gateway access.',
          code: 'THEME_QUERY_AUTH_FAILED',
        },
        503,
      );
    }
    return json(
      {
        error: error.message || 'Theme Ask could not reach the model. Try again.',
        code: 'THEME_QUERY_GATEWAY_FAILED',
      },
      502,
    );
  }

  return null;
}

/** Prefer Vercel AI Gateway (OIDC on deploy) over a direct Anthropic API key. */
export function resolveThemeQueryConfiguration(
  environment: ServerEnvironment = process.env,
  directAnthropicApiKey?: string,
): { mode: ThemeQueryAuthMode } {
  const hasGatewayCredentials = Boolean(
    environment.VERCEL ||
      environment.VERCEL_OIDC_TOKEN ||
      environment.AI_GATEWAY_API_KEY,
  );

  if (hasGatewayCredentials) {
    return { mode: 'gateway' };
  }

  if (directAnthropicApiKey) {
    return { mode: 'direct' };
  }

  return { mode: 'missing' };
}
