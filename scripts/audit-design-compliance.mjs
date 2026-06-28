#!/usr/bin/env node

/**
 * Design compliance audit — enforces agent-facing rules from design.md.
 * Focuses on patterns agents should not introduce in new UI work.
 *
 * Usage:
 *   node scripts/audit-design-compliance.mjs           # report (exit 0)
 *   node scripts/audit-design-compliance.mjs --check   # exit 1 on violations
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const checkOnly = process.argv.includes('--check');

const SKIP_DIRS = new Set(['node_modules', 'dist', '.astro', 'prototypes']);

/** Files with intentional exceptions documented in design.md or legacy debt */
const SKIP_FILES = new Set([
  'src/styles/modules/design-system.css', // primitive defs incl. deprecated glass
  'src/styles/modules/theme-variations.css', // e-ink glass overrides + migration notes
  'src/styles/modules/print.css',         // print-specific unscoped nav
  'src/layouts/MainLayout.astro',         // critical inline CSS fallbacks
  'src/pages/daily-themes.astro',         // theme preview/debug UI
  'src/components/AiDisclaimer.astro',  // fixed semantic warning colors
  'src/components/SubstackSignup.astro', // third-party embed overrides
]);

/** @type {{ file: string; line: number; rule: string; detail: string }[]} */
const violations = [];

function walk(dir, ext, out = []) {
  if (!statSync(dir).isDirectory()) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full, ext, out);
    } else if (name.endsWith(ext)) {
      out.push(full);
    }
  }
  return out;
}

function rel(file) {
  return relative(ROOT, file);
}

function addViolation(file, line, rule, detail) {
  violations.push({ file: rel(file), line, rule, detail });
}

function auditCssFile(file) {
  const r = rel(file);
  if (SKIP_FILES.has(r)) return;

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

    if (/^\s*nav\s*[,{]/.test(line) && !file.includes('nav.css')) {
      addViolation(file, lineNo, 'no-unscoped-nav', 'Scope nav rules to .site-nav — unscoped nav {} breaks other navs');
    }

    if (/\.card-glass\b|cards\.style:\s*["']glass["']/.test(line) && !/card-glass-mode|card-glass-overlay/.test(line)) {
      addViolation(file, lineNo, 'no-glass-cards', 'Cards must be opaque — do not add glass card styles (design.md)');
    }
  }
}

function auditScopedStyles(file, content) {
  const styleBlocks = [...content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)];
  for (const [, block] of styleBlocks) {
    for (const line of block.split('\n')) {
      if (/#[0-9a-fA-F]{3,8}\b/.test(line) && !line.includes('var(--')) {
        return true;
      }
    }
  }
  return false;
}

function auditAstroFile(file) {
  const r = rel(file);
  if (SKIP_FILES.has(r) || file.includes('design-guide.astro')) return;

  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/class=["'][^"']*\bcontainer\b/.test(line) && /<nav\b/.test(line)) {
      addViolation(file, i + 1, 'nav-no-container', 'Never put container on nav markup — use .nav-container');
    }
  }

  if (auditScopedStyles(file, content)) {
    addViolation(file, 1, 'no-hardcoded-colors', 'Use var(--color-*) in scoped styles instead of hex literals');
  }
}

function main() {
  for (const file of walk(join(ROOT, 'src', 'styles'), '.css')) {
    auditCssFile(file);
  }
  for (const file of walk(join(ROOT, 'src'), '.astro')) {
    auditAstroFile(file);
  }

  if (violations.length === 0) {
    console.log('Design compliance: no violations found.');
    return;
  }

  console.log(`Design compliance: ${violations.length} violation(s)\n`);
  for (const v of violations) {
    console.log(`  ${v.file}:${v.line} [${v.rule}] ${v.detail}`);
  }

  if (checkOnly) process.exit(1);
}

main();
