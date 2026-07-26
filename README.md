# davidhoang.com

Personal portfolio website with AI-powered daily theme generation.

## Tech Stack

- **Framework:** [Astro](https://astro.build/) v5 with hybrid rendering
- **UI Components:** React 19 with [Framer Motion](https://www.framer.com/motion/) for animations
- **Styling:** CSS with CSS custom properties for theming
- **Graphics:** [Konva](https://konvajs.org/) / React-Konva for canvas, [Paper Design Shaders](https://www.npmjs.com/package/@paper-design/shaders-react) for WebGL backgrounds
- **Typography:** [Geist](https://vercel.com/font) font family + Google Fonts
- **AI Integration:** [Anthropic Claude API](https://docs.anthropic.com/) for theme generation
- **Deployment:** Vercel / Cloudflare
- **Language:** TypeScript

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This starts the development server at `http://localhost:4321`.

### Build

```bash
npm run build
```

### Performance

```bash
npm run analyze   # Build and write dist/bundle-stats.html
npm run budget    # Check built JS assets against bundle budgets
```

### Preview Production Build

```bash
npm run preview
```

### Other Commands

```bash
npm run clean     # Remove dist, .vercel, and node_modules
npm run rebuild   # Clean install and rebuild
```

## Daily Theme Generation

The website features an AI-powered theme generation system that creates a unique visual identity each day, including colors, typography, layout styles, and more.

### How It Works

1. A GitHub Action runs daily at 6am UTC (or can be triggered manually)
2. A deterministic scheduler rotates art-direction recipes, hero templates, and grid templates with cooldowns
3. Claude generates three styling candidates in parallel inside the scheduled structure, including:
   - **Colors:** Light and dark mode palettes with tinted backgrounds
   - **Typography:** Heading and body font pairings from Google Fonts
   - **Cards:** Opaque treatment styles (flat, elevated, outlined, filled)
   - **Layout:** Safe inner-grid recipes, border radius, spacing, and container width
   - **Hero:** Framework templates (stacked-fan, editorial, scattered, rolodex, cinematic)
   - **Links:** Interaction styles (underline, highlight, animated-underline, color-only, bracket)
   - **Background:** CSS textures (grain, dots, grid, gradient)
   - **Images:** Treatment and hover effects
   - **Footer:** Style variations (classic, minimal, brutalist, editorial, retro, etc.)
   - **Shaders:** Optional WebGL background effects (mesh-gradient, waves, dot-grid, etc.)
4. Every model response passes a strict schema: exact theme keys, allowlisted enums, canonical hex colors, bounded CSS values, and capped strings/arrays
5. Playwright renders every candidate (and only cache-miss recent themes) at 390px, 1440px, and 1920px
6. Ranking prefers viewport-safe candidates with higher layout + palette distance from recent themes, and penalizes warm-cream / lavender AI attractors
7. The winning theme is saved to `src/data/daily-themes.json` (7-day history); edge signatures land in `src/data/theme-render-signatures.json` for the next run

Navigation dimensions and page scaffolding remain framework-controlled across every theme.

### Running Theme Generation Locally

```bash
# Requires ANTHROPIC_API_KEY in .env or environment
npm run generate-theme

# One-time install for full local render-and-rank support
npx playwright install chromium

# Run the same multi-layout browser safety matrix used by CI
npm run test:theme-renderer
```

#### CLI Options

```bash
# List available design inspirations
node scripts/generate-daily-theme.mjs --list

# Use a specific inspiration
node scripts/generate-daily-theme.mjs --inspiration "Bauhaus"

# Add custom creative direction
node scripts/generate-daily-theme.mjs --prompt "Use warm earth tones"

# List or force an art-direction recipe
node scripts/generate-daily-theme.mjs --list-recipes
node scripts/generate-daily-theme.mjs --recipe "gallery"

# Change candidate count or skip browser rendering for a quick local fallback
node scripts/generate-daily-theme.mjs --candidates 5
node scripts/generate-daily-theme.mjs --skip-render
```

### Customizing Theme Generation

Edit `scripts/theme-prompt.md` to change the creative direction. This file controls:
- Naming guidelines and preferred patterns
- Style direction and experimental combinations
- Shader usage guidelines
- What makes a theme memorable

### Theme Data Structure

Generated themes are stored in `src/data/daily-themes.json`:

```json
{
  "themes": [
    {
      "name": "Theme Name",
      "description": "One sentence describing the mood",
      "date": "2025-01-12",
      "colors": { "light": {...}, "dark": {...} },
      "fonts": { "heading": {...}, "body": {...} },
      "typography": {...},
      "artDirection": { "recipe": "gallery", ... },
      "cards": {...},
      "layout": {...},
      "hero": {...},
      "links": {...},
      "background": {...},
      "images": {...},
      "footer": {...},
      "shader": {...}
    }
  ],
  "currentDate": "2025-01-12"
}
```

## Project Structure

```
├── src/
│   ├── assets/          # Static assets
│   ├── components/      # Astro & React components
│   ├── content/         # Content collections (blog posts, etc.)
│   ├── data/            # JSON data files (themes, etc.)
│   ├── layouts/         # Page layouts
│   ├── pages/           # Route pages
│   ├── plugins/         # Astro plugins
│   ├── scripts/         # Client-side scripts
│   └── styles/          # Global styles
├── scripts/             # Build & generation scripts
│   ├── generate-daily-theme.mjs
│   ├── theme-prompt.md
│   └── data/fonts.json
├── .github/workflows/   # GitHub Actions
│   └── daily-theme.yml
└── public/              # Static public files
```

## Learn More

- [Astro Documentation](https://docs.astro.build)
- [Astro Discord Server](https://astro.build/chat)

## License

MIT
