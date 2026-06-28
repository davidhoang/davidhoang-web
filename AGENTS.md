# AGENTS.md

Single entry point for AI coding agents (Cursor, Claude Code, Cloud Agents, etc.).

Site: https://www.davidhoang.com

## Project overview

Personal website for David Hoang. Built with Astro, deployed on Vercel.

### Tech stack

- **Framework:** Astro (static output with Vercel adapter for API routes)
- **UI:** Astro components + React (CareerOdyssey, CardStackHero, etc.)
- **Styling:** CSS modules and global CSS with design tokens (CSS custom properties)
- **Fonts:** Self-hosted (ABCDiatypeVariable, Inter, Cormorant Garamond, Space Grotesk) with font-preload system
- **Deployment:** Vercel (static + serverless functions)

### Key directories

| Path | Purpose |
|------|---------|
| `src/content/writing/` | Blog posts (title, pubDate, description, draft, ogImage, coverImage) |
| `src/content/notes/` | Digital garden notes (stage, tags, updatedDate, optional overview/links) |
| `src/layouts/` | MainLayout.astro (site-wide), BlogPost.astro (writing/notes) |
| `src/pages/api/` | OG image generation, bio summary, theme/career queries |
| `src/styles/` | Global CSS, design tokens, font declarations |
| `src/utils/` | Font preloading, responsive images, theme utilities |
| `public/images/` | Static images (blog images in subdirectories by year) |

### Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server → http://localhost:4321 |
| `npm run build` | Production build (image optimize, contrast audit, Astro build, Pagefind) |
| `npm run preview` | Preview production build |
| `npm run check` / `npx astro check` | Type check |
| `npm run test` | Vitest unit tests |
| `npm run audit:design` | Design compliance lint |
| `npm run audit-contrast` | WCAG theme contrast audit |
| `npm run generate-theme` | Generate daily theme |

### Content conventions

- Writing posts: `draft: true` hides from production
- Notes: `stage`, optional `overview` (markdown), `description` as Overview fallback; optional `overviewYoutube`, `links`
- Images: WebP in `public/images/blog/{year}/`
- OG images: auto-generated via `/api/og` when no custom ogImage/coverImage

### Site navigation

- **Top nav** (`src/data/navigation.ts` → `navItems`, `Navigation.astro`): About, Writing, Featured, Subscribe — keep short
- **Footer only** (`Footer.astro`): Notes, Advising, Career Odyssey, Now, RSS, etc.
- **Command palette** (`commandPalettePages` + build-time writing/notes index): all discoverable pages

### Architecture notes

- RSS: `/rss.xml` and `/rss/writing.xml` are writing only; `/rss/notes.xml` for notes; `/rss/tag/{tag}.xml` is writing posts with that tag
- Sitemap via @astrojs/sitemap (excludes `/node-test`, `/signup-examples`)
- Performance: font LCP optimizer, responsive srcset, bundle splitting, terser
- View transitions with reduced-motion support
- Daily theme system (`design.md`, `scripts/generate-daily-theme.mjs`)

### Code style

- Prefer minimal changes; don't over-engineer
- Check similar components before creating new ones
- Astro for static content; React only when client interactivity is required

---

## Agent design system

Cross-tool product design instructions follow the [Vercel agent design stack](https://vercel.com/blog/teaching-agents-product-design-at-vercel). Canonical skill content lives under `.agents/`; Cursor-specific rules stay in `.cursor/rules/`.

| Layer | Location |
|-------|----------|
| Design contract | `design.md` (spec), `src/design-guide.md` (primitives) |
| **Canonical skill** | **`.agents/skills/product-design/`** (`SKILL.md`, `references/`, `exemplars/`) |
| Cursor discovery | `.cursor/skills/product-design/` (pointer), `.cursor/skills/davidhoang-ui/` (alias) |
| Cursor file rules | `.cursor/rules/design-system.mdc`, `.cursor/rules/site-nav-css.mdc` |
| Lint | `npm run audit:design` → `scripts/audit-design-compliance.mjs` |
| Evals | `evals/` (+ optional `@vercel/agent-eval`) |
| Theme contrast | `npm run audit-contrast` (runs in build) |

**Before UI work:** read `design.md`, then `.agents/skills/product-design/SKILL.md`. Cursor also applies `.cursor/rules/design-system.mdc` on matching files.

**Optional Vercel skills:** `npx skills add vercel-labs/agent-skills --skill web-design-guidelines`

**When agents repeat mistakes:** log in `.agents/skills/product-design/references/coverage-gaps.md`, then update `design.md`, audit script, or `evals/`. See `evals/README.md`.

---

## Cursor Cloud specific instructions

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Astro dev server | `npm run dev` | 4321 | Main service; serves all pages + API routes locally |

### Non-obvious notes

- `output: 'static'` with Vercel adapter — API routes under `src/pages/api/` are serverless on Vercel, served by dev server locally
- AI features (`/api/career-query`, `/api/theme-query`, `/api/generate-bio-summary`) require `ANTHROPIC_API_KEY`
- Pagefind index is build-only — search does not work in dev mode
- `allowedHosts` in `astro.config.mjs` includes `*.vibepocket.link` for Cloud Agent environments
- Build runs `scripts/optimize-images.mjs` and `scripts/audit-theme-contrast.mjs` before `astro build`
