#!/usr/bin/env node

/**
 * Daily Theme Generator
 *
 * Generates a new color palette, font pairing, and layout variations
 * using Claude API. Keeps 7 days of theme history.
 *
 * Usage:
 *   node scripts/generate-daily-theme.mjs
 *
 * Environment:
 *   ANTHROPIC_API_KEY - Required for Claude API access
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { generateInspirationPrompt, listInspirations, getTimePeriod, TIME_MODIFIERS } from './lib/inspiration.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Load .env file
const envPath = join(rootDir, '.env');
try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  // .env file doesn't exist, rely on environment variables
}

// Google Fonts - diverse range for heading/body pairings
const HEADING_FONTS = [
  // Serifs - elegant and editorial
  { name: 'Playfair Display', category: 'serif', weight: '400;500;600;700;800;900' },
  { name: 'Cormorant Garamond', category: 'serif', weight: '300;400;500;600;700' },
  { name: 'Libre Baskerville', category: 'serif', weight: '400;700' },
  { name: 'Lora', category: 'serif', weight: '400;500;600;700' },
  { name: 'Fraunces', category: 'serif', weight: '300;400;500;600;700;800;900' },
  { name: 'DM Serif Display', category: 'serif', weight: '400' },
  { name: 'Bodoni Moda', category: 'serif', weight: '400;500;600;700;800;900' },
  // Sans-serifs - modern and clean
  { name: 'Space Grotesk', category: 'sans-serif', weight: '300;400;500;600;700' },
  { name: 'Outfit', category: 'sans-serif', weight: '300;400;500;600;700;800;900' },
  { name: 'Syne', category: 'sans-serif', weight: '400;500;600;700;800' },
  { name: 'Plus Jakarta Sans', category: 'sans-serif', weight: '300;400;500;600;700;800' },
  // Display & unique
  { name: 'Unbounded', category: 'display', weight: '300;400;500;600;700;800;900' },
  { name: 'Bricolage Grotesque', category: 'display', weight: '300;400;500;600;700;800' },
  { name: 'Bebas Neue', category: 'display', weight: '400' },
  { name: 'Anton', category: 'display', weight: '400' },
];

const BODY_FONTS = [
  // Readable serifs
  { name: 'Source Serif 4', category: 'serif', weight: '300;400;500;600;700' },
  { name: 'Crimson Text', category: 'serif', weight: '400;600;700' },
  { name: 'Merriweather', category: 'serif', weight: '300;400;700;900' },
  { name: 'Literata', category: 'serif', weight: '300;400;500;600;700' },
  // Clean sans-serifs
  { name: 'Inter', category: 'sans-serif', weight: '300;400;500;600;700' },
  { name: 'IBM Plex Sans', category: 'sans-serif', weight: '300;400;500;600;700' },
  { name: 'Work Sans', category: 'sans-serif', weight: '300;400;500;600;700' },
  { name: 'Nunito Sans', category: 'sans-serif', weight: '300;400;500;600;700' },
  { name: 'DM Sans', category: 'sans-serif', weight: '300;400;500;600;700' },
  { name: 'Instrument Sans', category: 'sans-serif', weight: '400;500;600;700' },
];

// Combined for backward compatibility
const FONT_OPTIONS = [...HEADING_FONTS, ...BODY_FONTS];

const THEME_PROMPT = `You are an AVANT-GARDE designer creating a DRAMATICALLY different daily theme for a portfolio website. Each theme must be SO BOLD that visitors immediately notice the change - this is not subtle refinement, this is TRANSFORMATION!

## CRITICAL: MAKE IT OBVIOUS!
- Someone visiting two days in a row should think "Wow, this looks completely different!"
- Every element should reinforce the theme's personality
- The theme should feel like a different website, not just a color tweak

## COLOR REQUIREMENTS (BE EXTREME!)
Light mode backgrounds - MUST be noticeably tinted, not white:
- Warm: #FFF5E6 (peach), #FEF3E2 (cream), #FDEBD0 (sand), #FDEDEC (blush), #FDF2E9 (apricot)
- Cool: #E8F6F3 (mint), #EBF5FB (ice), #F4ECF7 (lavender), #E8DAEF (lilac), #D5F5E3 (seafoam)
- Bold: #FCF3CF (lemon), #FADBD8 (rose), #D4EFDF (sage), #D6EAF8 (sky)

Dark mode backgrounds - MUST be tinted, not pure black:
- Warm: #1A0F0A (chocolate), #1C1410 (espresso), #2C1810 (mahogany), #261A11 (umber)
- Cool: #0A1628 (navy), #0D1F22 (forest), #1A1A2E (midnight), #16213E (deep blue), #1B1B3A (purple night)
- Bold: #0F2027 (dark teal), #1A1A2E (indigo night), #2D132C (wine)

Link colors - MUST be SATURATED and VIBRANT:
- Electric: #FF6B35, #00D4AA, #FF3366, #00BFFF, #FFD700, #FF1493, #00FF7F, #FF4500
- Rich: #E63946, #2A9D8F, #E9C46A, #F4A261, #264653, #023E8A, #9D4EDD

## NAVIGATION STYLES - VARY THE STRUCTURE!
Pick ONE navigation style that matches the theme personality:
- "floating": Compact floating nav with rounded corners, centered or offset
- "full-width": Edge-to-edge nav bar spanning full viewport width
- "minimal": Ultra-minimal, just links with generous spacing
- "bold-bar": Thick colored bar with prominent branding

Nav size options:
- navHeight: "48px" (compact) to "80px" (statement)
- navPadding: "0.5rem 1rem" to "1.5rem 3rem"

## CARD TREATMENTS - VARY THE FEEL!
Cards can be: project cards, content blocks, any boxed element
- cardStyle: "flat" (no shadow, border only) | "elevated" (shadow) | "glass" (blur + transparency) | "outlined" (strong border) | "filled" (solid bg)
- cardShadow: "none" | "0 2px 8px rgba(0,0,0,0.08)" | "0 8px 32px rgba(0,0,0,0.12)" | "0 24px 48px rgba(0,0,0,0.2)"
- cardBorderWidth: "0px" | "1px" | "2px" | "3px"
- cardPadding: "1rem" to "3rem"

## FONT PAIRINGS - USE TWO FONTS!
You MUST pick a HEADING font and a BODY font - they should contrast but complement:

HEADING FONTS (for h1, h2, h3, nav):
${HEADING_FONTS.map(f => `- ${f.name} (${f.category})`).join('\n')}

BODY FONTS (for paragraphs, lists, general text):
${BODY_FONTS.map(f => `- ${f.name} (${f.category})`).join('\n')}

Great pairings contrast categories:
- Serif heading + Sans body = Editorial elegance (Playfair Display + Inter)
- Display heading + Serif body = Bold statement (Bebas Neue + Literata)
- Sans heading + Sans body = Clean modern (Outfit + DM Sans)
- Serif heading + Serif body = Classic literary (Bodoni Moda + Source Serif 4)

## TYPOGRAPHY - MAKE IT FEEL DIFFERENT!
Mix up these dramatically:
- headingWeight: "300" (light/elegant) to "900" (ultra black/impactful)
- bodyWeight: "300" (light) to "500" (medium)
- bodyLineHeight: "1.5" (compact/dense) vs "2.0" (airy/spacious)
- letterSpacing: "-0.03em" (tight/modern) vs "0.05em" (loose/classic)
- headingLetterSpacing: "-0.04em" (compressed) vs "0.08em" (expanded/uppercase feel)
- headingTransform: "none" | "uppercase" | "lowercase"

## LAYOUT - CREATE DISTINCT PERSONALITIES!
- borderRadius: "0px" (brutalist) vs "24px" (soft) vs "9999px" (pill)
- sectionSpacing: "2rem" (compact) vs "8rem" (dramatic whitespace)
- contentPadding: "0.5rem" (edge-to-edge) vs "3rem" (cushioned)
- containerMaxWidth: "640px" (narrow/focused) to "1200px" (wide/expansive)

## HERO LAYOUT - SET THE TONE!
The hero section is the first thing visitors see - make it count:
- "centered": Classic centered text, balanced and formal
- "left-aligned": Editorial style, text aligned left with asymmetry
- "minimal": Just the essentials, lots of whitespace
- "bold": Large dramatic text, high impact

## LINK STYLES - PERSONALITY IN INTERACTIONS!
How links look and behave says a lot about the design:
- "underline": Classic underline, timeless
- "highlight": Background highlight on hover (like a highlighter)
- "animated-underline": Underline grows/animates on hover
- "color-only": No underline, just color change
- "bracket": Decorative brackets appear on hover

## BACKGROUND TEXTURE - ADD DEPTH!
Subtle CSS-based textures (no images):
- "none": Clean, solid color
- "grain": Subtle film grain noise effect
- "dots": Polka dot pattern
- "grid": Faint grid lines
- "gradient": Subtle gradient overlay

## IMAGE TREATMENTS - PORTFOLIO PERSONALITY!
How images appear affects the whole feel:
- imageStyle: "vivid" (full color, punchy) | "muted" (slightly desaturated) | "grayscale" (B&W) | "duotone" (tinted)
- imageHover: "zoom" (scale up) | "lift" (shadow + translate) | "colorize" (grayscale to color) | "glow" (subtle glow) | "none"
- imageOpacity: "1" (full) | "0.9" | "0.85" (slightly faded for texture)
- imageBorderRadius: "0px" to "24px" (match or contrast with layout radius)

Generate a JSON object with this EXACT structure (no markdown, just raw JSON):
{
  "name": "Theme Name (2-3 words, evocative)",
  "description": "One sentence describing the mood/inspiration",
  "colors": {
    "light": {
      "--color-text": "#hex",
      "--color-bg": "#hex (TINTED!)",
      "--color-link": "#hex (VIBRANT!)",
      "--color-link-hover": "#hex",
      "--color-border": "#hex",
      "--color-muted": "#hex",
      "--color-sidebar-bg": "#hex",
      "--color-nav-bg": "#hex",
      "--color-nav-text": "#hex",
      "--color-card-bg": "#hex (slightly different from bg)"
    },
    "dark": {
      "--color-text": "#hex",
      "--color-bg": "#hex (TINTED!)",
      "--color-link": "#hex (VIBRANT!)",
      "--color-link-hover": "#hex",
      "--color-border": "#hex",
      "--color-muted": "#hex",
      "--color-sidebar-bg": "#hex",
      "--color-nav-bg": "#hex",
      "--color-nav-text": "#hex",
      "--color-card-bg": "#hex"
    }
  },
  "fonts": {
    "heading": "Font Name for headings",
    "body": "Font Name for body text"
  },
  "typography": {
    "headingWeight": "300-900",
    "bodyWeight": "300-500",
    "bodyLineHeight": "1.5-2.0",
    "letterSpacing": "-0.03em to 0.05em",
    "headingLetterSpacing": "-0.04em to 0.08em",
    "headingTransform": "none|uppercase|lowercase"
  },
  "navigation": {
    "style": "floating|full-width|minimal|bold-bar",
    "height": "48px-80px",
    "padding": "CSS padding value"
  },
  "cards": {
    "style": "flat|elevated|glass|outlined|filled",
    "shadow": "CSS shadow or none",
    "borderWidth": "0px-3px",
    "padding": "1rem-3rem"
  },
  "layout": {
    "borderRadius": "0px-24px",
    "containerMaxWidth": "640px-1200px",
    "sectionSpacing": "2rem-8rem",
    "contentPadding": "0.5rem-3rem"
  },
  "hero": {
    "layout": "centered|left-aligned|minimal|bold"
  },
  "links": {
    "style": "underline|highlight|animated-underline|color-only|bracket"
  },
  "background": {
    "texture": "none|grain|dots|grid|gradient"
  },
  "images": {
    "style": "vivid|muted|grayscale|duotone",
    "hover": "zoom|lift|colorize|glow|none",
    "opacity": "0.85-1",
    "borderRadius": "0px-24px"
  }
}

EXAMPLE DRAMATIC THEMES:
1. "Brutalist Manifesto" - Gray bg, RED links, Bebas Neue uppercase headings, full-width nav, flat cards, left-aligned hero, underline links, grid texture, grayscale images with colorize hover
2. "Tropical Editorial" - Warm peach bg, coral links, Playfair Display headings, floating nav, elevated cards, centered hero, animated-underline links, none texture, vivid images with lift hover
3. "Hacker Terminal" - Dark green bg, neon green links, Space Grotesk headings, minimal nav, outlined cards, minimal hero, color-only links, grain texture, muted images with glow hover
4. "Lavender Dream" - Soft purple bg, violet links, Fraunces headings, floating nav, glass cards, centered hero, highlight links, gradient texture, muted images with zoom hover
5. "Swiss Precision" - Cream bg, blue links, Outfit uppercase headings, bold-bar nav, flat cards, bold hero, bracket links, dots texture, vivid images with lift hover
6. "Noir Cinema" - Near-black bg, gold links, Bodoni Moda headings, minimal nav, elevated cards, minimal hero, underline links, grain texture, grayscale images with colorize hover

Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} - let this inspire a UNIQUE theme!`;

async function generateTheme(options = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  // Generate inspiration from design feeds + time-of-day
  const { inspirationName, userPrompt } = options;
  const inspiration = generateInspirationPrompt({
    inspirationName,
    userPrompt,
    hour: new Date().getHours(),
    includeTimeModifier: true
  });

  console.log('Generating daily theme with Claude...');
  console.log(`Inspiration: ${inspiration.inspirationName}`);
  console.log(`Time period: ${inspiration.timePeriod}\n`);

  // Combine inspiration with base theme prompt
  const fullPrompt = `${inspiration.fullPrompt}\n\n${THEME_PROMPT}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: fullPrompt
      }
    ]
  });

  const responseText = message.content[0].text.trim();

  // Parse JSON from response (handle potential markdown wrapping)
  let themeData;
  try {
    // Try to extract JSON if wrapped in code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
                      responseText.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
    themeData = JSON.parse(jsonStr);
  } catch (parseError) {
    console.error('Failed to parse theme JSON:', parseError.message);
    console.error('Response was:', responseText);
    process.exit(1);
  }

  // Helper to build font stack
  const buildFontStack = (fontInfo) => {
    if (fontInfo.category === 'sans-serif') {
      return `'${fontInfo.name}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    } else if (fontInfo.category === 'display') {
      return `'${fontInfo.name}', 'Helvetica Neue', Arial, sans-serif`;
    } else {
      return `'${fontInfo.name}', Georgia, 'Times New Roman', serif`;
    }
  };

  // Handle new fonts structure (heading + body) or legacy font structure
  if (themeData.fonts) {
    // New structure with heading and body fonts
    const headingInfo = HEADING_FONTS.find(f => f.name === themeData.fonts.heading) || HEADING_FONTS[0];
    const bodyInfo = BODY_FONTS.find(f => f.name === themeData.fonts.body) || BODY_FONTS[0];

    themeData.fonts = {
      heading: {
        name: headingInfo.name,
        url: `https://fonts.googleapis.com/css2?family=${headingInfo.name.replace(/ /g, '+')}:wght@${headingInfo.weight}&display=swap`,
        category: headingInfo.category,
        stack: buildFontStack(headingInfo)
      },
      body: {
        name: bodyInfo.name,
        url: `https://fonts.googleapis.com/css2?family=${bodyInfo.name.replace(/ /g, '+')}:wght@${bodyInfo.weight}&display=swap`,
        category: bodyInfo.category,
        stack: buildFontStack(bodyInfo)
      }
    };

    // Also set legacy font field for backward compatibility (use heading font)
    themeData.font = themeData.fonts.heading;
  } else if (themeData.font) {
    // Legacy structure - add font metadata
    const fontInfo = FONT_OPTIONS.find(f => f.name === themeData.font.name);
    if (fontInfo) {
      themeData.font.url = `https://fonts.googleapis.com/css2?family=${fontInfo.name.replace(/ /g, '+')}:wght@${fontInfo.weight}&display=swap`;
      themeData.font.category = fontInfo.category;
      themeData.font.stack = buildFontStack(fontInfo);
    } else {
      // Fallback to first font if not found
      const fallback = FONT_OPTIONS[0];
      themeData.font.name = fallback.name;
      themeData.font.category = fallback.category;
      themeData.font.url = `https://fonts.googleapis.com/css2?family=${fallback.name.replace(/ /g, '+')}:wght@${fallback.weight}&display=swap`;
      themeData.font.stack = buildFontStack(fallback);
    }

    // Create fonts structure for consistency
    themeData.fonts = {
      heading: themeData.font,
      body: themeData.font
    };
  }

  // Add date
  const today = new Date().toISOString().split('T')[0];
  themeData.date = today;

  return themeData;
}

function updateThemeHistory(newTheme) {
  const themesPath = join(rootDir, 'src', 'data', 'daily-themes.json');

  let themesData;
  try {
    themesData = JSON.parse(readFileSync(themesPath, 'utf-8'));
  } catch {
    themesData = { themes: [], currentDate: null };
  }

  // Check if we already have a theme for today
  const existingIndex = themesData.themes.findIndex(t => t.date === newTheme.date);
  if (existingIndex >= 0) {
    themesData.themes[existingIndex] = newTheme;
  } else {
    themesData.themes.unshift(newTheme);
  }

  // Keep only 7 days of history
  themesData.themes = themesData.themes.slice(0, 7);
  themesData.currentDate = newTheme.date;

  writeFileSync(themesPath, JSON.stringify(themesData, null, 2));
  console.log(`Updated ${themesPath}`);

  return themesData;
}

function updateBuildLog(theme, status = 'success') {
  const logPath = join(rootDir, 'src', 'data', 'build-log.json');

  let logData;
  try {
    logData = JSON.parse(readFileSync(logPath, 'utf-8'));
  } catch {
    logData = { builds: [] };
  }

  logData.builds.unshift({
    date: new Date().toISOString(),
    themeName: theme.name,
    status,
    colors: {
      light: theme.colors?.light?.['--color-bg'],
      dark: theme.colors?.dark?.['--color-bg']
    },
    fonts: {
      heading: theme.fonts?.heading?.name || theme.font?.name,
      body: theme.fonts?.body?.name || theme.font?.name
    },
    navStyle: theme.navigation?.style,
    cardStyle: theme.cards?.style,
    heroLayout: theme.hero?.layout,
    linkStyle: theme.links?.style,
    texture: theme.background?.texture,
    imageStyle: theme.images?.style,
    imageHover: theme.images?.hover
  });

  // Keep 30 days of build history
  logData.builds = logData.builds.slice(0, 30);

  writeFileSync(logPath, JSON.stringify(logData, null, 2));
  console.log(`Updated ${logPath}`);
}

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  // Check for --list flag to show available inspirations
  if (args.includes('--list')) {
    console.log('Available inspirations:\n');
    listInspirations().forEach(name => console.log(`  - ${name}`));
    console.log('\nUsage: node generate-daily-theme.mjs [--inspiration "Name"] [--prompt "custom text"]');
    process.exit(0);
  }

  // Parse --inspiration flag
  const inspIdx = args.indexOf('--inspiration');
  if (inspIdx !== -1 && args[inspIdx + 1]) {
    options.inspirationName = args[inspIdx + 1];
  }

  // Parse --prompt flag for additional user direction
  const promptIdx = args.indexOf('--prompt');
  if (promptIdx !== -1 && args[promptIdx + 1]) {
    options.userPrompt = args[promptIdx + 1];
  }

  return options;
}

// Main
async function main() {
  try {
    const options = parseArgs();
    const theme = await generateTheme(options);

    console.log(`Generated theme: "${theme.name}"`);
    console.log(`Description: ${theme.description}`);
    console.log(`Heading font: ${theme.fonts?.heading?.name || theme.font?.name}`);
    console.log(`Body font: ${theme.fonts?.body?.name || theme.font?.name}`);
    console.log(`Light bg: ${theme.colors.light['--color-bg']}`);
    console.log(`Dark bg: ${theme.colors.dark['--color-bg']}`);
    console.log(`Nav style: ${theme.navigation?.style || 'default'}`);
    console.log(`Card style: ${theme.cards?.style || 'default'}`);
    console.log(`Hero: ${theme.hero?.layout || 'centered'}`);
    console.log(`Links: ${theme.links?.style || 'underline'}`);
    console.log(`Texture: ${theme.background?.texture || 'none'}`);
    console.log(`Images: ${theme.images?.style || 'vivid'} / hover: ${theme.images?.hover || 'zoom'}\n`);

    updateThemeHistory(theme);
    updateBuildLog(theme);

    console.log('\nDaily theme generation complete!');
  } catch (error) {
    console.error('Error generating theme:', error.message);

    // Log failure
    updateBuildLog({ name: 'Generation Failed' }, 'error');

    process.exit(1);
  }
}

main();
