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
| Cloud agent pre-PR | `npm run audit:ui:changed -- --check --strict` (core + strict on changed UI files) |
| Strict token lint | `npm run audit:design:strict` (report-only on full codebase) |
| Evals | `evals/` (+ optional `@vercel/agent-eval`) |
| Theme contrast | `npm run audit-contrast` (build auto-fix) · `npm run audit-contrast:check` · `evals/theme-contrast/` |

**Before UI work:** read `design.md`, then `.agents/skills/product-design/SKILL.md`. Cursor also applies `.cursor/rules/design-system.mdc` on matching files.

**Optional Vercel skills:** `npx skills add vercel-labs/agent-skills --skill web-design-guidelines`

**When agents repeat mistakes:** log in `.agents/skills/product-design/references/coverage-gaps.md`, then update `design.md`, audit script, or `evals/`. See `evals/README.md`.

---

## Cursor Cloud specific instructions

### Environment bootstrap

- Dependencies and `public/images` sync run via `.cursor/environment.json` `install` (`npm install` + image mirror).
- The Astro dev server is started by the `astro-dev` terminal on port **4321** (`npm run dev -- --host 0.0.0.0 --port 4321`).
- Smoke-check before UI work: `curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4321/` (expect `200`).
- Unit tests: `npm test`. Design lint before UI commits: commands below.
- `ANTHROPIC_API_KEY` is only required for `npm run generate-theme`, not for normal local development.

Cloud agents **must** run design linters before committing UI changes:

```bash
# Required before push — core + strict rules on files you changed
npm run audit:ui:changed -- --check --strict

# Optional — full-codebase core rules (same as CI always)
npm run audit:design:check
```

**Read order for UI work:**

1. `design.md` — design contract
2. `.agents/skills/product-design/SKILL.md` — checklist
3. `.agents/skills/product-design/references/rules.md` — layout invariants

**CI enforcement:** every PR runs `npm run audit:design:check` (core rules, full codebase). Do not merge if it fails.

**When you introduce a violation the linter misses:** log it in `.agents/skills/product-design/references/coverage-gaps.md`, add a rule to `scripts/design-audit/rules/`, and extend `tests/designCompliance.test.ts`.

**Rule modules:** `scripts/design-audit/rules/` — `layout-contract`, `hero`, `nav`, `cards`, `colors`, `motion-continuity` (hero remount/hover flicker), `strict` (motion, hover, spacing, focus-ring, agent-stack).