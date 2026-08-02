import { test, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  auditThemeContrast,
  enforceThemeContrast,
  CONTRAST_PAIRS,
} from '../../scripts/lib/contrast.mjs';
import { rankThemeCandidates } from '../../scripts/lib/theme-ranking.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, 'fixtures');

function loadFixture(name: string) {
  const path = join(FIXTURES, name);
  expect(existsSync(path)).toBe(true);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

test('contrast pair registry covers body/link/muted/nav on key surfaces', () => {
  const labels = CONTRAST_PAIRS.map(([, , , label]) => label);
  expect(labels).toEqual(expect.arrayContaining([
    'body text on background',
    'link on background',
    'muted text on background',
    'text on card background',
    'link on card background',
    'nav text on nav background',
  ]));
  expect(CONTRAST_PAIRS.every(([, , target]) => target >= 4.5)).toBe(true);
});

test('passing fixture has zero contrast failures', () => {
  const theme = loadFixture('passing-theme.json');
  expect(auditThemeContrast(theme)).toEqual([]);
  expect(() => enforceThemeContrast(structuredClone(theme))).not.toThrow();
});

test('failing fixture is detected and cannot pass enforce without mutation to compliant colors', () => {
  const theme = loadFixture('failing-theme.json');
  const failures = auditThemeContrast(theme);
  expect(failures.length).toBeGreaterThan(0);

  const clone = structuredClone(theme);
  // Auto-fix may recover light/dark text; after enforce, audit must be clean or throw.
  try {
    enforceThemeContrast(clone);
    expect(auditThemeContrast(clone)).toEqual([]);
  } catch (error) {
    expect(String(error)).toMatch(/WCAG AA contrast/);
  }
});

test('ranking treats contrast failures as hard safety issues', () => {
  const passing = loadFixture('passing-theme.json');
  const failing = loadFixture('failing-theme.json');

  const result = rankThemeCandidates(
    [
      { id: 'candidate-fail', theme: failing, assessment: { score: 0, changesFromYesterday: 8 } },
      { id: 'candidate-pass', theme: passing, assessment: { score: 1, changesFromYesterday: 0 } },
    ],
    [],
    null,
  );

  expect(result.winner.id).toBe('candidate-pass');
  expect(result.ranked.find((c) => c.id === 'candidate-fail')?.issues.some((i) => i.startsWith('contrast:'))).toBe(true);
});
