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
    { file: '.github/workflows/ci.yml', needle: '--strict' },
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

  it('home theme grids use bounded multi-column gaps and a mobile collapse', () => {
    const content = readFileSync(join(ROOT, 'src/styles/pages/home.css'), 'utf-8');
    expect(content).toContain('grid-template-columns: repeat(12, minmax(0, 1fr))');
    expect(content).toContain('column-gap: var(--spacing-md)');
    expect(content).toContain('[data-grid-style] .portfolio-grid > .portfolio-content');
    expect(content).toContain('grid-column: 1');
  });
});

describe('CSS containment contract (PC-8)', () => {
  it('containment.css isolates cards and list rows without wrapping the page', () => {
    const content = readFileSync(join(ROOT, 'src/styles/modules/containment.css'), 'utf-8');
    expect(content).toContain('contain: layout paint');
    expect(content).toContain('content-visibility: auto');
    expect(content).toContain('isolation: isolate');
    expect(content).not.toMatch(/\.content-filter-wrapper\s*\{[^}]*contain\s*:/);
    expect(content).not.toMatch(/^\s*will-change:\s*filter/m);
    expect(content).not.toMatch(/\.hero-card\s*\{[^}]*content-visibility/);
  });

  it('design.md documents forbidden wrapper/hero containment', () => {
    const content = readFileSync(join(ROOT, 'design.md'), 'utf-8');
    expect(content).toContain('### CSS containment (performance)');
    expect(content).toContain('contain: strict');
    expect(content).toContain('--hero-cards-tuck');
  });
});

describe('token integrity rules', () => {
  it('wires malformed-spacing-token into core audit and keeps Featured clean', () => {
    expect(readFileSync(join(ROOT, 'scripts/design-audit/rules/tokens.mjs'), 'utf-8')).toContain(
      'malformed-spacing-token',
    );
    expect(readFileSync(join(ROOT, 'scripts/design-audit/index.mjs'), 'utf-8')).toContain(
      'auditMalformedSpacingTokens',
    );
    const featured = readFileSync(join(ROOT, 'src/pages/featured.astro'), 'utf-8');
    expect(featured).not.toMatch(/\d+\.var\(--/);
    expect(featured).toContain('calc(var(--spacing-sm) + 0.22rem)');
    expect(featured).toContain('calc(var(--spacing-xs) - 0.05rem)');
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

describe('hero motion continuity contract', () => {
  it('CardBase does not remount media on hover activate', () => {
    const content = readFileSync(join(ROOT, 'src/components/hero/CardBase.tsx'), 'utf-8');
    expect(content).not.toMatch(/\banimPlayKey\b/);
    expect(content).not.toMatch(/key=\{`hero-anim-/);
    expect(content).not.toMatch(/isHeroMediaActive\s*\?\s*['"]card-hero-image--drift['"]/);
    expect(content).toContain('loadActiveMedia');
    expect(content).toContain('data-visible');
  });

  it('hero layouts and CardStackHero keep hybrid-safe hover wiring', () => {
    const stack = readFileSync(join(ROOT, 'src/components/CardStackHero.tsx'), 'utf-8');
    expect(stack).toContain('createStableCardHoverSetter');

    const layouts = [
      'StackedFanLayout.tsx',
      'EditorialLayout.tsx',
      'ScatteredLayout.tsx',
      'RolodexLayout.tsx',
      'CinematicLayout.tsx',
    ];
    for (const name of layouts) {
      const content = readFileSync(join(ROOT, 'src/components/hero/layouts', name), 'utf-8');
      expect(content).toContain('usePointerHoverMotionEnabled');
      expect(content).toContain('pointerHoverDisabled');
      expect(content).not.toMatch(
        /onMouseEnter=\{\(\)\s*=>\s*!selectedCard\s*&&\s*onCardHover\s*\(/
      );
      // Hybrid gating must not be folded into hoverDisabled (kills keyboard focus lift).
      expect(content).not.toMatch(
        /hoverDisabled\s*=\s*[^=\n]*!pointerHoverMotion/
      );
    }
  });

  it('design.md documents banned remount-on-hover patterns', () => {
    const content = readFileSync(join(ROOT, 'design.md'), 'utf-8');
    expect(content).toContain('No remount-on-hover');
    expect(content).toContain('animPlayKey');
    expect(content).toContain('shouldEnablePointerHoverMotion');
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
