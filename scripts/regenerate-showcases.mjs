#!/usr/bin/env node

/**
 * Regenerate showcase specs for all existing themes.
 * Usage: node scripts/regenerate-showcases.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { generateShowcaseSpec } from './lib/showcase-generator.mjs';

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

async function main() {
  const themesPath = join(rootDir, 'src', 'data', 'daily-themes.json');
  const themesData = JSON.parse(readFileSync(themesPath, 'utf-8'));
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  console.log(`Regenerating showcases for ${themesData.themes.length} themes...\n`);

  for (const theme of themesData.themes) {
    process.stdout.write(`${theme.name} (${theme.date})... `);
    try {
      const showcase = await generateShowcaseSpec(client, theme);
      theme.showcase = showcase;
      console.log(`${Object.keys(showcase.elements).length} elements`);
    } catch (err) {
      console.log(`FAILED: ${err.message}`);
    }
  }

  writeFileSync(themesPath, JSON.stringify(themesData, null, 2));
  console.log('\nDone! Updated src/data/daily-themes.json');
}

main();
