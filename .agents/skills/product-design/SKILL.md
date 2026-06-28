---
name: product-design
description: >-
  Build or review UI for davidhoang.com following the daily-theme design system.
  Use when creating components, pages, CSS, layout changes, visual polish,
  design audits, product design, or when the user mentions design.md,
  design system, theme compatibility, or the product-design skill.
---

# Product design — davidhoang.com

Cross-tool entry point. Scoped context: `AGENTS.md` in this folder.

## Before coding

1. Read `design.md` (repo root) — layout invariants, theme bounds, anti-patterns
2. Read `src/design-guide.md` — tokens, primitive classes, `[data-*]` theme attributes
3. Skim a similar component in `src/components/` for markup patterns
4. Load surface references when touching that area:
   - Nav → `references/surfaces-nav.md` + `.cursor/rules/site-nav-css.mdc`
   - Cards / surfaces → `references/surfaces-cards.md`
   - Tokens / classes → `references/components.md`
   - Hard rules → `references/rules.md`

## Implementation checklist

See `references/rules.md` for the full list. Non-negotiables:

- Tokens only (`var(--color-*)`, `var(--spacing-*)`, `var(--duration-*)`, `var(--ease-*)`)
- Opaque cards — never glass
- Hover: color, shadow, transform — not padding/margin/size
- Nav is framework-controlled — do not theme or unscope

## Component patterns

| Need | Use |
|------|-----|
| Button | `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost` |
| Card | `.card`, `.card-elevated`, `.card-outlined`, `.card-filled` |
| Typography | `.text-heading`, `.text-body`, `.text-muted`, `.text-caption` |
| Layout width | `.container`, `.container-narrow`, `.container-wide` |
| Images | `.img-themed`, `.img-hero`, `.img-thumbnail` |
| Page header | `PageHeader.astro` with `variant="image"` for hero images |
| Theme card example | `src/components/eval/ThemeCard.astro` |

## Review workflow

1. Compare changes against `design.md` and `references/rules.md`
2. Run `npm run audit:design`
3. Optional: [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)

## When agents get it wrong

Log the gap in `references/coverage-gaps.md`, then update `design.md`. See root `AGENTS.md` § Agent design system.
