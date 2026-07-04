import { extractStyleBlocks } from '../shared.mjs';

const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/;
const RGB_LITERAL = /\b(?:rgb|rgba|hsl|hsla)\(\s*(?!var\()/;
const NAMED_COLOR = /\b(?:white|black|red|blue|green|gray|grey)\b/i;

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditAstroColors(ctx, file, content) {
  if (!ctx.shouldAuditFile(file)) return;

  for (const { block, startLine } of extractStyleBlocks(content)) {
    const blockLines = block.split('\n');
    for (let i = 0; i < blockLines.length; i++) {
      const line = blockLines[i];
      if (line.trim().startsWith('/*') || line.trim().startsWith('*')) continue;

      if (HEX_COLOR.test(line) && !line.includes('var(--')) {
        ctx.addViolation(
          file,
          startLine + i,
          'no-hardcoded-colors',
          'Use var(--color-*) in scoped styles instead of hex literals',
        );
      }

      if (ctx.strict && RGB_LITERAL.test(line) && !line.includes('var(--')) {
        ctx.addViolation(
          file,
          startLine + i,
          'no-hardcoded-colors-rgb',
          'Use var(--color-*) instead of rgb/rgba/hsl literals in scoped styles',
        );
      }
    }
  }
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditCssColors(ctx, file, content) {
  if (!ctx.shouldAuditFile(file)) return;
  if (!ctx.strict || ctx.isGrandfatheredStrict(file)) return;

  const lines = content.split('\n');
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('/*')) inBlockComment = true;
    if (inBlockComment) {
      if (line.includes('*/')) inBlockComment = false;
      continue;
    }

    if (
      (HEX_COLOR.test(line) || RGB_LITERAL.test(line)) &&
      !line.includes('var(--') &&
      /(?:color|background|border|fill|stroke|box-shadow)/.test(line)
    ) {
      ctx.addViolation(
        file,
        i + 1,
        'no-hardcoded-colors',
        'Use var(--color-*) tokens — no raw color literals in CSS modules',
      );
    }
  }
}
