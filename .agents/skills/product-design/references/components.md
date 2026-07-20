# Components and tokens

Full primitive reference: `src/design-guide.md`.

## Core color tokens

`--color-text`, `--color-bg`, `--color-link`, `--color-link-hover`, `--color-border`, `--color-muted`, `--color-sidebar-bg`, `--color-card-bg`, `--color-nav-bg`, `--color-nav-text`

## Spacing tokens

`--spacing-xs` (4px) through `--spacing-3xl` (64px).

Theme-tunable: `--card-padding`, `--content-padding`, `--section-spacing`, `--container-padding`.

## Motion tokens

Durations: `--duration-fast` … `--duration-slowest`. Easings: `--ease-inertia`, `--ease-standard`, `--ease-emphasized`, `--ease-spring`.

## Theme data attributes on `<html>`

| Attribute | Values |
|-----------|--------|
| `data-theme` | `light`, `dark` |
| `data-card-style` | `flat`, `elevated`, `outlined`, `filled` |
| `data-hero-layout` | `stacked-fan`, `editorial`, `scattered`, `rolodex`, `cinematic` |
| `data-grid-style` | `asymmetric`, `split`, `magazine`, `sidebar` (`standard` omits it) |
| `data-link-style` | `underline`, `highlight`, `animated-underline`, `color-only`, `bracket` |
| `data-bg-texture` | `none`, `grain`, `dots`, `grid`, `gradient` |
| `data-image-style` | `vivid`, `muted`, `grayscale`, `duotone` |
| `data-image-hover` | `zoom`, `lift`, `colorize`, `glow`, `none` |
| `data-footer-style` | `classic`, `minimal`, `brutalist`, `inverted`, `editorial`, `gradient`, `boxed`, `retro`, `split`, `marquee` |

## Key file locations

| Concern | Path |
|---------|------|
| Tokens | `src/styles/modules/variables.css` |
| Primitives | `src/styles/global.css`, `src/styles/modules/shared-components.css` |
| Theme overrides | `src/styles/modules/theme-variations.css` |
| Nav | `src/components/Navigation.astro`, `src/styles/modules/nav.css` |
| Hero | `src/components/CardStackHero.tsx` |
