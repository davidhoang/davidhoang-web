/**
 * Pure helpers for /api/generate-bio-summary. Split out so the parsing and
 * auth-gate behavior is testable without touching the filesystem or AI API.
 */

/**
 * Strip HTML comments (including multi-line ones) from a string and trim.
 * Used to clean bio markdown before handing it to the model.
 */
export function stripHtmlComments(content: string): string {
  return content.replace(/<!--[\s\S]*?-->/g, '').trim();
}

/**
 * Bearer-token gate. Returns true if there is no expected token configured
 * (unset secret means the route is open) or the header matches exactly.
 */
export function isAuthorized(
  authHeader: string | null | undefined,
  expectedToken: string | null | undefined,
): boolean {
  if (!expectedToken) return true;
  return authHeader === `Bearer ${expectedToken}`;
}
