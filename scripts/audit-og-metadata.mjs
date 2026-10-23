#!/usr/bin/env node
/**
 * List sitemap routes with Open Graph / Twitter metadata from a production build.
 * Usage: npm run build && node scripts/audit-og-metadata.mjs [--json]
 */
import fs from 'node:fs';
import path from 'node:path';

const distDir = path.resolve('dist/client');
const asJson = process.argv.includes('--json');

const SHARED_GENERIC = [
  '/images/img-dh-web-light.webp',
  '/images/img-dh.webp',
  '/images/highlights/img-highlights-proof-of-concept.webp',
  '/images/header-images/img-header-writing.webp',
];

function readSitemapLocs() {
  const indexPath = path.join(distDir, 'sitemap-index.xml');
  const indexXml = fs.readFileSync(indexPath, 'utf8');
  const partPaths = [...indexXml.matchAll(/<loc>([^<]+sitemap-\d+\.xml)<\/loc>/g)].map((m) => m[1]);
  const locs = [];
  for (const partUrl of partPaths) {
    const partName = new URL(partUrl).pathname.split('/').pop();
    const partXml = fs.readFileSync(path.join(distDir, partName), 'utf8');
    locs.push(...[...partXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  }
  return locs.sort();
}

function htmlPathForPathname(pathname) {
  if (pathname === '/') return path.join(distDir, 'index.html');
  const dirIndex = path.join(distDir, pathname.replace(/\/$/, ''), 'index.html');
  if (fs.existsSync(dirIndex)) return dirIndex;
  return path.join(distDir, pathname.slice(1) + '.html');
}

function extractMeta(html, key) {
  if (key === 'canonical') {
    return html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? null;
  }
  const re = new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`);
  return html.match(re)?.[1] ?? null;
}

function classifyOgImage(url) {
  if (!url) return 'missing';
  if (url.includes('/api/og')) return 'generated';
  let pathname;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return 'invalid';
  }
  if (SHARED_GENERIC.includes(pathname)) return 'generic-stock';
  return 'static-custom';
}

if (!fs.existsSync(distDir)) {
  console.error('Run npm run build first (dist/client missing).');
  process.exit(1);
}

const rows = [];
for (const loc of readSitemapLocs()) {
  const pathname = new URL(loc).pathname;
  const htmlPath = htmlPathForPathname(pathname);
  if (!fs.existsSync(htmlPath)) {
    rows.push({ path: pathname, error: 'no-html' });
    continue;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const ogImage = extractMeta(html, 'og:image');
  rows.push({
    path: pathname,
    ogImage,
    twitterImage: extractMeta(html, 'twitter:image'),
    ogTitle: extractMeta(html, 'og:title'),
    ogDescription: extractMeta(html, 'og:description'),
    canonical: extractMeta(html, 'canonical'),
    ogClass: classifyOgImage(ogImage),
  });
}

const summary = rows.reduce(
  (acc, row) => {
    acc[row.ogClass] = (acc[row.ogClass] ?? 0) + 1;
    return acc;
  },
  {},
);

if (asJson) {
  console.log(JSON.stringify({ summary, rows }, null, 2));
} else {
  console.log('OG metadata audit (sitemap scope)\n');
  console.log('Summary:', summary);
  console.log('\npath\togClass\tog:image');
  for (const row of rows) {
    console.log(`${row.path}\t${row.ogClass ?? row.error}\t${row.ogImage ?? '—'}`);
  }
}
