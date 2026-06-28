# Eval: theme-aware card component

Read `design.md` and `.agents/skills/product-design/SKILL.md` before writing any code.

Create a new Astro component at `src/components/eval/ThemeCard.astro` that:

- Renders a card with a title (required prop), optional description, and optional slot for body content
- Uses existing primitive classes (`.card`, typography utilities) — no custom hex colors
- Uses spacing tokens only (`var(--spacing-*)` or `--card-padding` in scoped styles)
- Card background is fully opaque
- Includes a `:hover` state that changes color or shadow only — no padding/margin/width changes
- Exports a typed Props interface

Do not modify Navigation.astro or any nav CSS.
