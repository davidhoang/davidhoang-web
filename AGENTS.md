# AGENTS.md

## Agent design system

Cross-tool product design instructions follow the [Vercel agent design stack](https://vercel.com/blog/teaching-agents-product-design-at-vercel). Canonical skill content lives under `.agents/`; Cursor-specific rules stay in `.cursor/rules/`.

| Layer | Location |
|-------|----------|
| Design contract | `design.md` (spec), `src/design-guide.md` (primitives) |
| **Canonical skill** | **`.agents/skills/product-design/`** (`SKILL.md`, `references/`, `exemplars/`) |
| Cursor discovery | `.cursor/skills/product-design/` (pointer), `.cursor/skills/davidhoang-ui/` (alias) |
| Cursor file rules | `.cursor/rules/design-system.mdc`, `.cursor/rules/site-nav-css.mdc` |
| Lint | `npm run audit:design:check` → `scripts/audit-design-compliance.mjs` (CI on every PR) |
| Evals | `evals/` (+ optional `@vercel/agent-eval`) |
| Theme contrast | `npm run audit-contrast` (runs in build) |

**Before UI work:** read `design.md`, then `.agents/skills/product-design/SKILL.md`. Cursor also applies `.cursor/rules/design-system.mdc` on matching files.

**Optional Vercel skills:** `npx skills add vercel-labs/agent-skills --skill web-design-guidelines`

**When agents repeat mistakes:** log in `.agents/skills/product-design/references/coverage-gaps.md`, then update `design.md`, audit script, or `evals/`. See `evals/README.md`.

---

## Cursor Cloud specific instructions