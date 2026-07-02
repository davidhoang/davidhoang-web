# Rules — implementation and review

Authoritative spec: `design.md`. This file is the agent checklist distilled from it.

## Before shipping UI

- [ ] Colors via `var(--color-*)` only (no raw hex in new scoped styles)
- [ ] Spacing via `var(--spacing-*)` or theme tokens (`--card-padding`, `--section-spacing`, etc.)
- [ ] Motion via `var(--duration-*)` and `var(--ease-*)`
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
npm run audit:design
```

Strict mode (CI-ready when legacy debt is cleared):

```bash
npm run audit:design:check
```

## Human-led update loop

1. Agent fails the same way twice → record in `coverage-gaps.md`
2. Add concrete rule or example to `design.md`
3. Nav-specific → `.cursor/rules/site-nav-css.mdc`
4. Machine-checkable → `scripts/audit-design-compliance.mjs`
5. Repro fixture → `evals/<name>/`

Do not patch around confusion with one-off code comments.
