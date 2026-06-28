# Surface: cards and content blocks

Cards must **never be transparent**. Legibility wins over blur — especially in the hero stack where cards overlap.

## Valid styles

`flat`, `elevated`, `outlined`, `filled` — all opaque. Theme attribute: `[data-card-style]`.

Legacy `glass` is banned. Generator promotes `glass` → `elevated`; hero layouts normalize at runtime.

## Primitives

```html
<div class="card">…</div>
<div class="card card-elevated">…</div>
<div class="card card-outlined">…</div>
<div class="card card-filled">…</div>
<div class="card card-interactive">…</div>  <!-- hover lift via transform -->
```

Agent-built reference: `src/components/eval/ThemeCard.astro` (design-guide demo).

## Hover hygiene (all surfaces)

Allowed on `:hover`: `color`, `background-color`, `border-color`, `box-shadow`, `transform`, `opacity` (not on card fill — use for decorative overlays only).

**Forbidden on `:hover`:** `padding`, `margin`, `gap`, `width`, `height`, `border-width`.

Wrap non-transform hover effects in `@media (hover: hover)`. Resting state must be visually complete on touch.

## Spacing

Use `--card-padding` (theme-tunable, 1–2rem) or `--spacing-*` for internal gaps. See `design.md` § Spacing scale.

## Related surfaces

- **Hero cards:** `src/components/hero/` — motion-only entry, no opacity fade-in
- **Texture cards:** `TextureCard.astro` — optional shader on hover, opaque base
- **Page headers:** `PageHeader.astro` — hero images flush to viewport top (negate `--content-top-padding`)
