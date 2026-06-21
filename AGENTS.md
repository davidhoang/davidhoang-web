# AGENTS.md

## Cursor Cloud specific instructions

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Astro dev server | `npm run dev` | 4321 | Main service; serves all pages + API routes locally |

### Quick reference

- **Lint/type check:** `npx astro check` (0 errors expected; hints are fine)
- **Tests:** `npm run test` (vitest, 65 unit tests)
- **Build:** `npm run build` (includes image optimization, Astro build, asset copy, and Pagefind indexing)
- **Dev server:** `npm run dev` → http://localhost:4321

### Non-obvious notes

- The site uses `output: 'static'` with the Vercel adapter. API routes (under `src/pages/api/`) run as serverless functions on Vercel but are served by the Astro dev server locally.
- AI-powered features (`/api/career-query`, `/api/theme-query`, `/api/generate-bio-summary`) require `ANTHROPIC_API_KEY` env var. The rest of the site works without it.
- Pagefind search index is only generated during `npm run build`; search will not work in dev mode — this is expected.
- `allowedHosts` in `astro.config.mjs` includes `*.vibepocket.link` for Cloud Agent environments — no additional config needed.
- The build script runs `node scripts/optimize-images.mjs` and `node scripts/audit-theme-contrast.mjs` before `astro build`. These don't require external API keys.
