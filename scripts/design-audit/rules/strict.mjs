import { readFileSync } from 'fs';
import { join } from 'path';
import { ROOT, extractStyleBlocks } from '../shared.mjs';

const DIMENSIONAL_PROPS =
  /(?:^|\s)(padding|margin|gap|width|height|min-width|max-width|min-height|max-height|border-width)\s*:/;

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditHoverDimensional(ctx, file, css, blockStartLine = 1) {
  if (!ctx.strict || ctx.isGrandfatheredStrict(file)) return;

  // Match :hover rule bodies only — avoid false positives when @media wraps
  // sibling hover and layout rules in one brace-delimited chunk.
  const hoverRulePattern = /([^{}]*:hover[^{]*)\{([^{}]*)\}/g;
  let match;
  while ((match = hoverRulePattern.exec(css)) !== null) {
    const body = match[2];
    if (!DIMENSIONAL_PROPS.test(body)) continue;

    const lineInBlock = css.slice(0, match.index).split('\n').length - 1;
    ctx.addViolation(
      file,
      blockStartLine + lineInBlock,
      'hover-dimensional',
      'Hover must not change padding, margin, gap, width, height, or border-width — use color, shadow, transform only (design.md)',
    );
  }
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditCssHover(ctx, file) {
  if (!ctx.shouldAuditFile(file)) return;
  const content = readFileSync(file, 'utf-8');
  auditHoverDimensional(ctx, file, content, 1);
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditAstroHover(ctx, file, content) {
  if (!ctx.shouldAuditFile(file)) return;
  for (const { block, startLine } of extractStyleBlocks(content)) {
    auditHoverDimensional(ctx, file, block, startLine);
  }
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditHeroLayoutOpacity(ctx, file) {
  if (!ctx.shouldAuditFile(file)) return;
  if (!file.includes('hero/layouts/')) return;
  if (ctx.isGrandfatheredStrict(file)) return;

  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/initial:\s*\{[^}]*opacity:\s*0/.test(line.replace(/\s+/g, ' '))) {
      ctx.addViolation(
        file,
        i + 1,
        'hero-card-opacity',
        'Hero layout cards must enter at opacity: 1 — use motion-only deal animation (design.md § Card entrance animation)',
      );
    }
    if (/initial=\{\{\s*opacity:\s*0/.test(line)) {
      ctx.addViolation(
        file,
        i + 1,
        'hero-card-opacity',
        'Hero layout cards must enter at opacity: 1 — use motion-only deal animation (design.md § Card entrance animation)',
      );
    }
  }
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditMotionTokens(ctx, file, css, blockStartLine = 1) {
  if (!ctx.strict || ctx.isGrandfatheredStrict(file)) return;

  const lines = css.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/transition\s*:/.test(line) && !/transition=/.test(line)) continue;
    if (/var\(--duration-/.test(line) && /var\(--ease-/.test(line)) continue;
    if (/View Transitions|view-transition|@keyframes/.test(line)) continue;

    const hasHardcodedDuration = /\b\d+(?:\.\d+)?(?:ms|s)\b/.test(line);
    const hasHardcodedEase = /cubic-bezier\s*\(/.test(line) && !/var\(--ease-/.test(line);

    if (hasHardcodedDuration || hasHardcodedEase) {
      ctx.addViolation(
        file,
        blockStartLine + i,
        'motion-tokens',
        'Use var(--duration-*) and var(--ease-*) for transitions — no hardcoded 0.3s or cubic-bezier() (design.md)',
      );
    }
  }
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditCssMotion(ctx, file) {
  if (!ctx.shouldAuditFile(file)) return;
  auditMotionTokens(ctx, file, readFileSync(file, 'utf-8'), 1);
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditAstroMotion(ctx, file, content) {
  if (!ctx.shouldAuditFile(file)) return;
  for (const { block, startLine } of extractStyleBlocks(content)) {
    auditMotionTokens(ctx, file, block, startLine);
  }
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditTsxMotion(ctx, file) {
  if (!ctx.shouldAuditFile(file)) return;
  auditMotionTokens(ctx, file, readFileSync(file, 'utf-8'), 1);
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditFocusRing(ctx, file, css, blockStartLine = 1) {
  if (!ctx.strict || ctx.isGrandfatheredStrict(file)) return;

  const lines = css.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/\boutline\s*:/.test(line)) continue;
    if (/--focus-ring|forced-colors|Highlight/.test(line)) continue;
    if (/outline:\s*none/.test(line)) continue;

    ctx.addViolation(
      file,
      blockStartLine + i,
      'focus-ring-token',
      'Use --focus-ring* tokens for outline — do not hardcode outline width/color (design.md § Focus ring)',
    );
  }
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditCssFocus(ctx, file) {
  if (!ctx.shouldAuditFile(file)) return;
  auditFocusRing(ctx, file, readFileSync(file, 'utf-8'), 1);
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditAstroFocus(ctx, file, content) {
  if (!ctx.shouldAuditFile(file)) return;
  for (const { block, startLine } of extractStyleBlocks(content)) {
    auditFocusRing(ctx, file, block, startLine);
  }
}

/** Agent stack contract — ensures cloud agents can discover and CI enforces linters */
const AGENT_STACK_CONTRACT = [
  {
    file: '.github/workflows/ci.yml',
    rule: 'ci-design-audit',
    mustInclude: ['audit:design:check'],
  },
  {
    file: 'design.md',
    rule: 'design-md-audit-ref',
    mustInclude: ['npm run audit:design'],
  },
  {
    file: '.agents/skills/product-design/SKILL.md',
    rule: 'skill-audit-ref',
    mustInclude: ['audit:design:check'],
  },
  {
    file: '.agents/skills/product-design/references/rules.md',
    rule: 'rules-audit-ref',
    mustInclude: ['audit:design:check'],
  },
  {
    file: 'AGENTS.md',
    rule: 'agents-md-audit-ref',
    mustInclude: ['audit:design:check'],
  },
];

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditAgentStack(ctx) {
  for (const { file, rule, mustInclude } of AGENT_STACK_CONTRACT) {
    const full = join(ROOT, file);
    const content = readFileSync(full, 'utf-8');
    for (const needle of mustInclude) {
      if (!content.includes(needle)) {
        ctx.addContractViolation(
          full,
          rule,
          `${file} must reference design audit command: ${needle}`,
        );
      }
    }
  }
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditSpacingTokens(ctx, file, css, blockStartLine = 1) {
  if (!ctx.strict || ctx.isGrandfatheredStrict(file)) return;

  const lines = css.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/(?:padding|margin|gap)\s*:/.test(line)) continue;
    if (/var\(--(?:spacing-|card-|content-|section-)/.test(line)) continue;
    if (/^\s*\/\*/.test(line.trim()) || line.includes('/*')) continue;
    if (/calc\(|clamp\(|env\(|100%|100vw|auto|inherit|initial|unset|0(?:px|rem)?\s*;/.test(line)) continue;

    const hardcodedSpacing = /(?:padding|margin|gap)\s*:[^;]*\b\d+(?:\.\d+)?(?:px|rem|em)\b/.test(line);
    if (hardcodedSpacing) {
      ctx.addViolation(
        file,
        blockStartLine + i,
        'spacing-tokens',
        'Use var(--spacing-*) or theme spacing tokens (--card-padding, --content-padding) — no hardcoded rem/px (design.md)',
      );
    }
  }
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditCssSpacing(ctx, file) {
  if (!ctx.shouldAuditFile(file)) return;
  auditSpacingTokens(ctx, file, readFileSync(file, 'utf-8'), 1);
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditAstroSpacing(ctx, file, content) {
  if (!ctx.shouldAuditFile(file)) return;
  for (const { block, startLine } of extractStyleBlocks(content)) {
    auditSpacingTokens(ctx, file, block, startLine);
  }
}
