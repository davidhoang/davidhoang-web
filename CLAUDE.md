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
- `src/layouts/` — MainLayout.astro (site-wide), BlogPost.astro (writing/notes)
- `src/pages/api/` — Server-rendered endpoints (OG image generation, bio summary)
- `src/styles/` — Global CSS, design tokens, self-hosted font declarations
- `src/utils/` — Font preloading, responsive images, theme utilities
- `public/images/` — Static images (blog images in subdirectories by year)

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build (Astro build + asset copy)
- `npm run preview` — Preview production build locally
- `npm run generate-theme` — Generate daily theme

## Content conventions
- Writing posts use `draft: true` to hide from production
- Notes use stage system: seedling → budding → evergreen
- Images use WebP format, stored in `public/images/blog/{year}/`
- OG images auto-generated via `/api/og` endpoint for posts without custom ogImage/coverImage

## Architecture notes
- RSS feed at `/rss.xml` with full content (content:encoded), XSL stylesheet for browser display
- Sitemap auto-generated via @astrojs/sitemap (excludes /node-test, /signup-examples)
- Performance: font LCP optimizer, responsive image srcset, aggressive bundle splitting, terser minification
- Vercel Speed Insights for real-world Core Web Vitals monitoring
- View transitions enabled with custom animations and reduced-motion support
- Daily theme system with auto-generated themes

## Code style
- Prefer minimal changes; don't over-engineer
- Use existing patterns — check similar components before creating new ones
- Keep Astro components for static content, React for interactive features only
