# CLAUDE.md — AI Assistant Guide for davidhoang-web

## Project Overview

Personal portfolio and blog for David Hoang at [davidhoang.com](https://www.davidhoang.com). Built with Astro 5 (static output), React 19, and deployed on Vercel. Features an AI-powered daily theme generation system, a digital garden for notes, a career visualization canvas, and WebGL shader backgrounds.

## Tech Stack

- **Framework**: Astro 5.14+ (static site generator)
- **UI**: React 19.2 for interactive client components
- **Language**: TypeScript 5.9 (strict mode)
- **Styling**: Modular CSS with custom properties (no Tailwind)
- **Deployment**: Vercel (primary), Cloudflare adapter available
- **AI Integration**: Anthropic Claude API for theme generation and bio summaries
- **Visualization**: Konva/react-konva (canvas), Framer Motion (animations), @paper-design/shaders-react (WebGL)

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server (port 4321) |
| `npm run build` | Production build (Astro build + asset copy) |
| `npm run preview` | Preview production build locally |
| `npm run clean` | Remove dist, .vercel, node_modules |
| `npm run rebuild` | Clean + install + build |
| `npm run generate-theme` | Generate daily theme via Claude API |
| `npm run optimize-images` | Optimize images with sharp |
| `npm run bio:status` | Check AI bio summary status |
| `npm run bio:generate` | Generate AI bio summary |

**Note**: There is no linter, formatter, or test suite configured in this project.

## Project Structure

```
src/
├── assets/images/       # Source images (copied to public/ during build)
├── components/          # 14 Astro + 15 React components
├── content/
│   ├── config.ts        # Content collection schemas (Zod)
│   ├── writing/         # Blog posts (Markdown, 23 articles)
│   ├── notes/           # Digital garden notes (Markdown, 5 notes)
│   └── bio.md           # Bio source for AI summary generation
├── data/                # JSON data files
│   ├── daily-themes.json    # 7-day theme rotation (auto-generated)
│   ├── career-odyssey.json  # Career node graph visualization data
│   ├── bio-ai-summary.json  # Generated AI bio summary
│   └── build-log.json       # Build metadata
├── layouts/
│   ├── MainLayout.astro # Primary layout (meta, fonts, theme, shader)
│   └── BlogPost.astro   # Blog post layout
├── pages/               # File-based routing
│   ├── api/             # Serverless API endpoints
│   ├── writing/         # Blog collection pages ([...slug].astro)
│   ├── notes/           # Notes collection pages ([...slug].astro)
│   └── rss.xml.js       # RSS feed generator
├── plugins/
│   └── remarkImagePath.mjs  # Remark plugin: rewrites image paths
├── scripts/             # Client-side JS (preference-tracker, ambient-sound)
├── styles/
│   ├── global.css       # Import aggregator for all modules
│   └── modules/         # Modular CSS files (variables, base, design-system, etc.)
└── env.d.ts             # Astro type references

scripts/                 # Build/CI scripts (Node.js)
├── generate-daily-theme.mjs   # Claude-powered theme generation
├── copy-assets.js             # Post-build asset copying
├── optimize-images.mjs        # Sharp image optimization
├── theme-prompt.md            # Creative direction for theme generation
└── lib/                       # Shared script utilities

public/
├── fonts/               # Self-hosted WOFF2 fonts (ABC Diatype, Google Fonts)
├── images/              # Static images served directly
└── audio/               # Ambient sound MP3 files
```

## Architecture Patterns

### Component Model

- **Astro components** (`.astro`): Static layout, navigation, metadata, content rendering
- **React components** (`.tsx`): Client-side interactivity using Astro `client:` directives
  - `client:idle` — loads after page is idle (used for ShaderBackground)
  - `client:visible` — loads when scrolled into view (used for heavy visualizations)
  - `client:load` — loads immediately (used for critical interactive elements)

### Content Collections

Two collections defined in `src/content/config.ts`:

**Writing** (blog posts):
- Schema: `title`, `pubDate` (Date), `description`, `ogImage?`, `coverImage?`, `draft?`
- Drafts filtered out in production via `import.meta.env.PROD`

**Notes** (digital garden):
- Schema: `title`, `description?`, `pubDate`, `updatedDate?`, `stage` (seedling|budding|evergreen), `tags?`, `draft?`

### Styling System

CSS follows a modular architecture imported through `src/styles/global.css`:

1. **Core**: `variables.css` → `fonts.css` → `base.css`
2. **Design System**: `design-system.css` → `utilities.css`
3. **Components**: `links.css` → `shared-components.css` → `career-odyssey.css`
4. **Theming**: `theme-variations.css` → `footer-themes.css`
5. **Responsive**: `accessibility-responsive.css`

Theming uses CSS custom properties with `[data-theme="dark"]` selectors. Daily themes override variables via `daily-themes.json`. Mood modifications (focus, creative, relaxed) adjust saturation/contrast.

### Image Handling

- **Source images** live in `src/assets/images/` and are copied to `public/images/` during build (via Vite plugin + `scripts/copy-assets.js`)
- **Markdown** references images with `/images/` paths (rewritten by `remarkImagePath.mjs` plugin)
- **Components** can import from `src/assets/` for Astro image optimization

### Daily Theme System

- Generated daily by `scripts/generate-daily-theme.mjs` using the Claude API
- GitHub Actions workflow (`.github/workflows/daily-theme.yml`) runs at 6am UTC
- Vercel cron calls `/api/generate-bio-summary` at midnight UTC
- Theme data stored in `src/data/daily-themes.json` (7-day rolling history)
- Each theme configures: colors (light/dark), fonts, typography, navigation, cards, layout, hero, links, background, shaders, footer

## Environment Variables

From `env.example`:

```
ANTHROPIC_API_KEY    # For Claude-powered theme and bio generation
OPENAI_API_KEY       # Alternative AI provider for bio generation
BIO_UPDATE_SECRET    # Optional: protects the bio generation API endpoint
```

Theme generation requires `ANTHROPIC_API_KEY`. Bio generation supports either Anthropic (preferred) or OpenAI.

## Key Conventions

### TypeScript

- Strict mode enabled (`astro/tsconfigs/strict`)
- Path aliases: `@/*` → `src/*`, `@assets/*` → `src/assets/*`

### Build Optimization

- Terser minification with `drop_console` in production
- Manual chunk splitting for heavy libraries: react-konva, framer-motion, paper-shaders
- Separate vendor chunk for React core
- CSS code splitting enabled
- No source maps in production

### Content Authoring

- Blog posts go in `src/content/writing/` as Markdown files
- Notes go in `src/content/notes/` as Markdown files
- Frontmatter must match the Zod schemas in `src/content/config.ts`
- Use `draft: true` to hide content in production
- Images for posts go in `src/assets/images/blog/` (organized by year)

### File Naming

- Astro components: PascalCase (e.g., `Navigation.astro`)
- React components: PascalCase (e.g., `CardStackHero.tsx`)
- CSS modules: kebab-case (e.g., `shared-components.css`)
- Content files: kebab-case slugs (e.g., `design-engineering.md`)
- Data files: kebab-case (e.g., `daily-themes.json`)

### Pages and Routing

- File-based routing in `src/pages/`
- Dynamic routes use `[...slug].astro` pattern for content collections
- RSS feed at `/rss.xml` generated from the writing collection
- API endpoint at `/api/generate-bio-summary` (GET for status, POST to generate)

## Common Tasks

### Adding a Blog Post

1. Create `src/content/writing/your-slug.md` with required frontmatter (`title`, `pubDate`, `description`)
2. Add images to `src/assets/images/blog/YYYY/`
3. Reference images in markdown as `![alt](/images/blog/YYYY/filename.webp)`

### Adding a Note

1. Create `src/content/notes/your-slug.md` with frontmatter including `stage: seedling`
2. Update `stage` to `budding` or `evergreen` as content matures

### Adding a New Page

1. Create `src/pages/page-name.astro`
2. Use `MainLayout` as the layout wrapper
3. Add navigation link in `src/components/Navigation.astro` if needed

### Modifying Styles

- Edit the relevant CSS module in `src/styles/modules/`
- Add new CSS custom properties in `variables.css`
- Theme-specific overrides go in `theme-variations.css`
