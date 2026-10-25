/**
 * Spot-check axe rules for PCD-146/148/149/147.
 * Usage: UI_TEST_URL=http://127.0.0.1:4321 node scripts/audit-a11y-spot-check.mjs
 */
import { chromium, devices } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const baseUrl = process.env.UI_TEST_URL || 'http://127.0.0.1:4321';
const rules = [
  'aria-allowed-role',
  'presentation-role-conflict',
  'landmark-one-main',
  'region',
];

const pages = [
  { name: 'home-desktop', path: '/', viewport: { width: 1280, height: 800 } },
  { name: 'home-mobile', path: '/', device: 'iPhone 13' },
  { name: 'design-guide', path: '/design-guide', viewport: { width: 1280, height: 800 } },
  { name: 'obduction', path: '/prototypes/design-leadership-obduction', viewport: { width: 1280, height: 800 } },
];

async function scan(context, { name, path, viewport, device }) {
  const page = await context.newPage();
  if (device) {
    const descriptor = devices[device];
    await page.setViewportSize(descriptor.viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
  } else if (viewport) {
    await page.setViewportSize(viewport);
  }
  await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForTimeout(1200);

  const results = await new AxeBuilder({ page }).withRules(rules).analyze();
  const violations = results.violations.filter((v) => rules.includes(v.id));
  await page.close();
  return { name, path, violations };
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const reports = [];

for (const entry of pages) {
  reports.push(await scan(context, entry));
}

await browser.close();

let failed = false;
for (const report of reports) {
  if (report.violations.length === 0) {
    console.log(`OK ${report.name} (${report.path})`);
    continue;
  }
  failed = true;
  console.log(`FAIL ${report.name} (${report.path})`);
  for (const v of report.violations) {
    console.log(`  ${v.id}: ${v.help}`);
    for (const node of v.nodes.slice(0, 3)) {
      console.log(`    ${node.target.join(' ')}`);
    }
  }
}

if (failed) process.exit(1);
