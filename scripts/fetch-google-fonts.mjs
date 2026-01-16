#!/usr/bin/env node

/**
 * Google Fonts Fetcher
 *
 * Fetches fonts from Google Fonts API, filters for quality,
 * and saves them with mood/style tags for theme generation.
 *
 * Usage:
 *   node scripts/fetch-google-fonts.mjs [--key YOUR_API_KEY]
 *
 * Without an API key, uses a curated default set.
 * With an API key, fetches fresh data from Google Fonts API.
 */

import { writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FONTS_PATH = join(__dirname, 'data', 'fonts.json');

// Mood/style classifications for fonts
const MOOD_KEYWORDS = {
  elegant: ['Playfair', 'Cormorant', 'Bodoni', 'Didot', 'Baskerville', 'Garamond', 'Caslon', 'Freight', 'Canela', 'Noto Serif', 'EB Garamond', 'Crimson', 'Spectral', 'Libre Baskerville'],
  editorial: ['Times', 'Georgia', 'Merriweather', 'Source Serif', 'Literata', 'Newsreader', 'Piazzolla', 'Fraunces', 'Lora'],
  brutalist: ['Bebas', 'Anton', 'Oswald', 'Impact', 'Archivo Black', 'League Gothic', 'Dharma Gothic', 'Druk', 'Obviously'],
  playful: ['Pacifico', 'Lobster', 'Fredoka', 'Bubblegum', 'Comic', 'Bangers', 'Bungee', 'Righteous', 'Titan One', 'Bowlby One'],
  tech: ['IBM Plex', 'Roboto', 'Source Code', 'JetBrains', 'Fira', 'Space Mono', 'Ubuntu Mono', 'Inconsolata', 'SF Mono', 'Menlo'],
  geometric: ['Futura', 'Avenir', 'Century Gothic', 'Poppins', 'Montserrat', 'Nunito', 'Quicksand', 'Comfortaa', 'Varela Round', 'DM Sans'],
  vintage: ['Abril Fatface', 'Playfair', 'Old Standard', 'Cinzel', 'Cardo', 'Vollkorn', 'Sorts Mill', 'Fanwood', 'Goudy'],
  humanist: ['Gill Sans', 'Optima', 'Verdana', 'Frutiger', 'Myriad', 'Open Sans', 'Lato', 'Source Sans', 'Cabin', 'Nunito Sans'],
  grotesk: ['Helvetica', 'Arial', 'Akzidenz', 'Space Grotesk', 'Bricolage', 'Darker Grotesque', 'Hanken Grotesk', 'Switzer', 'General Sans', 'Satoshi'],
  experimental: ['Unbounded', 'Syne', 'Clash Display', 'Cabinet Grotesk', 'Instrument', 'Chillax', 'Satoshi', 'Neue Montreal', 'PP Mori', 'Basement Grotesque'],
  monospace: ['JetBrains Mono', 'Fira Code', 'Source Code Pro', 'IBM Plex Mono', 'Space Mono', 'Inconsolata', 'Roboto Mono', 'Ubuntu Mono', 'Anonymous Pro', 'Courier Prime'],
  handwritten: ['Caveat', 'Kalam', 'Patrick Hand', 'Indie Flower', 'Shadows Into Light', 'Dancing Script', 'Pacifico', 'Sacramento', 'Great Vibes', 'Allura'],
  condensed: ['Oswald', 'Barlow Condensed', 'Roboto Condensed', 'Open Sans Condensed', 'PT Sans Narrow', 'Pathway Gothic One', 'Encode Sans Condensed', 'Saira Condensed'],
  warm: ['Merriweather', 'Lora', 'Crimson', 'Vollkorn', 'Bitter', 'Arvo', 'Rokkitt', 'Zilla Slab'],
  cool: ['Inter', 'SF Pro', 'Helvetica Neue', 'Roboto', 'IBM Plex Sans', 'Work Sans', 'DM Sans', 'Outfit']
};

// Suggested pairings: heading -> body fonts that work well together
const PAIRING_RULES = {
  // Serif headings pair well with sans body
  'serif-heading': ['sans-serif', 'humanist', 'geometric'],
  // Display headings pair with clean body fonts
  'display-heading': ['sans-serif', 'serif'],
  // Grotesk headings with serif body for contrast
  'grotesk-heading': ['serif', 'humanist'],
  // Mono headings (rare) with sans body
  'monospace-heading': ['sans-serif', 'humanist']
};

// Quality fonts curated for heading use
const CURATED_HEADING_FONTS = [
  // Elegant Serifs
  { name: 'Playfair Display', category: 'serif', moods: ['elegant', 'editorial', 'vintage'], weight: '400;500;600;700;800;900', variable: true },
  { name: 'Cormorant Garamond', category: 'serif', moods: ['elegant', 'editorial'], weight: '300;400;500;600;700', variable: false },
  { name: 'EB Garamond', category: 'serif', moods: ['elegant', 'vintage', 'editorial'], weight: '400;500;600;700;800', variable: true },
  { name: 'Bodoni Moda', category: 'serif', moods: ['elegant', 'editorial', 'vintage'], weight: '400;500;600;700;800;900', variable: true },
  { name: 'DM Serif Display', category: 'serif', moods: ['elegant', 'editorial'], weight: '400', variable: false },
  { name: 'Libre Baskerville', category: 'serif', moods: ['elegant', 'editorial'], weight: '400;700', variable: false },
  { name: 'Fraunces', category: 'serif', moods: ['elegant', 'playful', 'vintage'], weight: '300;400;500;600;700;800;900', variable: true },
  { name: 'Lora', category: 'serif', moods: ['elegant', 'warm', 'editorial'], weight: '400;500;600;700', variable: true },
  { name: 'Spectral', category: 'serif', moods: ['elegant', 'editorial'], weight: '300;400;500;600;700;800', variable: false },
  { name: 'Newsreader', category: 'serif', moods: ['editorial', 'warm'], weight: '300;400;500;600;700;800', variable: true },

  // Display & Experimental
  { name: 'Unbounded', category: 'display', moods: ['experimental', 'brutalist', 'tech'], weight: '300;400;500;600;700;800;900', variable: true },
  { name: 'Syne', category: 'sans-serif', moods: ['experimental', 'tech', 'grotesk'], weight: '400;500;600;700;800', variable: true },
  { name: 'Space Grotesk', category: 'sans-serif', moods: ['tech', 'grotesk', 'experimental'], weight: '300;400;500;600;700', variable: true },
  { name: 'Bricolage Grotesque', category: 'display', moods: ['experimental', 'grotesk', 'playful'], weight: '300;400;500;600;700;800', variable: true },
  { name: 'Clash Display', category: 'display', moods: ['experimental', 'brutalist'], weight: '400;500;600;700', variable: true },
  { name: 'Cabinet Grotesk', category: 'display', moods: ['experimental', 'grotesk'], weight: '400;500;700;800;900', variable: true },

  // Brutalist & Bold
  { name: 'Bebas Neue', category: 'display', moods: ['brutalist', 'condensed'], weight: '400', variable: false },
  { name: 'Anton', category: 'display', moods: ['brutalist', 'condensed'], weight: '400', variable: false },
  { name: 'Oswald', category: 'sans-serif', moods: ['brutalist', 'condensed'], weight: '300;400;500;600;700', variable: true },
  { name: 'Archivo Black', category: 'sans-serif', moods: ['brutalist'], weight: '400', variable: false },
  { name: 'Righteous', category: 'display', moods: ['playful', 'vintage'], weight: '400', variable: false },

  // Geometric & Modern
  { name: 'Outfit', category: 'sans-serif', moods: ['geometric', 'cool', 'tech'], weight: '300;400;500;600;700;800;900', variable: true },
  { name: 'Plus Jakarta Sans', category: 'sans-serif', moods: ['geometric', 'cool'], weight: '300;400;500;600;700;800', variable: true },
  { name: 'Poppins', category: 'sans-serif', moods: ['geometric', 'playful'], weight: '300;400;500;600;700;800;900', variable: false },
  { name: 'Montserrat', category: 'sans-serif', moods: ['geometric', 'cool'], weight: '300;400;500;600;700;800;900', variable: true },
  { name: 'Raleway', category: 'sans-serif', moods: ['geometric', 'elegant'], weight: '300;400;500;600;700;800;900', variable: true },

  // Warm & Friendly
  { name: 'Nunito', category: 'sans-serif', moods: ['geometric', 'warm', 'playful'], weight: '300;400;500;600;700;800;900', variable: true },
  { name: 'Quicksand', category: 'sans-serif', moods: ['geometric', 'playful', 'warm'], weight: '300;400;500;600;700', variable: true },

  // Humanist
  { name: 'Source Sans 3', category: 'sans-serif', moods: ['humanist', 'cool'], weight: '300;400;500;600;700;800;900', variable: true },
  { name: 'Open Sans', category: 'sans-serif', moods: ['humanist', 'cool'], weight: '300;400;500;600;700;800', variable: true },
  { name: 'Lato', category: 'sans-serif', moods: ['humanist', 'warm'], weight: '300;400;700;900', variable: false },

  // Handwritten/Script (use sparingly)
  { name: 'Caveat', category: 'handwriting', moods: ['handwritten', 'playful', 'warm'], weight: '400;500;600;700', variable: true },
  { name: 'Kalam', category: 'handwriting', moods: ['handwritten', 'playful'], weight: '300;400;700', variable: false },

  // Monospace (for tech themes)
  { name: 'JetBrains Mono', category: 'monospace', moods: ['monospace', 'tech'], weight: '400;500;600;700;800', variable: true },
  { name: 'Fira Code', category: 'monospace', moods: ['monospace', 'tech'], weight: '300;400;500;600;700', variable: true },
  { name: 'Space Mono', category: 'monospace', moods: ['monospace', 'tech', 'brutalist'], weight: '400;700', variable: false },
];

// Quality fonts curated for body use (readability is key)
const CURATED_BODY_FONTS = [
  // Readable Serifs
  { name: 'Source Serif 4', category: 'serif', moods: ['editorial', 'warm'], weight: '300;400;500;600;700', variable: true },
  { name: 'Crimson Text', category: 'serif', moods: ['elegant', 'editorial', 'warm'], weight: '400;600;700', variable: false },
  { name: 'Merriweather', category: 'serif', moods: ['editorial', 'warm'], weight: '300;400;700;900', variable: false },
  { name: 'Literata', category: 'serif', moods: ['editorial', 'elegant'], weight: '300;400;500;600;700', variable: true },
  { name: 'Lora', category: 'serif', moods: ['elegant', 'warm'], weight: '400;500;600;700', variable: true },
  { name: 'Vollkorn', category: 'serif', moods: ['warm', 'vintage'], weight: '400;500;600;700;800;900', variable: true },
  { name: 'Bitter', category: 'serif', moods: ['warm', 'editorial'], weight: '300;400;500;600;700;800;900', variable: true },
  { name: 'Spectral', category: 'serif', moods: ['elegant', 'editorial'], weight: '300;400;500;600;700;800', variable: false },
  { name: 'Newsreader', category: 'serif', moods: ['editorial'], weight: '300;400;500;600;700;800', variable: true },
  { name: 'PT Serif', category: 'serif', moods: ['editorial', 'warm'], weight: '400;700', variable: false },

  // Clean Sans-Serifs
  { name: 'Inter', category: 'sans-serif', moods: ['cool', 'tech', 'geometric'], weight: '300;400;500;600;700;800;900', variable: true },
  { name: 'IBM Plex Sans', category: 'sans-serif', moods: ['tech', 'cool', 'humanist'], weight: '300;400;500;600;700', variable: false },
  { name: 'Work Sans', category: 'sans-serif', moods: ['geometric', 'cool'], weight: '300;400;500;600;700;800;900', variable: true },
  { name: 'Nunito Sans', category: 'sans-serif', moods: ['humanist', 'warm', 'playful'], weight: '300;400;500;600;700;800;900', variable: true },
  { name: 'DM Sans', category: 'sans-serif', moods: ['geometric', 'cool'], weight: '300;400;500;600;700', variable: true },
  { name: 'Instrument Sans', category: 'sans-serif', moods: ['experimental', 'cool'], weight: '400;500;600;700', variable: true },
  { name: 'Public Sans', category: 'sans-serif', moods: ['humanist', 'cool'], weight: '300;400;500;600;700;800;900', variable: true },
  { name: 'Karla', category: 'sans-serif', moods: ['geometric', 'warm'], weight: '300;400;500;600;700;800', variable: true },
  { name: 'Rubik', category: 'sans-serif', moods: ['geometric', 'playful'], weight: '300;400;500;600;700;800;900', variable: true },
  { name: 'Manrope', category: 'sans-serif', moods: ['geometric', 'cool', 'tech'], weight: '300;400;500;600;700;800', variable: true },
  { name: 'Outfit', category: 'sans-serif', moods: ['geometric', 'cool'], weight: '300;400;500;600;700;800;900', variable: true },
  { name: 'Plus Jakarta Sans', category: 'sans-serif', moods: ['geometric', 'cool'], weight: '300;400;500;600;700;800', variable: true },
  { name: 'Figtree', category: 'sans-serif', moods: ['geometric', 'warm', 'playful'], weight: '300;400;500;600;700;800;900', variable: true },
  { name: 'Albert Sans', category: 'sans-serif', moods: ['geometric', 'cool'], weight: '300;400;500;600;700;800;900', variable: true },

  // Monospace (for code-heavy or tech themes)
  { name: 'IBM Plex Mono', category: 'monospace', moods: ['monospace', 'tech'], weight: '300;400;500;600;700', variable: false },
  { name: 'JetBrains Mono', category: 'monospace', moods: ['monospace', 'tech'], weight: '400;500;600;700;800', variable: true },
  { name: 'Fira Code', category: 'monospace', moods: ['monospace', 'tech'], weight: '300;400;500;600;700', variable: true },
];

/**
 * Fetch fonts from Google Fonts API
 */
async function fetchFromGoogleAPI(apiKey) {
  const url = `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Failed to fetch from Google Fonts API:', error.message);
    return null;
  }
}

/**
 * Classify a font's mood based on its name and category
 */
function classifyMood(fontName, category) {
  const moods = [];
  const nameLower = fontName.toLowerCase();

  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword.toLowerCase())) {
        moods.push(mood);
        break;
      }
    }
  }

  // Default moods based on category
  if (moods.length === 0) {
    if (category === 'serif') moods.push('elegant');
    if (category === 'sans-serif') moods.push('cool');
    if (category === 'display') moods.push('experimental');
    if (category === 'handwriting') moods.push('playful');
    if (category === 'monospace') moods.push('tech');
  }

  return moods;
}

/**
 * Build the font URL for Google Fonts
 */
function buildFontUrl(fontName, weights) {
  const encodedName = fontName.replace(/ /g, '+');
  return `https://fonts.googleapis.com/css2?family=${encodedName}:wght@${weights}&display=swap`;
}

/**
 * Build font stack based on category
 */
function buildFontStack(fontName, category) {
  if (category === 'sans-serif') {
    return `'${fontName}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  } else if (category === 'display') {
    return `'${fontName}', 'Helvetica Neue', Arial, sans-serif`;
  } else if (category === 'monospace') {
    return `'${fontName}', 'SF Mono', Monaco, 'Courier New', monospace`;
  } else if (category === 'handwriting') {
    return `'${fontName}', cursive`;
  } else {
    return `'${fontName}', Georgia, 'Times New Roman', serif`;
  }
}

/**
 * Merge API fonts with curated fonts
 */
function mergeFonts(apiFonts, curatedFonts) {
  const fontMap = new Map();

  // Add curated fonts first (they have better metadata)
  for (const font of curatedFonts) {
    fontMap.set(font.name, font);
  }

  // Add API fonts if they're not already in curated list
  if (apiFonts) {
    for (const font of apiFonts.slice(0, 200)) { // Top 200 popular fonts
      if (!fontMap.has(font.family)) {
        const weights = font.variants
          .filter(v => !v.includes('italic'))
          .map(v => v === 'regular' ? '400' : v)
          .filter(v => /^\d+$/.test(v))
          .join(';');

        if (weights) {
          fontMap.set(font.family, {
            name: font.family,
            category: font.category,
            moods: classifyMood(font.family, font.category),
            weight: weights,
            variable: font.axes?.length > 0 || false,
            fromAPI: true
          });
        }
      }
    }
  }

  return Array.from(fontMap.values());
}

/**
 * Save fonts to JSON file
 */
function saveFonts(headingFonts, bodyFonts) {
  const data = {
    lastUpdated: new Date().toISOString(),
    headingFonts: headingFonts.map(f => ({
      ...f,
      url: buildFontUrl(f.name, f.weight),
      stack: buildFontStack(f.name, f.category)
    })),
    bodyFonts: bodyFonts.map(f => ({
      ...f,
      url: buildFontUrl(f.name, f.weight),
      stack: buildFontStack(f.name, f.category)
    })),
    moodDescriptions: {
      elegant: 'Sophisticated, refined, luxurious',
      editorial: 'Magazine-style, journalistic, readable',
      brutalist: 'Bold, stark, confrontational',
      playful: 'Fun, friendly, whimsical',
      tech: 'Modern, digital, precise',
      geometric: 'Clean shapes, mathematical',
      vintage: 'Retro, nostalgic, classic',
      humanist: 'Friendly, approachable, organic',
      grotesk: 'Neutral, Swiss-style, clean',
      experimental: 'Avant-garde, unusual, distinctive',
      monospace: 'Code-like, technical, systematic',
      handwritten: 'Personal, casual, organic',
      condensed: 'Compact, headline-focused, impactful',
      warm: 'Inviting, comfortable, cozy',
      cool: 'Professional, neutral, modern'
    }
  };

  writeFileSync(FONTS_PATH, JSON.stringify(data, null, 2));
  console.log(`Saved ${headingFonts.length} heading fonts and ${bodyFonts.length} body fonts to ${FONTS_PATH}`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const keyIndex = args.indexOf('--key');
  const apiKey = keyIndex !== -1 ? args[keyIndex + 1] : null;

  console.log('Google Fonts Fetcher\n');

  let apiFonts = null;

  if (apiKey) {
    console.log('Fetching fonts from Google Fonts API...');
    apiFonts = await fetchFromGoogleAPI(apiKey);
    if (apiFonts) {
      console.log(`Fetched ${apiFonts.length} fonts from API`);
    }
  } else {
    console.log('No API key provided, using curated font list only.');
    console.log('To fetch from Google Fonts API, run with: --key YOUR_API_KEY\n');
  }

  // Merge with curated fonts
  const headingFonts = mergeFonts(apiFonts, CURATED_HEADING_FONTS);
  const bodyFonts = mergeFonts(apiFonts, CURATED_BODY_FONTS);

  // Save to JSON
  saveFonts(headingFonts, bodyFonts);

  console.log('\nFont categories available:');
  const allMoods = new Set([...headingFonts, ...bodyFonts].flatMap(f => f.moods));
  console.log([...allMoods].sort().join(', '));
}

main().catch(console.error);
