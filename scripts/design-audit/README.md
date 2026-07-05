# Design audit linter

Machine-checkable enforcement of `design.md` and `.agents/skills/product-design/` for coding agents (Cursor Cloud, local agents, CI).

## Commands

| Command | Scope | Rules | Exit 1 |
|---------|-------|-------|--------|
| `npm run audit:design` | Full codebase | Core | No |
| `npm run audit:design:check` | Full codebase | Core | Yes (CI) |
| `npm run audit:ui:changed -- --check` | Git-changed UI files | Core | Yes |
| `npm run audit:design:changed -- --check --strict` | Git-changed UI files | Core + strict | Yes |
| `npm run audit:design:strict` | Full codebase | Core + strict | No |

## Rule tiers

### Core (CI — always enforced)

| Rule ID | Source | Checks |
|---------|--------|--------|
| `hero-layout-contract` | design.md § Hero | Layout contract fragments in `layout.css`, `MainLayout.astro`, etc. |
| `hero-full-width` | design.md § Hero | No scoped `width:100%` on image heroes |
| `hero-flush-centralized` | design.md § Hero | No per-page margin-top flush pulls |
| `glass-border-nav` | site-nav-css.mdc | `.glass-border` scoped away from `.site-nav` |
| `nav-no-container` | site-nav-css.mdc | No `container` class on `<nav>` |
| `nav-unscoped` | site-nav-css.mdc | No unscoped `nav {}` selectors |
| `no-glass-cards` | design.md § Card opacity | No glass card styles |
| `no-hardcoded-colors` | design.md | No hex in scoped Astro `<style>` blocks |
| `ci-design-audit` | agent stack | Skill/CI/docs reference audit commands |

### Strict (report-only full scan; optional on changed files)

| Rule ID | Checks |
|---------|--------|
| `no-hardcoded-colors-rgb` | rgb/rgba/hsl in scoped Astro styles |
| `hover-dimensional` | padding/margin/gap/width/height in `:hover` |
| `motion-tokens` | Hardcoded transition durations/easing |
| `spacing-tokens` | Hardcoded rem/px padding/margin/gap |
| `focus-ring-token` | Hardcoded outline without `--focus-ring*` |
| `hero-card-opacity` | Hero layouts must not fade in at opacity 0 |

Legacy files with known debt are listed in `shared.mjs` → `STRICT_GRANDFATHER`.

## Adding a rule

1. Log the gap in `.agents/skills/product-design/references/coverage-gaps.md`
2. Add a rule module under `rules/` or extend an existing one
3. Wire it in `index.mjs`
4. Add a test in `tests/designCompliance.test.ts`
5. If core-worthy, ensure current codebase passes; otherwise use strict tier

## Architecture

```
scripts/
  audit-design-compliance.mjs   # CLI entry (thin wrapper)
  audit-ui.mjs                  # Cloud agent umbrella
  design-audit/
    index.mjs                   # Runner + CLI
    shared.mjs                  # File walk, skip lists, git diff
    rules/
      layout-contract.mjs
      hero.mjs
      nav.mjs
      cards.mjs
      colors.mjs
      strict.mjs
```
