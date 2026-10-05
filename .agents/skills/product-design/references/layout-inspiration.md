# Layout inspiration sources

Canonical data: `src/data/layout-inspiration.ts`.

## useLayouts

- Site: https://uselayouts.com
- Role: **reference** for layout interaction (infinite pan grids, bento, toolbars) — not a runtime dependency for most pages.
- Installed on this repo: `@uselayouts/infinite-grid` via `npx shadcn@latest add @uselayouts/infinite-grid` → `src/components/infinite-grid.tsx` + `src/styles/uselayouts-tailwind.css` (Tailwind island, no preflight).

When adding new layout experiments, check useLayouts for motion/spatial patterns, then implement with site tokens (`var(--color-*)`, `var(--spacing-*)`, `var(--duration-*)`).
