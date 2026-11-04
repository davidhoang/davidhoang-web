export type ThemeQueryAuthMode = 'gateway' | 'direct' | 'missing';

type ServerEnvironment = Record<string, string | undefined>;

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
