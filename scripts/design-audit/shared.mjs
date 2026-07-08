import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const ROOT = join(__dirname, '..', '..');

export const SKIP_DIRS = new Set(['node_modules', 'dist', '.astro', 'prototypes']);

/** Files with intentional exceptions documented in design.md or legacy debt */
export const SKIP_FILES = new Set([
  'src/styles/modules/design-system.css',
  'src/styles/modules/theme-variations.css',
  'src/styles/modules/print.css',
  'src/layouts/MainLayout.astro',
  'src/pages/daily-themes.astro',
  'src/components/AiDisclaimer.astro',
  'src/components/SubstackSignup.astro',
]);

/** Grandfathered for strict-only rules (legacy debt — do not extend) */
export const STRICT_GRANDFATHER = new Set([
  'src/styles/modules/variables.css', // token source — hex/rgba and spacing scale definitions
  'src/styles/modules/nav.css',
  'src/styles/modules/theme-variations.css',
  'src/styles/modules/command-palette.css',
  'src/components/Navigation.astro',
  'src/components/hero/CardBase.tsx',
  'src/components/hero/HeroTitle.tsx',
  'src/components/hero/MobileHeroSheet.tsx',
  'src/styles/modules/utilities.css',
  'src/styles/modules/card-stack-hero.css',
  'src/styles/modules/accessibility-responsive.css',
  'src/pages/404.astro',
  'src/pages/daily-themes.astro',
]);

export const UI_EXTENSIONS = new Set(['.css', '.astro', '.tsx', '.jsx']);

export function rel(file) {
  return relative(ROOT, file);
}

export function walk(dir, ext, out = []) {
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

export function collectUiFiles() {
  const files = new Set();
  for (const file of walk(join(ROOT, 'src', 'styles'), '.css')) files.add(file);
  for (const file of walk(join(ROOT, 'src'), '.astro')) files.add(file);
  for (const file of walk(join(ROOT, 'src'), '.tsx')) files.add(file);
  for (const file of walk(join(ROOT, 'src'), '.jsx')) files.add(file);
  return [...files];
}

/**
 * Files changed vs merge base — for cloud agent PR self-check.
 * @param {string} baseRef
 */
export function getChangedUiFiles(baseRef = 'origin/main') {
  const refs = [baseRef, 'main', 'HEAD~1'];
  for (const ref of refs) {
    try {
      execSync(`git rev-parse --verify ${ref}`, { stdio: 'ignore' });
      const out = execSync(`git diff --name-only --diff-filter=ACMR ${ref}...HEAD`, {
        encoding: 'utf-8',
      });
      return out
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f && UI_EXTENSIONS.has(f.slice(f.lastIndexOf('.'))));
    } catch {
      /* try next ref */
    }
  }
  return [];
}

export function createContext(options = {}) {
  /** @type {{ file: string; line: number; rule: string; detail: string; severity: 'error' | 'warn' }[]} */
  const violations = [];

  const {
    checkOnly = false,
    changedOnly = false,
    strict = false,
    changedBase = 'origin/main',
    fileFilter = null,
  } = options;

  function addViolation(file, line, rule, detail, severity = 'error') {
    violations.push({ file: rel(file), line, rule, detail, severity });
  }

  function addContractViolation(file, rule, detail) {
    addViolation(file, 1, rule, detail);
  }

  function shouldAuditFile(filePath) {
    const r = rel(filePath);
    if (SKIP_FILES.has(r)) return false;
    if (filePath.includes('design-guide.astro')) return false;
    if (changedOnly && fileFilter && !fileFilter.has(r)) return false;
    return true;
  }

  function isGrandfatheredStrict(filePath) {
    return STRICT_GRANDFATHER.has(rel(filePath));
  }

  let fileFilterSet = null;
  if (changedOnly) {
    const changed = getChangedUiFiles(changedBase);
    fileFilterSet = new Set(changed);
  }

  return {
    violations,
    checkOnly,
    changedOnly,
    strict,
    fileFilter: fileFilterSet,
    shouldAuditFile,
    isGrandfatheredStrict,
    addViolation,
    addContractViolation,
  };
}

export function readLines(file) {
  return readFileSync(file, 'utf-8').split('\n');
}

export function readContent(file) {
  return readFileSync(file, 'utf-8');
}

/** Extract `<style>` blocks from Astro/HTML-like files */
export function extractStyleBlocks(content) {
  return [...content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((match) => ({
    block: match[1],
    startLine: content.slice(0, match.index).split('\n').length,
  }));
}

/** Split CSS into rule chunks `{ selector { body }` (best-effort) */
export function splitCssRules(css) {
  const rules = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        rules.push(css.slice(start, i + 1));
        start = i + 1;
      }
    }
  }
  return rules;
}

export function lineNumberAt(content, index) {
  return content.slice(0, index).split('\n').length;
}
