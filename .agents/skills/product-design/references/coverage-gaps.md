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

## 2026-07-19 — Multi-column theme gap amplification

**Symptom:** A 12-column theme recipe inherited the standard ultrawide philosophy-grid gap, multiplying a large gap across 11 tracks and overflowing at 1920px even though the static design audit passed.
**Fix applied:** Theme recipes now own a bounded `--spacing-md` column gap; `home-theme-grid-contract` protects the CSS fragments; candidate generation renders the real home page at 390px, 1440px, and 1920px and rejects content overflow; coverage added to `tests/designCompliance.test.ts` and `tests/theme-ranking.test.ts`.
**Status:** resolved

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
