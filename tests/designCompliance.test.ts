import { describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { runDesignAudit, formatReport } from '../scripts/design-audit/index.mjs';

const ROOT = process.cwd();
const script = join(ROOT, 'scripts/audit-design-compliance.mjs');

describe('design compliance audit (CI core)', () => {
  it('passes strict layout and hero rules (same as CI)', () => {
    const out = execSync(`node ${script} --check`, { encoding: 'utf-8' });
    expect(out).toContain('Design compliance: no violations found.');
  });

  it('exports runDesignAudit with zero core violations', () => {
    const violations = runDesignAudit({ strict: false });
    expect(violations).toHaveLength(0);
  });

  it('exports runDesignAudit with zero strict violations', () => {
    const violations = runDesignAudit({ strict: true });
    expect(violations).toHaveLength(0);
  });
});

describe('agent design stack contract', () => {
  const requiredRefs = [
    { file: '.github/workflows/ci.yml', needle: 'audit:design:check' },
    { file: 'design.md', needle: 'npm run audit:design' },
    { file: '.agents/skills/product-design/SKILL.md', needle: 'audit:design:check' },
    { file: 'AGENTS.md', needle: 'audit:design:check' },
  ];

  for (const { file, needle } of requiredRefs) {
    it(`${file} references design audit`, () => {
      expect(existsSync(join(ROOT, file))).toBe(true);
      expect(readFileSync(join(ROOT, file), 'utf-8')).toContain(needle);
    });
  }
});

describe('layout contract rules', () => {
  it('layout.css contains hero full-bleed contract', () => {
    const content = readFileSync(join(ROOT, 'src/styles/modules/layout.css'), 'utf-8');
    expect(content).toContain('width: 100vw');
    expect(content).toContain('margin-inline: calc(50% - 50vw)');
    expect(content).toContain('padding-top: 0');
  });

  it('shared-components.css scopes glass-border away from site nav', () => {
    const content = readFileSync(join(ROOT, 'src/styles/modules/shared-components.css'), 'utf-8');
    expect(content).toContain('.glass-border:not(.site-nav)');
  });
});

describe('strict rule modules', () => {
  it('formatReport marks strict violations as failing', () => {
    const fakeViolations = [
      {
        file: 'test.astro',
        line: 1,
        rule: 'no-hardcoded-colors',
        detail: 'test',
        severity: 'error',
      },
    ];
    const report = formatReport(fakeViolations, { strict: true });
    expect(report.exitCode).toBe(1);
    expect(report.text).toContain('strict');
  });

  it('hero layout files use opacity 1 entry (no fade-in)', () => {
    const layoutsDir = join(ROOT, 'src/components/hero/layouts');
    const files = ['StackedFanLayout.tsx', 'EditorialLayout.tsx', 'ScatteredLayout.tsx', 'RolodexLayout.tsx'];
    for (const name of files) {
      const content = readFileSync(join(layoutsDir, name), 'utf-8');
      expect(content).not.toMatch(/initial=\{\{\s*opacity:\s*0/);
    }
  });
});

describe('audit CLI flags', () => {
  it('supports --json output', () => {
    const out = execSync(`node ${script} --json`, { encoding: 'utf-8' });
    const parsed = JSON.parse(out);
    expect(parsed).toHaveProperty('violations');
    expect(parsed).toHaveProperty('exitCode', 0);
  });
});
