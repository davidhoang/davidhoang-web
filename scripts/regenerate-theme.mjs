#!/usr/bin/env node

/**
 * Regenerate a specific date's theme with custom inspiration
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Load .env
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
} catch (error) {}

const HEADING_FONTS = [
  { name: 'Playfair Display', category: 'serif', weight: '400;500;600;700;800;900' },
  { name: 'Cormorant Garamond', category: 'serif', weight: '300;400;500;600;700' },
  { name: 'Libre Baskerville', category: 'serif', weight: '400;700' },
  { name: 'Lora', category: 'serif', weight: '400;500;600;700' },
  { name: 'Fraunces', category: 'serif', weight: '300;400;500;600;700;800;900' },
  { name: 'DM Serif Display', category: 'serif', weight: '400' },
  { name: 'Bodoni Moda', category: 'serif', weight: '400;500;600;700;800;900' },
  { name: 'Space Grotesk', category: 'sans-serif', weight: '300;400;500;600;700' },
  { name: 'Outfit', category: 'sans-serif', weight: '300;400;500;600;700;800;900' },
  { name: 'Syne', category: 'sans-serif', weight: '400;500;600;700;800' },
  { name: 'Plus Jakarta Sans', category: 'sans-serif', weight: '300;400;500;600;700;800' },
  { name: 'Unbounded', category: 'display', weight: '300;400;500;600;700;800;900' },
  { name: 'Bricolage Grotesque', category: 'display', weight: '300;400;500;600;700;800' },
  { name: 'Bebas Neue', category: 'display', weight: '400' },
  { name: 'Anton', category: 'display', weight: '400' },
];

const BODY_FONTS = [
  { name: 'Source Serif 4', category: 'serif', weight: '300;400;500;600;700' },
  { name: 'Crimson Text', category: 'serif', weight: '400;600;700' },
  { name: 'Merriweather', category: 'serif', weight: '300;400;700;900' },
  { name: 'Literata', category: 'serif', weight: '300;400;500;600;700' },
  { name: 'Inter', category: 'sans-serif', weight: '300;400;500;600;700' },
  { name: 'IBM Plex Sans', category: 'sans-serif', weight: '300;400;500;600;700' },
  { name: 'Work Sans', category: 'sans-serif', weight: '300;400;500;600;700' },
  { name: 'Nunito Sans', category: 'sans-serif', weight: '300;400;500;600;700' },
  { name: 'DM Sans', category: 'sans-serif', weight: '300;400;500;600;700' },
  { name: 'Instrument Sans', category: 'sans-serif', weight: '400;500;600;700' },
];

// Get CLI args
const targetDate = process.argv[2]; // e.g., "2026-01-02"
const inspiration = process.argv[3] || ''; // e.g., "warm earthy tones, vintage feel"

if (!targetDate) {
  console.error('Usage: node regenerate-theme.mjs <date> [inspiration]');
  console.error('Example: node regenerate-theme.mjs 2026-01-02 "warm earthy tones, vintage feel"');
  process.exit(1);
}

const THEME_PROMPT = `You are creating a daily theme for a portfolio website.

${inspiration ? `## INSPIRATION DIRECTIVE\n${inspiration}\n\n` : ''}

## COLOR REQUIREMENTS
Light mode backgrounds - MUST be noticeably tinted:
- Warm: #FFF5E6 (peach), #FEF3E2 (cream), #FDEBD0 (sand), #FDEDEC (blush), #FDF2E9 (apricot)
- Cool: #E8F6F3 (mint), #EBF5FB (ice), #F4ECF7 (lavender), #E8DAEF (lilac), #D5F5E3 (seafoam)
- Bold: #FCF3CF (lemon), #FADBD8 (rose), #D4EFDF (sage), #D6EAF8 (sky)

Dark mode backgrounds - MUST be tinted:
- Warm: #1A0F0A (chocolate), #1C1410 (espresso), #2C1810 (mahogany), #261A11 (umber)
- Cool: #0A1628 (navy), #0D1F22 (forest), #1A1A2E (midnight), #16213E (deep blue)
- Earthy: #1F1A14 (walnut), #1A1814 (charcoal), #1E1B18 (slate)

Link colors - MUST be SATURATED and match the mood

## FONT PAIRINGS
HEADING FONTS: ${HEADING_FONTS.map(f => f.name).join(', ')}
BODY FONTS: ${BODY_FONTS.map(f => f.name).join(', ')}

## OPTIONS
- Navigation: floating, full-width, minimal, bold-bar
- Cards: flat, elevated, glass, outlined, filled
- Hero: centered, left-aligned, minimal, bold
- Links: underline, highlight, animated-underline, color-only, bracket
- Background: none, grain, dots, grid, gradient
- Images: vivid, muted, grayscale, duotone
- Image Hover: zoom, lift, colorize, glow, none

Generate a JSON object with this structure (no markdown):
{
  "name": "Theme Name",
  "description": "One sentence mood",
  "colors": {
    "light": { "--color-text": "#hex", "--color-bg": "#hex", "--color-link": "#hex", "--color-link-hover": "#hex", "--color-border": "#hex", "--color-muted": "#hex", "--color-sidebar-bg": "#hex", "--color-nav-bg": "#hex", "--color-nav-text": "#hex", "--color-card-bg": "#hex" },
    "dark": { "--color-text": "#hex", "--color-bg": "#hex", "--color-link": "#hex", "--color-link-hover": "#hex", "--color-border": "#hex", "--color-muted": "#hex", "--color-sidebar-bg": "#hex", "--color-nav-bg": "#hex", "--color-nav-text": "#hex", "--color-card-bg": "#hex" }
  },
  "fonts": { "heading": "Font Name", "body": "Font Name" },
  "typography": { "headingWeight": "300-900", "bodyWeight": "300-500", "bodyLineHeight": "1.5-2.0", "letterSpacing": "-0.02em to 0.03em", "headingLetterSpacing": "-0.03em to 0.05em", "headingTransform": "none|uppercase" },
  "navigation": { "style": "floating|full-width|minimal|bold-bar", "height": "48-80px", "padding": "CSS" },
  "cards": { "style": "flat|elevated|glass|outlined|filled", "shadow": "CSS or none", "borderWidth": "0-3px", "padding": "1-3rem" },
  "layout": { "borderRadius": "0-24px", "containerMaxWidth": "640-1200px", "sectionSpacing": "2-8rem", "contentPadding": "0.5-3rem" },
  "hero": { "layout": "centered|left-aligned|minimal|bold" },
  "links": { "style": "underline|highlight|animated-underline|color-only|bracket" },
  "background": { "texture": "none|grain|dots|grid|gradient" },
  "images": { "style": "vivid|muted|grayscale|duotone", "hover": "zoom|lift|colorize|glow|none", "opacity": "0.85-1", "borderRadius": "0-24px" }
}`;

async function generateTheme() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  console.log(`Generating theme for ${targetDate}...`);
  if (inspiration) console.log(`Inspiration: ${inspiration}\n`);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: THEME_PROMPT }]
  });

  const responseText = message.content[0].text.trim();

  let themeData;
  try {
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
                      responseText.match(/(\{[\s\S]*\})/);
    themeData = JSON.parse(jsonMatch ? jsonMatch[1] : responseText);
  } catch (e) {
    console.error('Failed to parse:', responseText);
    process.exit(1);
  }

  // Build font stacks
  const buildFontStack = (fontInfo) => {
    if (fontInfo.category === 'sans-serif') {
      return `'${fontInfo.name}', -apple-system, BlinkMacSystemFont, sans-serif`;
    } else if (fontInfo.category === 'display') {
      return `'${fontInfo.name}', Georgia, serif`;
    } else {
      return `'${fontInfo.name}', Georgia, serif`;
    }
  };

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

  themeData.font = themeData.fonts.heading;
  themeData.date = targetDate;

  return themeData;
}

async function main() {
  const theme = await generateTheme();

  console.log(`Generated: "${theme.name}"`);
  console.log(`Description: ${theme.description}`);
  console.log(`Fonts: ${theme.fonts.heading.name} / ${theme.fonts.body.name}`);
  console.log(`Nav: ${theme.navigation?.style}, Cards: ${theme.cards?.style}`);
  console.log(`Hero: ${theme.hero?.layout}, Links: ${theme.links?.style}\n`);

  // Update themes file
  const themesPath = join(rootDir, 'src', 'data', 'daily-themes.json');
  const themesData = JSON.parse(readFileSync(themesPath, 'utf-8'));

  const existingIndex = themesData.themes.findIndex(t => t.date === targetDate);
  if (existingIndex >= 0) {
    themesData.themes[existingIndex] = theme;
    console.log(`Replaced theme for ${targetDate}`);
  } else {
    themesData.themes.push(theme);
    themesData.themes.sort((a, b) => new Date(b.date) - new Date(a.date));
    console.log(`Added theme for ${targetDate}`);
  }

  themesData.themes = themesData.themes.slice(0, 7);
  writeFileSync(themesPath, JSON.stringify(themesData, null, 2));
  console.log('Done!');
}

main();
