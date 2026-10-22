/**
 * PCD-138: Scan built site for axe label-content-name-mismatch on known selectors.
 * Usage: UI_TEST_URL=http://127.0.0.1:4322 node scripts/audit-label-in-name.mjs
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';

const baseUrl = process.env.UI_TEST_URL || 'http://127.0.0.1:4322';
const maxPages = Number(process.env.AXE_MAX_PAGES || '55');
const focusSelectors = ['logo', 'cmd-k-hint', 'footer-logo', 'role="link"'];

function loadSitemapUrls() {
  try {
    const xml = readFileSync('dist/client/sitemap-0.xml', 'utf8');
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
      const loc = m[1];
      try {
        return new URL(loc).pathname;
      } catch {
        return loc;
      }
    });
    return urls.slice(0, maxPages);
  } catch {
    return ['/'];
  }
}

async function scanPage(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(800);
  const results = await new AxeBuilder({ page })
    .withRules(['label-content-name-mismatch'])
    .analyze();
  const violations = results.violations.filter((v) => v.id === 'label-content-name-mismatch');
  const matched = [];
  for (const v of violations) {
    for (const node of v.nodes) {
      if (focusSelectors.some((sel) => node.target?.some((t) => t.includes(sel)))) {
        matched.push({ url, target: node.target, html: node.html?.slice(0, 120) });
      }
    }
  }
  return { url, violationCount: violations.length, matched };
}

async function main() {
  const urls = loadSitemapUrls();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  let totalViolations = 0;
  let totalMatched = 0;
  const samples = [];

  for (const pathOrUrl of urls) {
    const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${baseUrl}${pathOrUrl}`;
    try {
      const result = await scanPage(page, url);
      totalViolations += result.violationCount;
      totalMatched += result.matched.length;
      if (result.matched.length) samples.push(...result.matched.slice(0, 2));
    } catch (err) {
      console.error('FAIL', url, err.message);
    }
  }

  await browser.close();
  console.log(JSON.stringify({ pages: urls.length, totalViolations, totalMatched, samples: samples.slice(0, 8) }, null, 2));
  const failed = totalViolations > 0;
  process.exit(failed ? 1 : 0);
}

main();
