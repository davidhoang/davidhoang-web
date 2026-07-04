import { readFileSync } from 'fs';
import { join } from 'path';
import { ROOT, walk, createContext } from './shared.mjs';
import { auditLayoutContract } from './rules/layout-contract.mjs';
import { auditHeroAstro, auditHeroCssFile } from './rules/hero.mjs';
import { auditNavAstro, auditNavCssFile } from './rules/nav.mjs';
import { auditCardsInFile } from './rules/cards.mjs';
import { auditAstroColors, auditCssColors } from './rules/colors.mjs';
import {
  auditAgentStack,
  auditAstroFocus,
  auditAstroHover,
  auditAstroMotion,
  auditAstroSpacing,
  auditCssFocus,
  auditCssHover,
  auditCssMotion,
  auditCssSpacing,
  auditHeroLayoutOpacity,
  auditTsxMotion,
} from './rules/strict.mjs';

/**
 * Run design compliance audit.
 * @param {object} [options]
 * @param {boolean} [options.checkOnly]
 * @param {boolean} [options.changedOnly]
 * @param {boolean} [options.strict]
 * @param {string} [options.changedBase]
 */
export function runDesignAudit(options = {}) {
  const ctx = createContext(options);

  auditAgentStack(ctx);
  auditLayoutContract(ctx);

  for (const file of walk(join(ROOT, 'src', 'styles'), '.css')) {
    auditHeroCssFile(ctx, file);
    auditNavCssFile(ctx, file);
    auditCardsInFile(ctx, file);
    if (ctx.strict) {
      const content = readFileSync(file, 'utf-8');
      auditCssColors(ctx, file, content);
      auditCssHover(ctx, file);
      auditCssMotion(ctx, file);
      auditCssFocus(ctx, file);
      auditCssSpacing(ctx, file);
    }
  }

  for (const file of walk(join(ROOT, 'src'), '.astro')) {
    const content = readFileSync(file, 'utf-8');
    auditHeroAstro(ctx, file, content);
    auditNavAstro(ctx, file, content);
    auditCardsInFile(ctx, file);
    auditAstroColors(ctx, file, content);
    if (ctx.strict) {
      auditAstroHover(ctx, file, content);
      auditAstroMotion(ctx, file, content);
      auditAstroFocus(ctx, file, content);
      auditAstroSpacing(ctx, file, content);
    }
  }

  for (const file of walk(join(ROOT, 'src'), '.tsx')) {
    auditCardsInFile(ctx, file);
    auditHeroLayoutOpacity(ctx, file);
    if (ctx.strict) auditTsxMotion(ctx, file);
  }

  return ctx.violations;
}

export function formatReport(violations, { changedOnly = false, strict = false } = {}) {
  if (violations.length === 0) {
    const mode = changedOnly ? ' (changed files)' : strict ? ' (strict)' : '';
    return { text: `Design compliance: no violations found${mode}.`, exitCode: 0 };
  }

  const mode = changedOnly ? 'changed' : strict ? 'strict' : 'core';
  const lines = [`Design compliance (${mode}): ${violations.length} violation(s)\n`];
  for (const v of violations) {
    lines.push(`  ${v.file}:${v.line} [${v.rule}] ${v.detail}`);
  }
  return { text: lines.join('\n'), exitCode: 1 };
}

function parseArgs(argv) {
  return {
    checkOnly: argv.includes('--check'),
    changedOnly: argv.includes('--changed'),
    strict: argv.includes('--strict'),
    changedBase: argv.find((a) => a.startsWith('--base='))?.slice(7) ?? 'origin/main',
    json: argv.includes('--json'),
  };
}

export function main(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  const violations = runDesignAudit({
    checkOnly: opts.checkOnly,
    changedOnly: opts.changedOnly,
    strict: opts.strict,
    changedBase: opts.changedBase,
  });

  const report = formatReport(violations, {
    changedOnly: opts.changedOnly,
    strict: opts.strict,
  });

  if (opts.json) {
    console.log(JSON.stringify({ violations, exitCode: report.exitCode }, null, 2));
  } else {
    console.log(report.text);
  }

  if (opts.checkOnly && report.exitCode !== 0) {
    process.exit(1);
  }
}
