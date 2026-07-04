# AGENTS.md

## Agent design system

Cross-tool product design instructions follow the [Vercel agent design stack](https://vercel.com/blog/teaching-agents-product-design-at-vercel). Canonical skill content lives under `.agents/`; Cursor-specific rules stay in `.cursor/rules/`.

| Layer | Location |
|-------|----------|
| Design contract | `design.md` (spec), `src/design-guide.md` (primitives) |
| **Canonical skill** | **`.agents/skills/product-design/`** (`SKILL.md`, `references/`, `exemplars/`) |
| Cursor discovery | `.cursor/skills/product-design/` (pointer), `.cursor/skills/davidhoang-ui/` (alias) |
| Cursor file rules | `.cursor/rules/design-system.mdc`, `.cursor/rules/site-nav-css.mdc` |
| Lint | `npm run audit:design:check` → `scripts/design-audit/` (CI on every PR) |
| Cloud agent pre-PR | `npm run audit:ui:changed -- --check` (core rules on changed UI files) |
| Strict token lint | `npm run audit:design:strict` (report-only on full codebase) |
| Evals | `evals/` (+ optional `@vercel/agent-eval`) |
| Theme contrast | `npm run audit-contrast` (runs in build) |

**Before UI work:** read `design.md`, then `.agents/skills/product-design/SKILL.md`. Cursor also applies `.cursor/rules/design-system.mdc` on matching files.

**Optional Vercel skills:** `npx skills add vercel-labs/agent-skills --skill web-design-guidelines`

**When agents repeat mistakes:** log in `.agents/skills/product-design/references/coverage-gaps.md`, then update `design.md`, audit script, or `evals/`. See `evals/README.md`.

---

## Cursor Cloud specific instructions

Cloud agents **must** run design linters before committing UI changes:

```bash
# Required before push — core rules on files you changed (matches CI scope for those files)
npm run audit:ui:changed -- --check

# Optional — token/hover/motion rules on changed files only
npm run audit:design:changed -- --check --strict
```

**Read order for UI work:**

1. `design.md` — design contract
2. `.agents/skills/product-design/SKILL.md` — checklist
3. `.agents/skills/product-design/references/rules.md` — layout invariants

**CI enforcement:** every PR runs `npm run audit:design:check` (core rules, full codebase). Do not merge if it fails.

**When you introduce a violation the linter misses:** log it in `.agents/skills/product-design/references/coverage-gaps.md`, add a rule to `scripts/design-audit/rules/`, and extend `tests/designCompliance.test.ts`.

**Rule modules:** `scripts/design-audit/rules/` — `layout-contract`, `hero`, `nav`, `cards`, `colors`, `strict` (motion, hover, spacing, focus-ring, agent-stack).