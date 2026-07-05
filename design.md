---
name: davidhoang.com
description: Personal site with a daily auto-generated theme system. Themes vary typography, color, padding, and surface treatments — never layout positioning.
defaultLayout:
  nav:
    height: 40px
    offsetTop: 24px
    contentTopPadding: calc(var(--nav-height) + var(--nav-offset-top) + 2rem)
    desktop:
      minMaxWidth: min(480px, calc(100vw - 40px))
      padding: 24px 34px
    tablet:
      width: calc(100% - 32px)
      padding: 0 16px
    mobile:
      width: calc(100% - 2rem)
      maxWidth: 400px
      padding: 0 16px
  breakpoints:
    small: 320px
    mobileSmall: 520px
    tablet: 768px
    desktopSmall: 1024px
    desktop: 1440px
    wide: 1920px
    ultrawide: 2560px
  mobileSafety:
    forceHeroLayout: stacked-fan
    forceContainerMaxWidth: 100%
    clipCardStackOverflow: true
    collapseMultiColumnGrids: true
  mobileExperiences:
    allowUniquePresentation: true
    heroCardSheet: ios-modal
    dismissGestures:
      - swipe-down
      - swipe-out
themeGenerator:
  containerMaxWidth:
    min: 640px
    max: 1200px
    default: 1100px
  contentPadding:
    min: 1rem
    max: 2rem
    default: 1.5rem
  sectionSpacing:
    min: 2rem
    max: 6rem
    default: 4rem
  borderRadius:
    min: 0px
    max: 24px
    default: 8px
    pillOnly: 9999px
  cardPadding:
    min: 1rem
    max: 2rem
  cardStyles:
    - flat
    - elevated
    - outlined
    - filled
  gridStyles:
    - standard
    - asymmetric
    - split
    - magazine
    - sidebar
  gridContainerHarmony:
    standard: 640px-1200px
    asymmetric: 1000px-1200px
    split: 1000px-1200px
    magazine: 1100px-1200px
    sidebar: 1000px-1200px
  heroLayouts:
    - stacked-fan
    - editorial
    - scattered
    - rolodex
---

## For AI agents

This file is the **design contract** for coding agents (Cursor, Claude Code, etc.). Before generating or editing UI:

1. Read this document and `src/design-guide.md`
2. Follow `.agents/skills/product-design/SKILL.md` and `.cursor/rules/design-system.mdc`
3. Run `npm run audit:design` after CSS/component changes

If you violate a rule repeatedly, a human should add a concrete example here rather than patching around it in code.

---

## Overview

This site rebuilds its visual identity daily via `scripts/generate-daily-theme.mjs`. A Claude API call returns a JSON theme that is applied through CSS custom properties at SSR time. Themes are constrained to vary along axes that don't risk layout breakage. Anything that touches viewport-dependent positioning is fixed across themes.

**What themes vary:** typography (fonts, weights, letter-spacing, line-height, transforms, scale ratio), color (full light/dark palettes), padding & spacing, surface treatments (card style, shadow, image filters), optional textures and shaders.

**What themes do not vary:** navigation (style, height, padding), hero structural offset, nav clearance, section margin scaffolding. These are framework-controlled.

This document is the authoritative spec. The theme generator's prompt (`scripts/theme-prompt.md`) and validators (`scripts/generate-daily-theme.mjs`) defer to it.

The two sections below split the spec by ownership:

- **[Default layout](#default-layout)** — the canonical, non-variable site structure. These rules are enforced by the framework (Astro components, global CSS, React layout components) and are immune to theme overrides.
- **[Theme generator](#theme-generator)** — the rules a daily theme must satisfy. Bounded ranges, required harmony, and what gets clamped if values drift out of range.

---

## Default layout

The canonical site structure. Themes cannot override anything in this section.

### Navigation

The nav is a fixed floating-pill defined in `src/components/Navigation.astro`. Theme JSON cannot vary nav style, height, or padding — the generator strips any `navigation` field from theme output (`scripts/generate-daily-theme.mjs`).

| Viewport | Width | Inner padding |
|---|---|---|
| ≤520px | `calc(100% - 2rem)`, max 400px | `0 16px` |
| 521–768px | `calc(100% - 32px)` | `0 16px` |
| 769–1024px | `min(440px, calc(100vw - 40px))` | `24px 30px` |
| ≥1025px | `min(480px, calc(100vw - 40px))` | `24px 34px` |

`--nav-height` is fixed at `40px` and `--nav-offset-top` at `24px`, so `--content-top-padding` resolves to a stable value across themes. Anything that depends on this (sticky sidebars, anchor `scroll-margin-top`, the hero dot-grid `top` calc) can rely on it.

### Spacing scale

All `padding`, `margin`, and `gap` declarations must come from one of two token sources. Hardcoded rem or px values are not permitted in new code. Existing files are migrating incrementally, prioritized by traffic and theme-sensitivity.

**1. Fixed component spacing** — use `--spacing-*` from `variables.css`:

| Token | Value | When to use |
|---|---|---|
| `--spacing-xs` | 0.25rem (4px) | Micro gaps (icon ↔ label) |
| `--spacing-sm` | 0.5rem (8px) | Tight padding (chips, dense buttons) |
| `--spacing-md` | 1rem (16px) | Standard inset (card body, list items) |
| `--spacing-lg` | 1.5rem (24px) | Comfortable padding (default card) |
| `--spacing-xl` | 2rem (32px) | Generous inset (section interior) |
| `--spacing-2xl` | 3rem (48px) | Large gap (hero → next section) |
| `--spacing-3xl` | 4rem (64px) | Dramatic break (page-level rhythm) |

**2. Theme-overridable spacing** — use these for any value a theme should be able to tune:

| Token | Default | Theme range | Maps to |
|---|---|---|---|
| `--card-padding` | 1.5rem | 1–2rem | `.card`, `.node-card` insets |
| `--content-padding` | 2rem | 1–2rem | Section horizontal inset |
| `--section-spacing` | 4rem | 2–6rem | Vertical rhythm between sections |
| `--container-padding` | clamp(1rem, 3vw, 2rem) | (fluid) | Container outer padding |

**Picking the right tier:** if a theme should be able to tune the value (e.g., dramatic vs dense layouts), use the theme-variable tokens. If it's purely local (a button's internal gap, a metadata row), use `--spacing-*`. When in doubt, `--spacing-*` is the safer default — it doesn't drift across themes.

### Hover state hygiene

Hover states must not change dimensional properties. The following are **immutable across `:hover`**:

- `padding`, `margin`, `gap`
- `width`, `height`
- `min-width`, `max-width`, `min-height`, `max-height`
- `border-width` (changes layout the same way as padding)

The only properties allowed to change on hover are:

- `color`, `background-color`, `border-color`
- `box-shadow`
- `transform` (auto-stripped on touch via the `(hover: none)` rule — see [Hover states](#hover-states))
- `opacity`

**Why:** dimensional hover changes cause iOS sticky-hover layout jumps after taps (the recurring nav padding bug), cumulative layout shift on desktop when hover triggers during scroll, and inconsistent feel between mouse, trackpad, and stylus pointers. The expand-on-hover sentient-nav animation in `Navigation.astro` predates this rule and is grandfathered, but the pattern is not extended elsewhere — when that file is refactored, dimensional hover effects move into `transform: scale()` so the layout stays stable.

### Hero image padding

Page hero images (writing/notes/about, anywhere `PageHeader variant="image"` is used) must sit flush to the viewport top with no padding above them — the floating nav pill should appear over the image, not below a strip of page background.

**Framework rule (single source of truth):** `src/styles/modules/layout.css` — when `main#main-content` contains a registered flush hero (`.page-header--image`, `.note-hero`, `.layout-hero-flush`, `.writing-post__hero`), `main` gets `padding-top: 0`. Full-bleed breakout (`width: 100vw; margin-inline: calc(50% - 50vw)`) lives in the same block and is **mirrored unlayered** in `MainLayout.astro` critical CSS so scoped component `width: 100%` cannot shrink heroes inside `.container`. Do **not** set `width: 100%` on `.page-header--image` (text-only headers may use `width: 100%`).

Heavy-shader themes paint `main.container` as a card — `theme-variations.css` must also set `padding-top: 0` on hero pages (see the `main.container:has(...)` override there).

**Nav positioning:** `.site-nav` must stay `position: fixed` so it does not consume document flow (which would push heroes down by `--nav-height`). Never apply unscoped `.glass-border { position: relative }` to the site nav — use `.glass-border:not(.site-nav)` (see `shared-components.css`).

Implementations: `layout.css` (hero flush), `nav.css` + `shared-components.css` (nav fixed), `PageHeader.astro`, `notes/[...slug].astro` (`.note-hero`), `WritingPost.astro` (`.writing-post__hero`).

### Background patterns

**One geometric pattern at a time.** The home page hero owns its dot-grid background (`.card-stack-section::before` in `src/pages/index.astro`); when a theme also picks `background.texture: "dots"` or `"grid"`, both render and produce a muddy double-pattern. The CSS rule at the bottom of `theme-variations.css` suppresses the page-wide texture on any page that contains a `.card-stack-section` (currently just home). Other pages can still use any texture freely.

`grain` and `gradient` textures don't conflict — they're allowed everywhere.

### Hero

The hero (`src/components/CardStackHero.tsx`) renders one of four structural templates: `stacked-fan` (default), `editorial`, `scattered`, `rolodex`. The theme picks the template; the framework controls positioning.

Vertical offset, full-width breakout, and section margin are not theme-variable — themes select the *shape* of the hero, not where it sits.

**Card entrance animation:** hero cards never reveal via `opacity: 0 → 1`. A fade-in renders the cards transparent during the transition, which violates the [card opacity rule](#card-opacity). All hero layouts use motion-only entries — cards start stacked at the layout's origin (or near it) at `scale ~0.94` and fully opaque, then animate to their final position with spring physics and a per-card stagger. This reads as "dealing the cards" rather than "fading them in."

The pattern: `initial.opacity = 1`, `animate.opacity = isOtherSelected ? dim : 1` (the `isOtherSelected` dim is a runtime click-state, not an entry effect). Implemented across `StackedFanLayout`, `EditorialLayout`, `ScatteredLayout`, `RolodexLayout`, and `CinematicLayout` in `src/components/hero/layouts/`.

### Mobile layout safety

At ≤768px, the framework actively overrides risky theme-driven layout choices. Mobile is the most fragile breakpoint and the most common; layout decisions that work on desktop frequently overflow on phones, so we strip variation rather than try to scale it.

**Forced overrides at ≤768px:**

- **Hero layout** — always renders as `stacked-fan` regardless of `hero.layout` value. `editorial`, `scattered`, `rolodex` are desktop-only because they assume horizontal canvas. Implemented in `CardStackHero.tsx` via `matchMedia('(max-width: 768px)')`.
- **Container width** — `--container-max-width` is overridden to `100%`. Theme-set values (e.g., a narrow 640px container) become irrelevant; the page fills the viewport with safe gutters from `--content-padding`.
- **Card stack overflow** — `card-stack-section` clips horizontally regardless of `data-hero-layout`. Belt-and-suspenders for any layout that JS hasn't downgraded.
- **Grid columns** — multi-column grids (`asymmetric`, `split`, `magazine`, `sidebar`) collapse to single column.

**Why this exists:** themes that look striking on a 1440px laptop frequently break on a 390px phone — editorial split-screens cascade past the viewport, narrow containers ignore the actual viewport width, and asymmetric grids produce overflow when columns can't fit. Rather than ask each theme to declare mobile-correct behavior, we lock mobile to a conservative baseline.

### Mobile unique experiences

Mobile (≤768px) is allowed — and encouraged — to **override presentation** for touch-native interactions that would feel wrong on desktop. These overrides are **additive**: they scope to mobile viewport tiers (`data-viewport-tier="mobile"` / `"compact"`) or mobile-only components, and must not change nav, container globals, or theme safety nets above.

**What mobile may override:**

- **Hero card expand** — on phones, selected hero cards present as an iOS-style bottom sheet (`.card-hero-fullscreen-stage--sheet`) instead of the centered desktop modal. Implemented in `StackedFanLayout.tsx` + `MobileHeroSheet.tsx`.
- **Dismiss gestures** — swipe down or swipe out (horizontal) to close the sheet, in addition to backdrop tap and Escape. Drag uses `transform` only — no layout dimension changes.
- **Motion entry** — sheets slide up from the viewport bottom; fan cards keep motion-only deal animation (opacity stays 1).
- **Touch affordances** — grabber handle, `:active` press feedback, scrollable sheet body with safe-area insets.

**What mobile must not override:**

- Nav markup, height, or unscoped `nav {}` / `.container {}` rules (see `.cursor/rules/site-nav-css.mdc`)
- Theme-driven layout positioning outside scoped mobile components (grids still collapse; hero layout still forced to `stacked-fan`)
- Card opacity rule — sheets stay opaque
- Hover dimensional changes (use `:active` or drag transforms instead)

**Implementation pattern:** detect mobile via `isMobileHeroViewport()` or `[data-viewport-tier]`; apply mobile-only CSS classes and React branches; keep desktop path unchanged.


All transition timings and easings live in `src/styles/modules/variables.css`. New components must use these tokens — never hardcode `0.3s` or `cubic-bezier(...)` literals in `transition:` declarations.

**Easing tokens** (use `var(--ease-*)`):

| Token | Curve | When to use |
|---|---|---|
| `--ease-inertia` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Default ease-out for general motion |
| `--ease-inertia-smooth` | `cubic-bezier(0.33, 1, 0.68, 1)` | Softer ease-out for larger motion |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Material standard — UI state changes |
| `--ease-emphasized` | `cubic-bezier(0.22, 1, 0.36, 1)` | Decelerated — entrance reveals |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Slight overshoot — buttons, inputs |

**Duration tokens** (use `var(--duration-*)`):

| Token | Value | When to use |
|---|---|---|
| `--duration-fast` | 0.15s | Micro-interactions, active states |
| `--duration-normal` | 0.2s | Standard feedback (buttons, toggles) |
| `--duration-slow` | 0.3s | Component transitions (cards, panels) |
| `--duration-slower` | 0.4s | Layout shifts (nav, modals) |
| `--duration-slowest` | 0.6s | Theme crossfades, page transitions |

The View Transitions API (used in `MainLayout.astro` and `BlogPost.astro`) consumes easing as JS strings — those values can't reference CSS variables and stay literal.

### Motion continuity

Interactive motion must feel **fluid and uninterrupted**. Animations must never visibly restart when pointer state changes (hover, focus, or moving between adjacent targets).

**Rules:**

1. **No remount-on-hover** — do not swap React `key`, conditionally mount/unmount media, or toggle CSS classes that restart `@keyframes` when hover moves between siblings. Keep both states in the DOM and crossfade with `opacity` (or `visibility`) so the animation timeline continues.
2. **No idle frame between hovers** — when moving between cards in a group, do not clear hover state on `mouseleave` if the pointer entered another card in the same `.cards-wrapper`. Use `handleCardHoverLeave()` from `src/components/hero/cardHover.ts` (checks `relatedTarget` against the wrapper).
3. **Separate entrance from interaction** — one-time deal/entrance animations use spring physics; after `hasAnimatedIn`, hover and layout shifts use **tween** transitions (`HERO_HOVER_TWEEN` in `cardHover.ts`, aligned with `--ease-emphasized`). Do not mix spring return paths with `whileHover` tweens on the same properties.
4. **Pause, don't reset** — looping video or drift motion pauses when idle; do not reset `currentTime` or re-add animation classes on every hover toggle.
5. **Prefer transform/opacity** — state changes animate via `transform` and `opacity` only (see [Hover state hygiene](#hover-state-hygiene)). Filter/brightness shifts may crossfade but must not remount elements.

**Hero reference:** `CardBase.tsx` (layered hero media), `StackedFanLayout.tsx` (post-entrance tween + wrapper-aware hover), `card-stack-hero.css` (`.card-hero-image--layer`, continuous drift).

### Focus ring

Keyboard focus indicators are sourced from a single token set. Component overrides MUST use these tokens — never hardcode `outline: 2px solid var(--color-link)`.

```css
--focus-ring-width: 2px;
--focus-ring-offset: 3px;
--focus-ring-color: var(--color-link);
--focus-ring: var(--focus-ring-width) solid var(--focus-ring-color);
```

The global rule in `src/styles/modules/accessibility-responsive.css` covers all standard interactive elements via `:where()` (zero specificity, easy to override). When a component needs a custom focus treatment (e.g., inset outline on hero cards), override only the rules that need to change and inherit the rest.

The `forced-colors` block (Windows High Contrast) intentionally uses system `Highlight` instead of the token — keep that.

### Hover states

Hover affordances (lift, shadow growth, color shift) are **desktop-only**. iOS Safari applies `:hover` briefly after a tap and the styles persist until the user taps elsewhere — so on touch devices, lift animations get "stuck" and read as a broken selected state.

A global rule in `src/styles/modules/accessibility-responsive.css` strips `transform` inside `:hover` at `@media (hover: none)`. This is the safety net.

**Convention for new hover effects:**

- `transform` on hover is automatically neutralized on touch — no extra work needed.
- For other hover side-effects (`box-shadow`, `background-color`, `color`), prefer wrapping in `@media (hover: hover)` so they don't fire on tap. Existing nav (`Navigation.astro`) and link rules (`links.css`) already follow this pattern.
- Resting state must be the visually complete state. If the design relies on hover to communicate something, it's broken on touch by definition.

### Breakpoints

| Name | Width | Notes |
|---|---|---|
| `small` | 320px | Smallest phone — design floor |
| `mobileSmall` | 520px | Compact phones (boundary for nav resize) |
| `tablet` | 768px | **Mobile/desktop boundary** — mobile safety overrides apply at this breakpoint and below |
| `desktopSmall` | 1024px | Tablet landscape / small laptop |
| `desktop` | 1440px | Standard laptop — design center |
| `wide` | 1920px | Large display |
| `ultrawide` | 2560px | Design ceiling |

---

## Theme generator

The rules a daily theme must satisfy. Out-of-range values are clamped post-generation by the validators in `scripts/generate-daily-theme.mjs`.

### Container width

`layout.containerMaxWidth` caps the main content column. It must accommodate whatever `gridStyle` the theme picks:

| gridStyle | minimum containerMaxWidth |
|---|---|
| `standard` | 640px |
| `asymmetric` | 1000px |
| `split` | 1000px |
| `magazine` | 1100px |
| `sidebar` | 1000px |

The generator auto-bumps `containerMaxWidth` if it's too small for the chosen grid (`generate-daily-theme.mjs:614-619`).

### Content padding

`layout.contentPadding` maps to `--content-padding`, the horizontal section inset.

- **Range:** 1rem–2rem.
- **Floor of 1rem is non-negotiable.** Some pages (shader themes on the home page) zero out their container's horizontal padding, so anything below 1rem causes text and forms to sit flush against the viewport edge.
- **Ceiling of 2rem** prevents narrow columns from feeling cramped at smaller breakpoints.

### Section spacing

`layout.sectionSpacing` maps to `--section-spacing` and is also used as grid gap.

- **Range:** 2rem–6rem.
- **Tinted backgrounds need ≥2rem** of breathing room — dense themes (under 2rem) should only run on white backgrounds.
- **Cap at 4rem when `containerMaxWidth` ≤ 900px** — a 6rem gap inside a narrow container produces awkward column proportions.

### Border radius

`layout.borderRadius` is the global radius applied to cards, images, and most surfaces.

- **Range:** 0px–24px.
- **9999px is reserved for pills** (chips, the nav itself). Never use it as the global radius — non-1:1 elements turn into ovals.

### Card padding

`cards.padding` maps to `--card-padding`.

- **Range:** 1rem–2rem.
- **Above 2rem** is dramatic on desktop but oppressive on phones; the framework does not auto-shrink card padding, so the resting value must already work everywhere.
- **Below 1rem** with `outlined` or `filled` card styles produces cramped color boundaries — the generator auto-promotes to `elevated` when this happens (`generate-daily-theme.mjs:732-736`).

### Card opacity

**Cards must never be transparent.** Legibility wins over aesthetic — content laid behind glassmorphism (logos, text, images) reads as broken even when blur is heavy, especially in the hero card stack where multiple cards overlap.

- Valid `cards.style` values: `flat`, `elevated`, `outlined`, `filled` — all opaque.
- The legacy `glass` style is removed; the generator promotes any `cards.style: "glass"` to `"elevated"` post-generation, and the React hero layouts normalize `data-card-style="glass"` to `elevated` at runtime so any leftover themes render correctly.
- If a theme needs a softer surface, drop saturation on `--color-card-bg` rather than reaching for transparency.

### Surface harmony

When `--color-bg` is tinted (anything other than `#ffffff`), the surrounding surfaces must form a smooth tonal hierarchy:

- `--color-card-bg` should be within ~5% lightness of `--color-bg`, same hue.
- `--color-sidebar-bg` should be a close tonal neighbor.
- `--color-nav-bg` must blend with the page — never a hard color band.

The generator auto-realigns surface hues that drift more than 30° from `--color-bg` (`generate-daily-theme.mjs:709-727`).

### Horizontal overflow

Body text and grids **must not overflow the viewport** at any width. Intentional horizontal extension (oversized hero text, edge-to-edge imagery) is allowed as long as it doesn't introduce a horizontal scrollbar. Multi-column grids collapse to single column at ≤768px automatically — themes do not need to specify this.

### Mental render check

Before finalizing a theme, mentally render at each of these widths:

- **320px** — smallest phone. Does padding leave room for body text? Do headings fit on 1–2 lines?
- **768px** — tablet. Does multi-column collapse cleanly?
- **1440px** — standard laptop. Does the design look finished, not stretched?
- **1920px+** — large display. Does `containerMaxWidth` cap the dead space at the edges?

A theme that fails any of these checks at the prompt stage will likely fail in production. Mobile-specific failures are caught by the [Mobile layout safety](#mobile-layout-safety) overrides, but desktop and tablet rendering is the theme's responsibility.
