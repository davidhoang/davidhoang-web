#!/usr/bin/env node

/**
 * Build-time Theme Contrast Audit
 *
 * Validates all daily themes against WCAG AA contrast requirements.
 * Fixes violations in-place and writes corrected themes back to disk.
 *
 * Usage:
 *   node scripts/audit-theme-contrast.mjs           # audit and fix
 *   node scripts/audit-theme-contrast.mjs --check   # audit only, exit 1 on failure
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  auditThemeContrast,
  formatContrastFailures,
  validateThemeContrast,
} from './lib/contrast.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const THEMES_PATH = join(__dirname, '..', 'src', 'data', 'daily-themes.json');
const checkOnly = process.argv.includes('--check');

function main() {
  const data = JSON.parse(readFileSync(THEMES_PATH, 'utf-8'));
  const themes = data.themes || [];

  let totalFixes = 0;
  let totalFailures = 0;

  console.log(`Auditing ${themes.length} themes for WCAG AA contrast...\n`);

  for (const theme of themes) {
    if (checkOnly) {
      const failures = auditThemeContrast(theme);
      if (failures.length === 0) {
        console.log(`  ✓ ${theme.name} (${theme.date})`);
      } else {
        totalFailures++;
        console.log(`  ✗ ${theme.name} (${theme.date}) — ${failures.length} failure${failures.length > 1 ? 's' : ''}:`);
        for (const failure of failures) {
          console.log(
            `      ${failure.mode} ${failure.pair}: ${failure.foreground} on ${failure.background} ` +
              `(${failure.ratio.toFixed(2)}:1 < ${failure.target}:1)`,
          );
        }
      }
      continue;
    }

    const fixes = validateThemeContrast(theme);

    if (fixes.length === 0) {
      console.log(`  ✓ ${theme.name} (${theme.date})`);
    } else {
      totalFailures++;
      totalFixes += fixes.length;
      console.log(`  ✗ ${theme.name} (${theme.date}) — ${fixes.length} fix${fixes.length > 1 ? 'es' : ''}:`);
      for (const fix of fixes) {
        console.log(`      ${fix.mode} ${fix.pair}: ${fix.original} → ${fix.fixed} (${fix.originalRatio}:1 → ${fix.fixedRatio}:1, target ${fix.target}:1)`);
      }
    }
  }

  if (checkOnly) {
    console.log(`\n${themes.length} themes checked, ${totalFailures} had contrast failures.`);
    if (totalFailures > 0) {
      console.log('\n--check mode: no files modified.');
      process.exit(1);
    }
    return;
  }

  console.log(`\n${themes.length} themes checked, ${totalFailures} had issues, ${totalFixes} colors fixed.`);

  if (totalFixes > 0) {
    // Re-audit after fixes — refuse to leave unfixable failures on disk silently.
    const remaining = themes.flatMap((theme) =>
      auditThemeContrast(theme).map((failure) => ({ theme, failure })),
    );
    writeFileSync(THEMES_PATH, JSON.stringify(data, null, 2) + '\n');
    console.log(`\nFixed themes written to ${THEMES_PATH}`);
    if (remaining.length > 0) {
      console.error(
        `\n${remaining.length} contrast failure(s) remain after auto-fix:\n` +
          remaining
            .map(({ theme, failure }) => `  ${theme.name}: ${formatContrastFailures([failure])}`)
            .join('\n'),
      );
      process.exit(1);
    }
  }
}

main();
