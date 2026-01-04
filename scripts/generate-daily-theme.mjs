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

// Google Fonts - diverse range from elegant serifs to modern sans-serifs
const FONT_OPTIONS = [
  // Serifs - elegant and editorial
  { name: 'Playfair Display', category: 'serif', weight: '400;500;600;700' },
  { name: 'Cormorant Garamond', category: 'serif', weight: '400;500;600;700' },
  { name: 'Libre Baskerville', category: 'serif', weight: '400;700' },
  { name: 'Lora', category: 'serif', weight: '400;500;600;700' },
  { name: 'Fraunces', category: 'serif', weight: '400;500;600;700' },
  { name: 'DM Serif Display', category: 'serif', weight: '400' },
  // Sans-serifs - modern and clean
  { name: 'Space Grotesk', category: 'sans-serif', weight: '400;500;600;700' },
  { name: 'Outfit', category: 'sans-serif', weight: '400;500;600;700' },
  { name: 'Syne', category: 'sans-serif', weight: '400;500;600;700;800' },
  { name: 'Instrument Sans', category: 'sans-serif', weight: '400;500;600;700' },
  { name: 'Plus Jakarta Sans', category: 'sans-serif', weight: '400;500;600;700;800' },
  { name: 'Satoshi', category: 'sans-serif', weight: '400;500;700' },
  // Display & unique
  { name: 'Unbounded', category: 'display', weight: '400;500;600;700' },
  { name: 'Bricolage Grotesque', category: 'display', weight: '400;500;600;700' },
];

const THEME_PROMPT = `You are a BOLD, creative designer generating a daily theme for a personal portfolio website. Each theme should feel dramatically different and immediately noticeable - not subtle tweaks!

DESIGN PHILOSOPHY:
- BE BOLD! Use saturated, expressive colors - not just slight variations of gray
- Make link colors POP - vibrant blues, rich purples, warm oranges, etc.
- Background colors can be tinted - cream, blush, sage, lavender, not just pure white/black
- Each theme should have a strong visual identity someone would notice immediately

CONSTRAINTS:
1. Colors MUST have WCAG AA contrast ratio (4.5:1 minimum for text on background)
2. Light mode: dark text on light (but tinted!) background
3. Dark mode: light text on dark (but tinted!) background
4. Link colors should be VIBRANT and stand out from body text

Available fonts (pick ONE - mix it up between serif, sans-serif, and display!):
${FONT_OPTIONS.map(f => `${f.name} (${f.category})`).join(', ')}

Generate a JSON object with this EXACT structure (no markdown, just raw JSON):
{
  "name": "Theme Name (2-3 words, evocative)",
  "description": "One sentence describing the mood/inspiration",
  "colors": {
    "light": {
      "--color-text": "#hex (dark, readable)",
      "--color-bg": "#hex (light but CAN be tinted - cream, blush, mint, lavender, etc)",
      "--color-link": "#hex (VIBRANT - make it pop!)",
      "--color-link-hover": "#hex (slightly different from link)",
      "--color-border": "#hex",
      "--color-muted": "#hex",
      "--color-sidebar-bg": "#hex (subtle contrast from bg)",
      "--color-nav-bg": "#hex",
      "--color-nav-text": "#hex"
    },
    "dark": {
      "--color-text": "#hex (light, readable)",
      "--color-bg": "#hex (dark but CAN be tinted - deep navy, charcoal brown, forest, etc)",
      "--color-link": "#hex (VIBRANT for dark mode)",
      "--color-link-hover": "#hex",
      "--color-border": "#hex",
      "--color-muted": "#hex",
      "--color-sidebar-bg": "#hex",
      "--color-nav-bg": "#hex",
      "--color-nav-text": "#hex"
    }
  },
  "font": {
    "name": "Font Name from list above"
  },
  "typography": {
    "headingWeight": "500" or "600" or "700" or "800",
    "bodyLineHeight": "1.6" or "1.7" or "1.8" or "1.9",
    "letterSpacing": "-0.02em" or "-0.01em" or "0" or "0.01em" or "0.02em",
    "headingLetterSpacing": "-0.03em" or "-0.02em" or "-0.01em" or "0"
  },
  "layout": {
    "borderRadius": "0px" or "4px" or "8px" or "12px" or "16px" or "24px",
    "containerMaxWidth": "680px" or "720px" or "800px" or "900px",
    "sectionSpacing": "3rem" or "4rem" or "5rem" or "6rem",
    "contentPadding": "1rem" or "1.5rem" or "2rem" or "2.5rem"
  }
}

BOLD THEME IDEAS (be adventurous!):
- "Sunset Boulevard" - warm coral bg, deep orange links, dramatic spacing
- "Cyber Noir" - near-black with electric cyan accents
- "Botanical Press" - sage green tints, earthy browns, organic feel
- "Brutalist Mono" - stark contrast, tight letter-spacing, sharp corners
- "Soft Lavender" - lavender-tinted bg, purple links, gentle curves
- "Desert Dusk" - sandy cream, terracotta links, warm and open
- "Ocean Depth" - deep teal dark mode, coral accents
- "Newspaper Classic" - sepia tints, bold serif, tight columns
- "Neon Minimal" - clean white with electric accent colors
- "Forest Floor" - deep greens, mushroom browns, natural feel

Today's date for inspiration: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;

async function generateTheme() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('Error: ANTHROPIC_API_KEY environment variable is required');
    process.exit(1);
  }

  const client = new Anthropic({ apiKey });

  console.log('Generating daily theme with Claude...\n');

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: THEME_PROMPT
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

  // Add font metadata
  const fontInfo = FONT_OPTIONS.find(f => f.name === themeData.font.name);
  if (fontInfo) {
    themeData.font.url = `https://fonts.googleapis.com/css2?family=${fontInfo.name.replace(/ /g, '+')}:wght@${fontInfo.weight}&display=swap`;
    themeData.font.category = fontInfo.category;
    // Build appropriate fallback stack based on category
    if (fontInfo.category === 'sans-serif') {
      themeData.font.stack = `'${fontInfo.name}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    } else if (fontInfo.category === 'display') {
      themeData.font.stack = `'${fontInfo.name}', 'Helvetica Neue', Arial, sans-serif`;
    } else {
      themeData.font.stack = `'${fontInfo.name}', Georgia, 'Times New Roman', serif`;
    }
  } else {
    // Fallback to first font if not found
    const fallback = FONT_OPTIONS[0];
    themeData.font.name = fallback.name;
    themeData.font.category = fallback.category;
    themeData.font.url = `https://fonts.googleapis.com/css2?family=${fallback.name.replace(/ /g, '+')}:wght@${fallback.weight}&display=swap`;
    themeData.font.stack = `'${fallback.name}', Georgia, 'Times New Roman', serif`;
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
      light: theme.colors.light['--color-bg'],
      dark: theme.colors.dark['--color-bg']
    },
    font: theme.font.name
  });

  // Keep 30 days of build history
  logData.builds = logData.builds.slice(0, 30);

  writeFileSync(logPath, JSON.stringify(logData, null, 2));
  console.log(`Updated ${logPath}`);
}

// Main
async function main() {
  try {
    const theme = await generateTheme();

    console.log(`Generated theme: "${theme.name}"`);
    console.log(`Description: ${theme.description}`);
    console.log(`Font: ${theme.font.name}`);
    console.log(`Light bg: ${theme.colors.light['--color-bg']}`);
    console.log(`Dark bg: ${theme.colors.dark['--color-bg']}\n`);

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
