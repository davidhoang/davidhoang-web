# Coverage gaps

Log repeated agent mistakes here before promoting them to `design.md`, audit rules, or evals.

Format:

```markdown
## YYYY-MM-DD — short title

**Symptom:** what the agent did wrong
**Fix applied:** design.md section / audit rule / eval added
**Status:** open | resolved
```

---

## 2026-07-04 — Hero layout regressions (top gap + desktop width)

**Symptom:** Agents reintroduced white strip above heroes and partial-width hero images on desktop. Causes: `.glass-border { position: relative }` overriding `.site-nav { position: fixed }`; scoped `width: 100%` on `.page-header` beating layered `100vw` breakout.
**Fix applied:** layout contract in `layout.css` + `MainLayout.astro` critical CSS; `audit-design-compliance.mjs` contract checks + `hero-full-width` / `glass-border-nav` rules; CI step `npm run audit:design:check`; `references/rules.md` § Layout invariants
**Status:** resolved

---

## 2026-07-04 — UI linter stack for cloud agents

**Symptom:** Design skill rules were documented but only partially machine-checked; cloud agents had no scoped pre-PR lint workflow.
**Fix applied:** Modular `scripts/design-audit/` with core + strict rule tiers; `npm run audit:ui:changed`; CI changed-files step; expanded `tests/designCompliance.test.ts`; cloud instructions in `AGENTS.md`
**Status:** resolved

---

**Symptom:** n/a — file created during `.agents/skills/product-design/` setup
**Fix applied:** canonical skill + surface references
**Status:** resolved
