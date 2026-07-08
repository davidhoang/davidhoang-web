/**
 * One-shot codemod: replace hardcoded spacing/motion values with design tokens.
 * Run: node scripts/design-audit/codemods/apply-strict-tokens.mjs
 * Re-run audit: npm run audit:design:strict
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { STRICT_GRANDFATHER, SKIP_FILES, SKIP_DIRS } from '../shared.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/** Longest-first rem/px → token (padding/margin/gap lines only) */
const SPACING_VALUE_MAP = [
  ['4rem', 'var(--spacing-3xl)'],
  ['3rem', 'var(--spacing-2xl)'],
  ['2.5rem', 'calc(var(--spacing-xl) + var(--spacing-sm))'],
  ['2rem', 'var(--spacing-xl)'],
  ['1.75rem', 'calc(var(--spacing-lg) + var(--spacing-sm))'],
  ['1.5rem', 'var(--spacing-lg)'],
  ['1.25rem', 'calc(var(--spacing-md) + var(--spacing-xs))'],
  ['1.15rem', 'calc(var(--spacing-md) + var(--spacing-sm))'],
  ['1.1rem', 'calc(var(--spacing-md) + var(--spacing-xs))'],
  ['1rem', 'var(--spacing-md)'],
  ['0.95rem', 'calc(var(--spacing-md) - var(--spacing-xs))'],
  ['0.875rem', 'calc(var(--spacing-sm) + var(--spacing-xs))'],
  ['0.85rem', 'calc(var(--spacing-md) - 0.15rem)'],
  ['0.75rem', 'calc(var(--spacing-sm) + var(--spacing-xs))'],
  ['0.72rem', 'calc(var(--spacing-sm) + 0.22rem)'],
  ['0.65rem', 'calc(var(--spacing-sm) + 0.15rem)'],
  ['0.625rem', 'calc(var(--spacing-sm) + var(--spacing-xs))'],
  ['0.55rem', 'calc(var(--spacing-sm) + 0.05rem)'],
  ['0.5rem', 'var(--spacing-sm)'],
  ['0.45rem', 'calc(var(--spacing-sm) - 0.05rem)'],
  ['0.4rem', 'calc(var(--spacing-xs) + 0.15rem)'],
  ['0.375rem', 'calc(var(--spacing-xs) + 0.125rem)'],
  ['0.35rem', 'calc(var(--spacing-xs) + 0.1rem)'],
  ['0.3rem', 'calc(var(--spacing-xs) + 0.05rem)'],
  ['0.25rem', 'var(--spacing-xs)'],
  ['0.2rem', 'calc(var(--spacing-xs) - 0.05rem)'],
  ['0.15rem', 'calc(var(--spacing-xs) - 0.1rem)'],
  ['0.125rem', 'calc(var(--spacing-xs) - 0.125rem)'],
  ['0.05rem', 'calc(var(--spacing-xs) - 0.2rem)'],
  ['20px', 'var(--spacing-lg)'],
  ['16px', 'var(--spacing-md)'],
  ['10px', 'calc(var(--spacing-sm) + 0.125rem)'],
  ['8px', 'var(--spacing-sm)'],
  ['4px', 'var(--spacing-xs)'],
  ['2px', 'calc(var(--spacing-xs) - 2px)'],
];

const MOTION_REPLACEMENTS = [
  ['0.4s', 'var(--duration-slower)'],
  ['0.35s', 'var(--duration-slower)'],
  ['0.3s', 'var(--duration-slow)'],
  ['0.25s', 'var(--duration-slow)'],
  ['0.2s', 'var(--duration-normal)'],
  ['0.18s', 'var(--duration-normal)'],
  ['0.15s', 'var(--duration-fast)'],
  ['0.12s', 'var(--duration-fast)'],
  ['0.1s', 'var(--duration-fast)'],
  ['cubic-bezier(0.25, 0.46, 0.45, 0.94)', 'var(--ease-inertia)'],
  ['cubic-bezier(0.4, 0, 0.2, 1)', 'var(--ease-standard)'],
  ['cubic-bezier(0.22, 1, 0.36, 1)', 'var(--ease-emphasized)'],
  ['cubic-bezier(0.34, 1.56, 0.64, 1)', 'var(--ease-spring)'],
  ['ease-in-out', 'var(--ease-standard)'],
  ['ease-out', 'var(--ease-inertia)'],
];

const SHADOW_REPLACEMENTS = [
  ['0 12px 32px rgba(0, 0, 0, 0.18)', 'var(--shadow-hover)'],
  ['0 8px 24px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.12)', 'var(--shadow-hover)'],
  ['0 8px 24px rgba(0, 0, 0, 0.12)', 'var(--shadow-hover)'],
  ['0 6px 24px rgba(0, 0, 0, 0.12)', 'var(--shadow-hover)'],
  ['0 4px 16px rgba(0, 0, 0, 0.08)', 'var(--shadow-scrolling)'],
  ['0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.08)', 'var(--shadow-scrolling)'],
  ['0 2px 8px rgba(0,0,0,0.08)', 'var(--shadow-scrolling)'],
  ['0 1px 4px rgba(0, 0, 0, 0.05)', 'var(--shadow-scrolling)'],
  ['0 1px 3px rgba(0, 0, 0, 0.06)', 'var(--shadow-scrolling)'],
];

function walk(dir, out = []) {
  if (!statSync(dir).isDirectory()) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(css|astro|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

function shouldProcess(file) {
  const rel = relative(ROOT, file);
  if (SKIP_FILES.has(rel)) return false;
  if (STRICT_GRANDFATHER.has(rel)) return false;
  if (rel.includes('design-guide.astro')) return false;
  if (rel.includes('codemods/')) return false;
  return true;
}

function replaceSpacingValues(value) {
  let next = value;
  for (const [from, to] of SPACING_VALUE_MAP) {
    // Word-boundary style: don't replace `2px` inside `12px`.
    const pattern = new RegExp(`(?<![\\d.])${from.replace('.', '\\.')}(?![\\d])`, 'g');
    next = next.replace(pattern, to);
  }
  return next;
}

function fixSpacingLine(line) {
  if (!/(?:padding|margin|gap)\s*:/.test(line)) return line;
  if (/var\(--(?:spacing-|card-|content-|section-)/.test(line)) return line;
  if (/calc\(|clamp\(|env\(/.test(line)) return line;
  if (/^\s*\/\*/.test(line.trim())) return line;

  const colon = line.indexOf(':');
  if (colon === -1) return line;
  const prop = line.slice(0, colon + 1);
  const value = line.slice(colon + 1);
  return prop + replaceSpacingValues(value);
}

function fixMotionLine(line) {
  if (!/transition\s*:/.test(line) && !/transition=/.test(line)) return line;
  if (/var\(--duration-/.test(line) && /var\(--ease-/.test(line)) return line;

  let next = line;
  if (/\b\d+(?:\.\d+)?(?:ms|s)\b/.test(line) || /cubic-bezier\s*\(/.test(line) || /\bease/.test(line)) {
    for (const [from, to] of MOTION_REPLACEMENTS) {
      next = next.split(from).join(to);
    }
    // Standalone `ease` after duration token replacement
    next = next.replace(/,\s*ease\b/g, ', var(--ease-standard)');
    next = next.replace(/var\(--duration-[^)]+\)\s+ease\b/g, (m) =>
      m.replace(/\s+ease\b/, ' var(--ease-standard)'),
    );
  }
  return next;
}

function fixShadows(text) {
  let next = text;
  for (const [from, to] of SHADOW_REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  return next;
}

function processContent(text) {
  let lines = text.split('\n').map((line) => fixSpacingLine(fixMotionLine(line)));
  return fixShadows(lines.join('\n'));
}

let changed = 0;
for (const file of walk(join(ROOT, 'src'))) {
  if (!shouldProcess(file)) continue;
  const original = readFileSync(file, 'utf-8');
  const updated = processContent(original);
  if (updated !== original) {
    writeFileSync(file, updated);
    changed++;
    console.log('updated', relative(ROOT, file));
  }
}

console.log(`\nDone — ${changed} files updated.`);
