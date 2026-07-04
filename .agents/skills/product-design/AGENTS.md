# Product design skill — agent scope

This folder is the **canonical** product-design skill for davidhoang.com. Tool-specific copies under `.cursor/skills/` point here.

## Read order

1. `design.md` (repo root) — design contract
2. `SKILL.md` — workflow and checklist
3. `references/rules.md` — hard rules and review steps
4. Surface docs as needed: `references/surfaces-*.md`
5. `src/design-guide.md` — primitive classes and tokens

## Do not duplicate

- Nav critical rules: `.cursor/rules/site-nav-css.mdc` (Cursor glob targeting)
- Build/lint: `scripts/design-audit/`, `npm run audit:design:check`, `npm run audit:ui:changed`
- Eval fixtures: `evals/` at repo root

## When agents repeat mistakes

1. Log in `references/coverage-gaps.md`
2. Add a concrete rule to `design.md`
3. Extend the audit script if machine-checkable
4. Add an eval under `evals/`
