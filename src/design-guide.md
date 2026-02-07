# Design System Guide

This guide documents the design primitives and CSS classes that automatically respond to the daily theme system. Use these when building new layouts to ensure theme compatibility.

---

## Table of Contents

1. [CSS Variables (Design Tokens)](#css-variables)
2. [Buttons](#buttons)
3. [Cards](#cards)
4. [Surfaces](#surfaces)
5. [Typography](#typography)
6. [Images](#images)
7. [Badges](#badges)
8. [Dividers](#dividers)
9. [Links](#links)
10. [Inputs](#inputs)
11. [Containers](#containers)
12. [Utility Classes](#utility-classes)
13. [Theme-Specific Variations](#theme-variations)

---

## CSS Variables

These CSS custom properties are the foundation of the theme system. Daily themes override these values.

### Colors

| Variable | Description | Default (Light) |
|----------|-------------|-----------------|
| `--color-text` | Primary text color | `#333` |
| `--color-bg` | Page background | `#fff` |
| `--color-link` | Link color | `#333` |
| `--color-link-hover` | Link hover color | `#666` |
| `--color-border` | Border color | `#eee` |
| `--color-muted` | Secondary/muted text | `#666` |
| `--color-sidebar-bg` | Sidebar/card background | `#f7f7f7` |
| `--color-nav-bg` | Navigation background | `#f5f5f5` |
| `--color-nav-text` | Navigation text | `#333` |
| `--color-card-bg` | Card background | `var(--color-sidebar-bg)` |

### Typography

| Variable | Description | Default |
|----------|-------------|---------|
| `--font-primary` | Primary font stack | ABC Diatype |
| `--font-heading` | Heading font | `var(--font-primary)` |
| `--font-body` | Body text font | `var(--font-primary)` |
| `--font-mono` | Monospace font | ABC Diatype Mono |
| `--heading-weight` | Heading font weight | `600` |
| `--body-weight` | Body font weight | `400` |
| `--body-line-height` | Body line height | `1.6` |
| `--letter-spacing` | Body letter spacing | `0.005em` |
| `--heading-letter-spacing` | Heading letter spacing | `-0.02em` |
| `--heading-transform` | Heading text transform | `none` |
| `--letter-spacing-display` | Display text (H1) | `-0.03em` |
| `--letter-spacing-heading-lg` | Large headings (H2) | `-0.02em` |
| `--letter-spacing-heading-md` | Medium headings (H3-H6) | `-0.01em` |
| `--letter-spacing-body` | Body text | `0.005em` |
| `--letter-spacing-caption` | Captions & small text | `0.01em` |

### Spacing

| Variable | Value |
|----------|-------|
| `--spacing-xs` | `0.25rem` (4px) |
| `--spacing-sm` | `0.5rem` (8px) |
| `--spacing-md` | `1rem` (16px) |
| `--spacing-lg` | `1.5rem` (24px) |
| `--spacing-xl` | `2rem` (32px) |
| `--spacing-2xl` | `3rem` (48px) |
| `--spacing-3xl` | `4rem` (64px) |

### Border Radius

| Variable | Value |
|----------|-------|
| `--radius-sm` | `4px` |
| `--radius-md` | `8px` |
| `--radius-lg` | `12px` |
| `--radius-xl` | `16px` |
| `--radius-full` | `9999px` |

### Cards & Shadows

| Variable | Description |
|----------|-------------|
| `--card-shadow` | Default card shadow |
| `--card-border-width` | Card border width |
| `--card-padding` | Card internal padding |
| `--shadow-hover` | Elevated hover shadow |

---

## Buttons

Buttons automatically adapt to theme colors and border radius.

### Usage

```html
<!-- Primary (filled) -->
<button class="btn btn-primary">Primary Action</button>

<!-- Secondary (outlined) -->
<button class="btn btn-secondary">Secondary</button>

<!-- Ghost (minimal) -->
<button class="btn btn-ghost">Ghost</button>

<!-- Link style -->
<a class="btn btn-link" href="#">Link Button</a>

<!-- Sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary btn-lg">Large</button>

<!-- Disabled -->
<button class="btn btn-primary" disabled>Disabled</button>
```

### Theme Response

- Background uses `--color-link`
- Border radius uses `--radius-md`
- Hover states use `--color-link-hover`

---

## Cards

Cards are containers for grouped content. They respond to the `[data-card-style]` theme attribute.

### Usage

```html
<!-- Default card -->
<div class="card">
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</div>

<!-- Elevated (shadow) -->
<div class="card card-elevated">...</div>

<!-- Outlined (strong border) -->
<div class="card card-outlined">...</div>

<!-- Glass (blur effect) -->
<div class="card card-glass">...</div>

<!-- Filled (solid background) -->
<div class="card card-filled">...</div>

<!-- Interactive (hover effect) -->
<div class="card card-interactive">...</div>

<!-- With header/footer -->
<div class="card">
  <div class="card-header">Header</div>
  <p>Content</p>
  <div class="card-footer">Footer</div>
</div>
```

### Theme Response

| Theme Card Style | Effect |
|------------------|--------|
| `flat` | No shadow, border only |
| `elevated` | Shadow, no border |
| `glass` | Blur + transparency |
| `outlined` | Strong border |
| `filled` | Solid background |

---

## Surfaces

Surfaces are background containers with different elevation levels.

### Usage

```html
<!-- Default surface -->
<div class="surface">...</div>

<!-- Raised (elevated) -->
<div class="surface-raised">...</div>

<!-- Sunken (recessed) -->
<div class="surface-sunken">...</div>

<!-- Glass (blur effect) -->
<div class="surface-glass">...</div>
```

### Theme Response

- Background uses `--color-bg` and `--color-sidebar-bg`
- Shadows adapt to theme

---

## Typography

Typography classes ensure text responds to theme font settings.

### Usage

```html
<!-- Heading style (uses heading font + weight) -->
<h1 class="text-heading">Page Title</h1>

<!-- Body text -->
<p class="text-body">Regular paragraph text.</p>

<!-- Caption/small text -->
<span class="text-caption">Caption or metadata</span>

<!-- Monospace/code -->
<code class="text-mono">codeExample()</code>

<!-- Muted text -->
<p class="text-muted">Secondary information</p>

<!-- Link colored text -->
<span class="text-link">Highlighted</span>

<!-- Size classes -->
<p class="text-xs">Extra small</p>
<p class="text-sm">Small</p>
<p class="text-base">Base</p>
<p class="text-lg">Large</p>
<p class="text-xl">Extra large</p>
<p class="text-2xl">2X large</p>
<p class="text-3xl">3X large</p>
```

### Theme Response

| Class | Responds To |
|-------|-------------|
| `.text-heading` | `--font-heading`, `--heading-weight`, `--heading-letter-spacing`, `--heading-transform` |
| `.text-body` | `--font-body`, `--body-weight`, `--body-line-height`, `--letter-spacing` |
| `.text-muted` | `--color-muted` |
| `.text-link` | `--color-link` |

---

## Images

Image classes ensure photos respond to theme image treatments.

### Usage

```html
<!-- Theme-responsive image -->
<img class="img-themed" src="photo.jpg" alt="Description" />

<!-- Thumbnail (16:9, cover) -->
<img class="img-thumbnail" src="thumb.jpg" alt="Thumbnail" />

<!-- Hero image (full width, max 70vh) -->
<img class="img-hero" src="hero.jpg" alt="Hero" />

<!-- Avatar -->
<img class="img-avatar" src="avatar.jpg" alt="User" />
<img class="img-avatar img-avatar-sm" src="avatar.jpg" alt="Small" />
<img class="img-avatar img-avatar-lg" src="avatar.jpg" alt="Large" />
```

### Theme Response

Images respond to these theme attributes:

| Attribute | Options | Effect |
|-----------|---------|--------|
| `[data-image-style]` | `vivid`, `muted`, `grayscale`, `duotone` | Color treatment |
| `[data-image-hover]` | `zoom`, `lift`, `colorize`, `glow`, `none` | Hover effect |
| `--image-opacity` | `0.85` - `1` | Opacity level |
| `--image-border-radius` | CSS value | Corner rounding |

---

## Badges

Small labels for status, categories, or counts.

### Usage

```html
<!-- Default badge -->
<span class="badge">Default</span>

<!-- Primary (uses link color) -->
<span class="badge badge-primary">New</span>

<!-- Muted -->
<span class="badge badge-muted">Archive</span>
```

### Theme Response

- Primary badge uses `--color-link`
- Border radius uses `--radius-sm`

---

## Dividers

Horizontal rules for separating content.

### Usage

```html
<!-- Standard divider -->
<hr class="divider" />

<!-- Subtle (50% opacity) -->
<hr class="divider divider-subtle" />

<!-- Thick (2px) -->
<hr class="divider divider-thick" />
```

### Theme Response

- Color uses `--color-border`

---

## Links

Link styles for different contexts.

### Usage

```html
<!-- Standard link -->
<a class="link" href="#">Click here</a>

<!-- Muted link -->
<a class="link-muted" href="#">Less emphasis</a>

<!-- Navigation link -->
<a class="link-nav" href="#">Nav Item</a>
```

### Theme Response

Links respond to `[data-link-style]` attribute:

| Style | Effect |
|-------|--------|
| `underline` | Classic underline |
| `highlight` | Background highlight on hover |
| `animated-underline` | Underline grows on hover |
| `color-only` | No decoration, color change only |
| `bracket` | `[brackets]` appear on hover |

---

## Inputs

Form input elements.

### Usage

```html
<!-- Standard input -->
<input class="input" type="text" placeholder="Enter text..." />

<!-- Large input -->
<input class="input input-lg" type="text" />

<!-- Textarea -->
<textarea class="textarea" placeholder="Enter message..."></textarea>
```

### Theme Response

- Border uses `--color-border`
- Focus ring uses `--color-link`
- Border radius uses `--radius-md`

---

## Containers

Layout containers for content width control.

### Usage

```html
<!-- Default container (max 1200px) -->
<div class="container">...</div>

<!-- Narrow (720px, good for reading) -->
<div class="container container-narrow">...</div>

<!-- Wide (1400px) -->
<div class="container container-wide">...</div>

<!-- Full width -->
<div class="container container-full">...</div>
```

### Theme Response

- Max width can be overridden by `--container-max-width`
- Padding uses `--container-padding`

---

## Utility Classes

### Spacing (Consolidated)

```html
<!-- Margin top -->
<div class="mt-xl">...</div>  <!-- 2rem -->

<!-- Margin bottom -->
<div class="mb-sm">...</div>  <!-- 0.5rem -->
<div class="mb-md">...</div>  <!-- 1rem -->
<div class="mb-lg">...</div>  <!-- 1.5rem -->
<div class="mb-xl">...</div>  <!-- 2rem -->

<!-- Reset margin -->
<div class="m-0">...</div>

<!-- Padding (all sides) -->
<div class="p-sm">...</div>  <!-- 0.5rem -->
<div class="p-md">...</div>  <!-- 1rem -->
<div class="p-lg">...</div>  <!-- 1.5rem -->
<div class="p-xl">...</div>  <!-- 2rem -->
```

### Flexbox (Consolidated)

```html
<div class="flex">...</div>
<div class="flex flex-col">...</div>
<div class="flex flex-wrap">...</div>
<div class="flex items-center">...</div>
<div class="flex justify-center">...</div>
<div class="flex justify-between">...</div>
<div class="flex gap-xs">...</div>
<div class="flex gap-sm">...</div>
<div class="flex gap-md">...</div>
<div class="flex gap-lg">...</div>
<div class="flex gap-xl">...</div>
```

### Grid

```html
<div class="grid grid-cols-2 gap-md">...</div>
<div class="grid grid-cols-3 gap-md">...</div>
<div class="grid grid-cols-4 gap-md">...</div>
```

Note: Grid columns collapse to single column on mobile (< 768px).

---

## Theme Variations

The daily theme system sets these data attributes on `<html>`:

| Attribute | Options | Affects |
|-----------|---------|---------|
| `data-theme` | `light`, `dark` | Color scheme |
| `data-daily-theme` | Date string | Indicates active theme |
| `data-nav-style` | `floating`, `full-width`, `minimal`, `bold-bar` | Navigation layout |
| `data-card-style` | `flat`, `elevated`, `glass`, `outlined`, `filled` | Card appearance |
| `data-hero-layout` | `centered`, `left-aligned`, `minimal`, `bold` | Hero section |
| `data-link-style` | `underline`, `highlight`, `animated-underline`, `color-only`, `bracket` | Link behavior |
| `data-bg-texture` | `none`, `grain`, `dots`, `grid`, `gradient` | Background texture |
| `data-image-style` | `vivid`, `muted`, `grayscale`, `duotone` | Image color |
| `data-image-hover` | `zoom`, `lift`, `colorize`, `glow`, `none` | Image hover |

### Checking Active Theme in JavaScript

```javascript
// Check if daily theme is active
const isDailyTheme = document.documentElement.hasAttribute('data-daily-theme');

// Get current theme date
const themeDate = document.documentElement.getAttribute('data-daily-theme');

// Get specific style
const navStyle = document.documentElement.getAttribute('data-nav-style');
```

### Targeting Specific Theme Styles in CSS

```css
/* Style only when glass cards are active */
[data-card-style="glass"] .my-component {
  backdrop-filter: blur(8px);
}

/* Style only when bold hero is active */
[data-hero-layout="bold"] .hero-title {
  font-size: 8rem;
}

/* Style based on link style */
[data-link-style="highlight"] a:hover {
  background: var(--color-link);
}
```

---

## Best Practices

1. **Always use CSS variables** for colors, spacing, and typography
2. **Use primitive classes** (`.card`, `.btn`, etc.) instead of custom styles
3. **Test with multiple themes** to ensure your component adapts
4. **Avoid hard-coded colors** - use `var(--color-*)` instead
5. **Use `.img-themed`** for portfolio/content images that should respond to theme
6. **Exclude icons/logos** from image treatments with `.avatar` or `.icon` classes

---

## File Locations

- **CSS Variables & Primitives**: `src/styles/global.css`
- **Theme Data**: `src/data/daily-themes.json`
- **Theme Toggle Component**: `src/components/DailyThemeToggle.astro`
- **Theme Generator**: `scripts/generate-daily-theme.mjs`
