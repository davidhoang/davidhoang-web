/**
 * Catch invalid CSS custom-property interpolations from broken rem→token codemods.
 * Example: `0.2rem` wrongly becoming `0.var(--spacing-xl)` when `2rem` matched inside.
 */

const MALFORMED_SPACING_TOKEN = /\d+\.var\(--/;

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditMalformedSpacingTokens(ctx, file, content) {
  if (!ctx.shouldAuditFile(file)) return;

  const lines = content.split('\n');
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('//')) continue;
    if (line.includes('/*')) inBlockComment = true;
    if (inBlockComment) {
      if (line.includes('*/')) inBlockComment = false;
      continue;
    }
    if (MALFORMED_SPACING_TOKEN.test(line)) {
      ctx.addViolation(
        file,
        i + 1,
        'malformed-spacing-token',
        'Invalid spacing token like `0.var(--spacing-*)` — use calc(var(--spacing-* ) …) or a full token value',
      );
    }
  }
}
