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
2. The script calls the Claude API with a creative prompt
3. Claude generates a complete theme configuration including:
   - **Colors:** Light and dark mode palettes with tinted backgrounds
   - **Typography:** Heading and body font pairings from Google Fonts
   - **Navigation:** Style (floating, full-width, minimal, bold-bar)
   - **Cards:** Treatment styles (flat, elevated, glass, outlined, filled)
   - **Layout:** Border radius, spacing, container width
   - **Hero:** Layout variations (centered, left-aligned, minimal, bold)
   - **Links:** Interaction styles (underline, highlight, animated-underline, color-only, bracket)
   - **Background:** CSS textures (grain, dots, grid, gradient)
   - **Images:** Treatment and hover effects
   - **Footer:** Style variations (classic, minimal, brutalist, editorial, retro, etc.)
   - **Shaders:** Optional WebGL background effects (mesh-gradient, waves, dot-grid, etc.)
4. The theme is saved to `src/data/daily-themes.json` with 7 days of history

### Running Theme Generation Locally

```bash
# Requires ANTHROPIC_API_KEY in .env or environment
npm run generate-theme
```

#### CLI Options

```bash
# List available design inspirations
node scripts/generate-daily-theme.mjs --list

# Use a specific inspiration
node scripts/generate-daily-theme.mjs --inspiration "Bauhaus"

# Add custom creative direction
node scripts/generate-daily-theme.mjs --prompt "Use warm earth tones"
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
      "navigation": {...},
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
