# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a personal Astro v5 static site. No databases, Docker, or external services are required for local development. See `CLAUDE.md` for project conventions and `README.md` for full documentation.

### Running the dev server

```bash
npm run dev
```

Starts at `http://localhost:4321/`. The server supports HMR and will hot-reload on file changes.

### Testing

```bash
npm test          # Run all vitest tests (fast, ~1s)
npm run check     # Astro type-checking (0 errors expected; hints are informational)
```

### Key caveats

- `.npmrc` sets `legacy-peer-deps=true` — this is required for dependency resolution.
- AI-powered features (theme generation, bio summary, career query) require `ANTHROPIC_API_KEY` env var but the site builds and serves fine without it.
- The daily theme is read from `src/data/daily-themes.json`. If themes look stale, the site still renders correctly with fallback styles.
- The `npm run build` command runs image optimization and contrast auditing before the Astro build, then copies assets and builds the Pagefind search index. It is heavier than `npm run dev`.
- The Astro config allows `.vibepocket.link` hosts for dev — this is intentional for Vercel preview URLs.
