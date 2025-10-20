# Substack Signup Component Usage

This document explains how to use the custom `SubstackSignup` component throughout your site.

## Quick Start

Import and use the component in any `.astro` file:

```astro
---
import SubstackSignup from '../components/SubstackSignup.astro';
---

<SubstackSignup />
```

## Component Props

The component accepts the following optional props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | "Subscribe to Proof of Concept" | The heading text |
| `description` | string | "Get my newsletter..." | The description text below the title |
| `showTitle` | boolean | `true` | Whether to show the title |

## Usage Examples

### Default Usage

The simplest form with all defaults:

```astro
<SubstackSignup />
```

### Custom Title and Description

```astro
<SubstackSignup 
  title="Subscribe to my newsletter"
  description="Get a free issue every Sunday about design, technology, and entrepreneurship."
/>
```

### Without Title (Inline)

Perfect for sidebars or when you have a heading elsewhere:

```astro
<h2>Stay Updated</h2>
<SubstackSignup 
  showTitle={false}
  description="Join 10,000+ readers getting weekly insights."
/>
```

### Minimal Version

Just the form fields:

```astro
<SubstackSignup 
  showTitle={false}
  description=""
/>
```

## Where It's Currently Used

1. **Subscribe Page** (`/src/pages/subscribe.astro`)
   - Full featured with custom title and description
   - Main call-to-action page for newsletter signup

2. **Homepage** (`/src/pages/index.astro`)
   - Currently commented out
   - Uncomment the section to enable it

## Styling

The component automatically matches your site's theme:
- Uses CSS variables from `global.css`
- Supports dark mode automatically
- Respects reduced motion preferences
- Fully responsive on all screen sizes
- Accessible with proper ARIA labels

## Custom Styling

You can wrap the component and add custom styles:

```astro
<div class="custom-newsletter">
  <SubstackSignup />
</div>

<style>
  .custom-newsletter {
    max-width: 400px;
    margin: 4rem auto;
  }
</style>
```

## How It Works

The component:
1. Submits directly to Substack's endpoint (`https://www.proofofconcept.pub/subscribe`)
2. Uses native form submission (no JavaScript required)
3. Shows loading state when submitting
4. Maintains all Substack functionality (confirmation emails, etc.)

## Benefits Over iframe

- **Native Look & Feel**: Matches your site's design perfectly
- **Dark Mode Support**: Automatically adapts to theme
- **Performance**: No iframe overhead
- **Accessibility**: Better keyboard navigation and screen reader support
- **Mobile Friendly**: Fully responsive without iframe issues
- **No Layout Shift**: Consistent sizing across devices
- **Better UX**: Smooth interactions and feedback

## Adding to Other Pages

### Footer

```astro
// src/components/Footer.astro
import SubstackSignup from './SubstackSignup.astro';

<footer>
  <div class="footer-newsletter">
    <SubstackSignup 
      title="Never Miss an Update"
      description="Weekly insights on design and technology."
    />
  </div>
  <!-- rest of footer -->
</footer>
```

### Blog Post Sidebar

```astro
// src/layouts/BlogPost.astro
<aside class="sidebar">
  <SubstackSignup showTitle={false} />
</aside>
```

### Inline in Content

```astro
<article>
  <p>Some content...</p>
  
  <div class="cta-block">
    <SubstackSignup />
  </div>
  
  <p>More content...</p>
</article>
```

## Customization

To modify the component styling or behavior, edit:
`/src/components/SubstackSignup.astro`

Key sections:
- Props: Lines 2-11
- HTML Structure: Lines 13-32
- Styles: Lines 34-200
- JavaScript: Lines 202-215

