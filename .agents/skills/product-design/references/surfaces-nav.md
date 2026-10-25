# Surface: navigation

Themes **cannot** vary nav style, height, or padding. The generator strips `navigation` from theme JSON.

## Source of truth

| Concern | File |
|---------|------|
| Markup | `src/components/Navigation.astro` |
| Layout | `src/styles/modules/nav.css` |
| Command palette | `src/styles/modules/command-palette.css` |
| Critical height (wins over `@layer`) | `src/layouts/MainLayout.astro` inline critical CSS |
| Mobile `--nav-height` | `src/styles/modules/accessibility-responsive.css` |

Cursor rule with full contract: `.cursor/rules/site-nav-css.mdc` (always applied).

## Hard rules

- Use `.site-nav` and `.nav-container` — **never** `.container` on nav markup
- Never unscoped `nav { … }` in CSS outside `nav.css`
- Desktop horizontal padding on `.site-nav`, not `.nav-container`
- Mirror nav height changes in MainLayout critical CSS, not layered CSS alone

## Layout contract (verify at 390px, 767px, and 768px)

**Phone (≤767px):** full-width `.site-nav`, `.nav-container` exactly 56px tall, logo and menu vertically centered.

**Tablet/desktop (≥768px):** floating pill, `padding: 0 40px`, `--nav-height: 48px`.

## When editing nav

Read `site-nav-css.mdc` first. Do not refactor global `.container` or unscoped `nav` selectors without checking nav at both breakpoints.

## Command palette (easter egg)

The nav has no search button. Do not add the ⌘K hint back.

Search still opens from `src/scripts/command-palette.ts`:

- **⌘K** or **Ctrl+K** toggles the palette on desktop and mobile.
- Clicking empty space on the desktop nav pill opens it. Links and the menu button keep their own actions.
- The 404 page is the only labeled control, via `[data-open-command-palette]`.

Escape closes it. Results come from `/search-index.json` (pages, writing, and notes).
