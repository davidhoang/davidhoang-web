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

function addContractViolation(file, rule, detail) {
  addViolation(file, 1, rule, detail);
}

/** Only layout.css may define hero flush pulls (design.md § Hero image padding) */
const HERO_FLUSH_PULL = /margin-top:\s*calc\(\s*-1\s*\*\s*var\(--content-top-padding\)\s*\)/;

/** Canonical layout contract — if these disappear, heroes regress (design.md § Hero image padding) */
const LAYOUT_CONTRACT = [
  {
    file: 'src/styles/modules/layout.css',
    rule: 'hero-layout-contract',
    mustInclude: [
      'main#main-content:has(> :is(.page-header--image',
      'padding-top: 0',
      'width: 100vw',
      'margin-inline: calc(50% - 50vw)',
    ],
  },
  {
    file: 'src/layouts/MainLayout.astro',
    rule: 'hero-critical-css',
    mustInclude: [
      'main#main-content:has(> .page-header--image)',
      'width: 100vw',
      'margin-inline: calc(50% - 50vw)',
      'nav.glass-border.site-nav',
      'position: fixed',
    ],
  },
  {
    file: 'src/styles/modules/nav.css',
    rule: 'nav-fixed-contract',
    mustInclude: ['.site-nav.glass-border', 'position: fixed'],
  },
  {
    file: 'src/styles/modules/shared-components.css',
    rule: 'glass-border-nav-contract',
    mustInclude: ['.glass-border:not(.site-nav)'],
  },
  {
    file: 'src/styles/modules/theme-variations.css',
    rule: 'shader-hero-padding-contract',
    mustInclude: [
      'main.container:has(> :is(.page-header--image',
      'padding-top: 0',
    ],
  },
];

function auditLayoutContract() {
  for (const { file, rule, mustInclude } of LAYOUT_CONTRACT) {
    const full = join(ROOT, file);
    const content = readFileSync(full, 'utf-8');
    for (const needle of mustInclude) {
      if (!content.includes(needle)) {
        addContractViolation(
          full,
          rule,
          `${file} must include layout contract fragment: ${needle}`,
        );
      }
    }
  }
}

/**
 * Flag scoped width:100% on image heroes — beats layered 100vw (Astro injects unlayered).
 * Allows .page-header--text { width: 100% } only.
 */
function auditHeroWidthInStyleBlock(file, block, blockStartLine) {
  const rules = block.split('}');
  for (const chunk of rules) {
    const brace = chunk.indexOf('{');
    if (brace === -1) continue;
    const selector = chunk.slice(0, brace);
    const body = chunk.slice(brace + 1);
    if (!/width:\s*100%/.test(body) || /100vw/.test(body)) continue;
    if (/\.page-header--text/.test(selector)) continue;

    const hitsImageHero =
      /\.page-header--image/.test(selector) ||
      /(?:^|[,{])\s*\.page-header\s*(?:[,{]|$)/.test(selector + '{');

    if (!hitsImageHero) continue;

    const lineInBlock = block.slice(0, block.indexOf(chunk)).split('\n').length - 1;
    addViolation(
      file,
      blockStartLine + lineInBlock,
      'hero-full-width',
      'Image heroes must not use scoped width:100% — use layout.css + MainLayout critical CSS (100vw breakout)',
    );
  }
}

function auditCssFile(file) {
  const r = rel(file);
  if (SKIP_FILES.has(r)) return;

  const lines = readFileSync(file, 'utf-8').split('\n');
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    if (HERO_FLUSH_PULL.test(line) && r !== 'src/styles/modules/layout.css') {
      addViolation(
        file,
        lineNo,
        'hero-flush-centralized',
        'Hero flush is owned by layout.css (main:has padding-top: 0) — remove margin-top pull',
      );
    }

    if (line.includes('/*')) inBlockComment = true;
    if (inBlockComment) {
      if (line.includes('*/')) inBlockComment = false;
      continue;
    }

    if (/^\s*\.glass-border\s*[,{]/.test(line) && !line.includes(':not(.site-nav)')) {
      addViolation(
        file,
        lineNo,
        'glass-border-nav',
        'Scope .glass-border position away from .site-nav — it breaks position:fixed (design.md)',
      );
    }

    if (
      /\.page-header--image/.test(line) &&
      /width:\s*100%/.test(line) &&
      !/100vw/.test(line) &&
      r !== 'src/styles/modules/layout.css'
    ) {
      addViolation(
        file,
        lineNo,
        'hero-full-width',
        'Do not set width:100% on .page-header--image — full bleed is framework-owned (100vw)',
      );
    }

    if (/\.card-glass\b|cards\.style:\s*["']glass["']/.test(line) && !/card-glass-mode|card-glass-overlay/.test(line)) {
      addViolation(file, lineNo, 'no-glass-cards', 'Cards must be opaque — do not add glass card styles (design.md)');
    }
  }
}

function auditScopedStyles(file, content) {
  const styleBlocks = [...content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)];
  for (const [match, block] of styleBlocks) {
    const blockStartLine = content.slice(0, match.index).split('\n').length;
    for (const line of block.split('\n')) {
      if (/#[0-9a-fA-F]{3,8}\b/.test(line) && !line.includes('var(--')) {
        return true;
      }
    }
    auditHeroWidthInStyleBlock(file, block, blockStartLine);
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

  const styleBlocks = [...content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)];
  for (const [, block] of styleBlocks) {
    for (let i = 0; i < block.split('\n').length; i++) {
      const line = block.split('\n')[i];
      if (HERO_FLUSH_PULL.test(line)) {
        addViolation(
          file,
          i + 1,
          'hero-flush-centralized',
          'Hero flush is owned by layout.css (main:has padding-top: 0) — remove margin-top pull from scoped styles',
        );
      }
    }
  }

  if (auditScopedStyles(file, content)) {
    addViolation(file, 1, 'no-hardcoded-colors', 'Use var(--color-*) in scoped styles instead of hex literals');
  }
}

function main() {
  auditLayoutContract();

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
