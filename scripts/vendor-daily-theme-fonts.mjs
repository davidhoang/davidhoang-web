#!/usr/bin/env node
/**
 * Download woff2 files and build @font-face CSS for Google Fonts used by
 * src/data/daily-themes.json (narrowed the same way as theme-font-stylesheet).
 *
 * Run after changing daily-themes.json font families/URLs/typography:
 *   node scripts/vendor-daily-theme-fonts.mjs
 *
 * Writes:
 *   - public/fonts/daily-theme/*.woff2
 *   - src/styles/fonts/daily-theme-google/<slug>.css (one file per family)
 *   - src/styles/fonts/daily-theme-google-imports.ts (?raw map for MainLayout)
 *   - src/data/theme-daily-google-font-latin.json (latin subset preload map)
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectNarrowedGoogleStylesheetUrls } from './lib/daily-theme-font-urls.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const THEMES_JSON = join(ROOT, 'src/data/daily-themes.json');
const OUT_DIR = join(ROOT, 'public/fonts/daily-theme');
const OUT_CSS_DIR = join(ROOT, 'src/styles/fonts/daily-theme-google');
const LEGACY_BUNDLE = join(ROOT, 'src/styles/fonts/daily-theme-google.css');
const OUT_IMPORTS_TS = join(ROOT, 'src/styles/fonts/daily-theme-google-imports.ts');
const OUT_LATIN_JSON = join(ROOT, 'src/data/theme-daily-google-font-latin.json');
const OUT_NAMES_JSON = join(ROOT, 'src/data/theme-daily-google-font-names.json');
const OUT_PUBLIC_BUNDLE = join(ROOT, 'public/daily-theme-google-fonts.css');

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const gstaticUrlToLocal = new Map();

/**
 * Stable local path for a gstatic font URL (pathname .woff2 or /l/font? hashed).
 * @param {string} gstaticUrl
 */
function localFontPath(gstaticUrl) {
  if (gstaticUrlToLocal.has(gstaticUrl)) return gstaticUrlToLocal.get(gstaticUrl);
  const u = new URL(gstaticUrl);
  let base;
  if (/\.woff2$/i.test(u.pathname)) {
    base = u.pathname.split('/').pop() || 'font.woff2';
  } else {
    const hash = createHash('sha256').update(gstaticUrl).digest('hex').slice(0, 16);
    base = `gstatic-${hash}.woff2`;
  }
  const path = `/fonts/daily-theme/${base}`;
  gstaticUrlToLocal.set(gstaticUrl, path);
  return path;
}

async function ensureDir() {
  await mkdir(OUT_DIR, { recursive: true });
}

async function downloadBinary(url) {
  const res = await fetch(url, { headers: { 'User-Agent': CHROME_UA } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Fetch CSS, download each woff2 once, rewrite src urls to local paths.
 * @param {string} stylesheetUrl
 */
async function processStylesheet(stylesheetUrl) {
  const cssRes = await fetch(stylesheetUrl, { headers: { 'User-Agent': CHROME_UA } });
  if (!cssRes.ok) throw new Error(`GET ${stylesheetUrl} -> ${cssRes.status}`);
  let css = await cssRes.text();

  const woff2Urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/gi)].map((m) =>
    m[1].replace(/["']/g, ''),
  );
  const unique = [...new Set(woff2Urls)];

  for (const gUrl of unique) {
    const localPath = localFontPath(gUrl);
    const fileName = localPath.replace(/^\/fonts\/daily-theme\//, '');
    const buf = await downloadBinary(gUrl);
    await writeFile(join(OUT_DIR, fileName), buf);
    const escaped = gUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    css = css.replace(new RegExp(escaped, 'g'), localPath);
  }

  return css.trim();
}

/**
 * One woff2 path per (family, weight) for latin @font-face blocks only — used for preload caps.
 * @param {string} fullCss
 */
function buildLatinPreloadMap(fullCss) {
  /** @type {Record<string, Record<number, string>>} */
  const byFamily = {};

  const re = /\/\* latin \*\/\s*@font-face\s*\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(fullCss)) !== null) {
    const block = m[1];
    const famMatch = block.match(/font-family:\s*['"]([^'"]+)['"]/);
    const wMatch = block.match(/font-weight:\s*(\d+)/);
    const srcMatch = block.match(/src:\s*url\((\/fonts\/daily-theme\/[^)]+\.woff2)\)/);
    if (!famMatch || !wMatch || !srcMatch) continue;
    const family = famMatch[1];
    const weight = parseInt(wMatch[1], 10);
    const path = srcMatch[1];
    if (!byFamily[family]) byFamily[family] = {};
    if (!byFamily[family][weight]) byFamily[family][weight] = path;
  }

  return byFamily;
}

function slugifyFontName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  gstaticUrlToLocal.clear();
  const raw = await readFile(THEMES_JSON, 'utf8');
  const themesData = JSON.parse(raw);
  const urlMap = collectNarrowedGoogleStylesheetUrls(themesData);

  if (urlMap.size === 0) {
    console.warn('vendor-daily-theme-fonts: no Google Font stylesheet URLs found; exiting.');
    await rm(OUT_CSS_DIR, { recursive: true, force: true });
    await writeFile(
      OUT_IMPORTS_TS,
      `/** AUTO-GENERATED — empty; run vendor script after adding Google Fonts to daily-themes.json */\nexport const dailyThemeGoogleFontCss: Record<string, string> = {};\n`,
    );
    await writeFile(OUT_LATIN_JSON, '{}\n');
    await writeFile(OUT_NAMES_JSON, '[]\n');
    await writeFile(OUT_PUBLIC_BUNDLE, '/* Empty — run npm run vendor-daily-theme-fonts */\n');
    return;
  }

  await ensureDir();
  await mkdir(OUT_CSS_DIR, { recursive: true });
  try {
    await rm(LEGACY_BUNDLE, { force: true });
  } catch {
    /* ignore */
  }

  /** @type {Record<string, Record<number, string>>} */
  const latinMerged = {};
  const importLines = [];
  const exportPairs = [];
  const publicBundleBlocks = [];

  let idx = 0;
  for (const [href, meta] of [...urlMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log('Fetching', meta.displayName, href);
    const css = await processStylesheet(href);
    const slug = slugifyFontName(meta.displayName);
    const perFileHeader = `/* AUTO-GENERATED by scripts/vendor-daily-theme-fonts.mjs — ${meta.displayName} */\n`;
    const fileBody = perFileHeader + css + '\n';
    await writeFile(join(OUT_CSS_DIR, `${slug}.css`), fileBody);
    publicBundleBlocks.push(fileBody.trimEnd());

    const varName = `raw_${slug.replace(/-/g, '_')}_${idx}`;
    importLines.push(`import ${varName} from './daily-theme-google/${slug}.css?raw';`);
    exportPairs.push(`  ${JSON.stringify(meta.displayName)}: ${varName},`);

    Object.assign(latinMerged, buildLatinPreloadMap(css));
    idx += 1;
  }

  await writeFile(
    OUT_PUBLIC_BUNDLE,
    `/* AUTO-GENERATED by scripts/vendor-daily-theme-fonts.mjs — full @font-face bundle for client theme switching */\n${publicBundleBlocks.join('\n\n')}\n`,
  );

  const importsTs = `/**
 * AUTO-GENERATED by scripts/vendor-daily-theme-fonts.mjs — do not edit by hand.
 * CSS strings for Google Fonts families vendored under public/fonts/daily-theme/.
 */
${importLines.join('\n')}

export const dailyThemeGoogleFontCss: Record<string, string> = {
${exportPairs.join('\n')}
};
`;

  await writeFile(OUT_IMPORTS_TS, importsTs);
  await writeFile(OUT_LATIN_JSON, `${JSON.stringify(latinMerged, null, 2)}\n`);
  const names = [...new Set([...urlMap.values()].map((m) => m.displayName))].sort();
  await writeFile(OUT_NAMES_JSON, `${JSON.stringify(names, null, 2)}\n`);

  console.log('Wrote', OUT_IMPORTS_TS);
  console.log('Wrote per-family CSS under', OUT_CSS_DIR);
  console.log('Wrote', OUT_LATIN_JSON);
  console.log('Wrote', OUT_NAMES_JSON);
  console.log('Wrote', OUT_PUBLIC_BUNDLE);
  console.log('Wrote woff2 files under', OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
