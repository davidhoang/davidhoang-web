#!/usr/bin/env node
/**
 * Regenerate the latin ABCDiatype variable WOFF2 subset used for @font-face and preload.
 * Full file remains for glyphs outside unicode-range (rare symbols, future content).
 *
 * Requires: pip install fonttools brotli (pyftsubset on PATH)
 *
 * Dinamo Web license: self-hosted WOFF2; subsetting reduces transfer (abcdinamo.com/licenses).
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(repoRoot, 'public/fonts/ABCDiatypeVariable.woff2');
const output = path.join(repoRoot, 'public/fonts/ABCDiatypeVariable-latin.woff2');

const UNICODES = [
  'U+0000-00FF',
  'U+0131',
  'U+0152-0153',
  'U+02BB-02BC',
  'U+02C6',
  'U+02DA',
  'U+02DC',
  'U+0304',
  'U+0308',
  'U+0329',
  'U+2000-206F',
  'U+20AC',
  'U+2122',
  'U+2190-2194',
  'U+2197',
  'U+21B5',
  'U+2212',
  'U+2248',
  'U+2260',
  'U+2264',
  'U+2265',
  'U+2318',
  'U+2500',
  'U+25CB',
  'U+25CF',
  'U+25D0',
  'U+2728',
  'U+FEFF',
  'U+FFFD',
].join(',');

if (!existsSync(source)) {
  console.error('Missing source font:', source);
  process.exit(1);
}

const pyftsubset = process.env.PYFTSUBSET || 'pyftsubset';

execFileSync(
  pyftsubset,
  [
    source,
    `--output-file=${output}`,
    '--flavor=woff2',
    `--unicodes=${UNICODES}`,
    '--layout-features=*',
    '--glyph-names',
    '--symbol-cmap',
    '--legacy-cmap',
    '--notdef-outline',
    '--notdef-glyph',
    '--recommended-glyphs',
  ],
  { stdio: 'inherit' },
);

console.log('Wrote', output);
