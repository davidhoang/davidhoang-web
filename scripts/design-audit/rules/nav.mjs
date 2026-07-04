import { readFileSync } from 'fs';
import { join } from 'path';
import { ROOT, walk, extractStyleBlocks } from '../shared.mjs';

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditNavCssFile(ctx, file) {
  if (!ctx.shouldAuditFile(file)) return;

  const lines = readFileSync(file, 'utf-8').split('\n');
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    if (line.includes('/*')) inBlockComment = true;
    if (inBlockComment) {
      if (line.includes('*/')) inBlockComment = false;
      continue;
    }

    if (/^\s*\.glass-border\s*[,{]/.test(line) && !line.includes(':not(.site-nav)')) {
      ctx.addViolation(
        file,
        lineNo,
        'glass-border-nav',
        'Scope .glass-border position away from .site-nav — it breaks position:fixed (design.md)',
      );
    }

    if (/^\s*nav\s*\{/.test(line) && !/\.site-nav|\.toc-nav|\.filter-nav/.test(line)) {
      ctx.addViolation(
        file,
        lineNo,
        'nav-unscoped',
        'Do not use unscoped nav {} — scope to .site-nav or a page-specific class (site-nav-css.mdc)',
      );
    }
  }
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditNavAstro(ctx, file, content) {
  if (!ctx.shouldAuditFile(file)) return;

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/class=["'][^"']*\bcontainer\b/.test(line) && /<nav\b/.test(line)) {
      ctx.addViolation(
        file,
        i + 1,
        'nav-no-container',
        'Never put container on nav markup — use .nav-container',
      );
    }
  }

  for (const { block } of extractStyleBlocks(content)) {
    for (const line of block.split('\n')) {
      if (/^\s*nav\s*\{/.test(line)) {
        ctx.addViolation(
          file,
          1,
          'nav-unscoped',
          'Do not use unscoped nav {} in scoped styles — scope to .site-nav',
        );
      }
    }
  }
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditAllNav(ctx) {
  for (const file of walk(join(ROOT, 'src', 'styles'), '.css')) {
    auditNavCssFile(ctx, file);
  }
}
