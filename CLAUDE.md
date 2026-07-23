# CLAUDE.md — Project conventions for davidhoang.com

## Project overview
Personal website for David Hoang. Built with Astro, deployed on Vercel.
Site: https://www.davidhoang.com

## Tech stack
- **Framework**: Astro (static output with Vercel adapter for API routes)
- **UI**: Astro components + React (for interactive components like CareerOdyssey, CardStackHero)
- **Styling**: CSS modules and global CSS with design tokens (CSS custom properties)
- **Fonts**: Self-hosted (ABCDiatypeVariable, Inter, Cormorant Garamond, Space Grotesk) with font-preload system
- **Deployment**: Vercel (static + serverless functions)

## Key directories
- `src/content/writing/` — Blog posts (markdown, frontmatter: title, pubDate, description, draft, ogImage, coverImage)
- `src/content/notes/` — Digital garden notes (markdown, frontmatter adds: stage, tags, updatedDate)
- `src/layouts/` — MainLayout.astro (site-wide), WritingPost.astro / WritingLayout.astro (writing), NoteLayout.astro (notes)
- `src/pages/api/` — Server-rendered endpoints (OG image generation)
- `src/styles/` — Global CSS, design tokens, self-hosted font declarations
- `src/utils/` — Font preloading, responsive images, theme utilities
- `src/assets/images/` — Image source of truth (blog, hero, odyssey, etc.); mirrored to `public/images/` at build/dev time

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build (Astro build + asset copy)
- `npm run preview` — Preview production build locally
- `npm run generate-theme` — Generate daily theme

## Content conventions
- Writing posts use `draft: true` to hide from production
- Notes: `stage`, optional `overview` (markdown), `description` as Overview fallback; optional `overviewYoutube` (URL or id) embeds below overview prose inside the Overview card; optional `links`
- Images use WebP format, stored in `src/assets/images/blog/{year}/` (served as `/images/...`)
- OG images auto-generated via `/api/og` endpoint for posts without custom ogImage/coverImage

## Site navigation
- **Top nav** (`src/data/navigation.ts` → `navItems`, rendered in `Navigation.astro`): About, Writing, Featured, Subscribe — keep this list short
- **Footer only** (`src/components/Footer.astro`): Notes and Advising are footer links, not top nav; use footer for secondary pages (Career Odyssey, Now, RSS, etc.)
- **Command palette** (`commandPalettePages` + build-time writing/notes index): all discoverable pages including Notes and Advising

## Architecture notes
- RSS: `/rss.xml` is **writing only** (full content, same scope as `/rss/writing.xml`). Notes: `/rss/notes.xml`. Per-tag feeds `/rss/tag/{tag}.xml` are **writing** posts with that tag only (not notes).
- Sitemap auto-generated via @astrojs/sitemap (excludes /default-layout)
- Performance: font LCP optimizer, responsive image srcset, aggressive bundle splitting, terser minification
- Vercel Speed Insights for real-world Core Web Vitals monitoring
- View transitions enabled with custom animations and reduced-motion support
- Daily theme system with auto-generated themes

## Code style
- Prefer minimal changes; don't over-engineer
- Use existing patterns — check similar components before creating new ones
- Keep Astro components for static content, React for interactive features only
