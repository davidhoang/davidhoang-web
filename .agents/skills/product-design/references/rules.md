# Rules — implementation and review

Authoritative spec: `design.md`. This file is the agent checklist distilled from it.

## Layout invariants (framework-controlled — never theme-variable)

These three rules regress often when agents touch nav, heroes, or global CSS. **CI enforces the machine-checkable parts** via `npm run audit:design:check`.

1. **Hero images are full viewport width** — edge to edge, no gutter on the right or left. Implemented in `layout.css` + unlayered critical CSS in `MainLayout.astro` (`width: 100vw; margin-inline: calc(50% - 50vw)`). Do **not** set scoped `width: 100%` on `.page-header--image` or bare `.page-header` (text-only headers use `.page-header--text { width: 100% }` only).

2. **Hero images flush to viewport top** — no strip of `--color-bg` above the image; the nav pill floats over the hero. Implemented via `main#main-content:has(> flush-hero) { padding-top: 0 }`, nav `position: fixed`, and `.glass-border:not(.site-nav)`. Do **not** reintroduce per-page `margin-top: calc(-1 * var(--content-top-padding))` pulls.

3. **Daily themes adjust padding, not margins, for layout rhythm** — theme JSON may tune `--content-padding`, `--section-spacing`, `--card-padding` (see `design.md` § Theme generator). Themes must **not** add structural margins to `main`, heroes, or nav clearance. The generator strips `navigation` and clamps padding ranges in `scripts/generate-daily-theme.mjs`.

**Manual PR smoke test** (any PR touching layout, nav, heroes, themes, or global CSS):

- [ ] `/about` and `/featured` at ≥769px: hero spans full width, no top gap
- [ ] Devtools: `.site-nav` computed `position: fixed`
- [ ] If diff touches `.container`, `nav`, `--content-top-padding`, or `--nav-offset-top`: verify nav at **390px** and **≥769px** (`.cursor/rules/site-nav-css.mdc`)

## Before shipping UI

- [ ] Colors via `var(--color-*)` only (no raw hex in new scoped styles)
- [ ] Spacing via `var(--spacing-*)` or theme tokens (`--card-padding`, `--section-spacing`, etc.)
- [ ] Motion via `var(--duration-*)` and `var(--ease-*)`
- [ ] Motion continuity: no remount/restart on hover; wrapper-aware hover leave; entrance springs vs interaction tweens (see `design.md` § Motion continuity)
- [ ] Cards opaque — `flat`, `elevated`, `outlined`, `filled` only; never `glass`
- [ ] Hover: color, shadow, transform only — no padding/margin/gap/width/height changes
- [ ] Focus rings use `--focus-ring*` tokens
- [ ] Mobile (≤768px): hero forced to `stacked-fan`, grids collapse, container full width
- [ ] Mobile unique experiences: scoped overrides OK for touch-native presentation (see `design.md` § Mobile unique experiences) — do not change nav/container globals
- [ ] Hero card sheet on mobile: iOS-style bottom sheet with swipe-down / swipe-out dismiss
- [ ] Nav untouched unless editing files listed in `surfaces-nav.md`
- [ ] Astro for static UI; React only when client interactivity is required
- [ ] Reuse primitives from `src/styles/global.css` and `src/styles/modules/` first

## After UI changes

```bash
npm run audit:design:check
```

Runs in CI on every PR (`.github/workflows/ci.yml`). Report-only locally:

```bash
npm run audit:design
```

## Human-led update loop

1. Agent fails the same way twice → record in `coverage-gaps.md`
2. Add concrete rule or example to `design.md`
3. Nav-specific → `.cursor/rules/site-nav-css.mdc`
4. Machine-checkable → `scripts/design-audit/rules/` (see `scripts/design-audit/README.md`)
5. Repro fixture → `evals/<name>/`

Do not patch around confusion with one-off code comments.
