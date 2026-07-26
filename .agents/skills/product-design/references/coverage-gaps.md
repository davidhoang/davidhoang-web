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

## 2026-08-01 — Secondary page layout + strict CI on changed files

**Symptom:** Advising/Investing/Now/Works each reinvented intro/section/list CSS; `design.md` still listed `--nav-height: 40px` while code used 48/56; strict token rules were optional for cloud agents; 404 and daily-themes were grandfathered with hardcoded spacing/motion/colors.
**Fix applied:** `.content-page*` primitives in `layout.css`; nav height corrected in `design.md`; CI + AGENTS require `--strict` on changed UI files; 404 tokenized; themes-explorer styles moved to `themes-explorer.css` with tokens and danger color vars; both pages removed from `STRICT_GRANDFATHER`.
**Status:** resolved

---

## 2026-07-26 — iPad Magic Keyboard hero hover flicker

**Symptom:** Homepage hero cards remounted animated WebP on every hover activate and cleared `hoveredCard` when Safari nulls `relatedTarget`, causing dramatic still↔animated / lift flicker on iPad Pro + Magic Keyboard (vestibular risk). Regression path: PR #104 fixed it; a later “restart config card animation on hover” remount (`animPlayKey`) reintroduced it.
**Fix applied:** Restore continuous layered media (no remount key); `elementFromPoint` + delayed hover clear; gate JS hover lift/media via `shouldEnablePointerHoverMotion()` / `data-hover-motion`; design.md § Motion continuity banned-pattern table + rule 6; CI core rule `hero-motion-continuity` in `scripts/design-audit/rules/motion-continuity.mjs`.
**Status:** resolved

---

## 2026-07-25 — Malformed spacing token interpolation (`0.var(--…)`)

**Symptom:** A rem→token codemod replaced substrings inside values like `0.2rem` / `0.4rem` / `0.72rem`, producing invalid CSS such as `0.var(--spacing-xl)` and `0.7var(--spacing-xl)`. Featured, About, Notes, and several components shipped broken spacing.
**Fix applied:** Restored correct `calc(var(--spacing-*) …)` values; core audit rule `malformed-spacing-token` in `scripts/design-audit/rules/tokens.mjs` fails CI on `\d+\.var(--` patterns.
**Status:** resolved

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
