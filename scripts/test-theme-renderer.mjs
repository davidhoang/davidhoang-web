import { readFile } from 'node:fs/promises';
import { renderThemeSet } from './lib/theme-renderer.mjs';

const themeData = JSON.parse(await readFile(
  new URL('../src/data/daily-themes.json', import.meta.url),
  'utf8',
));
const baseTheme = themeData.themes?.[0];
if (!baseTheme) throw new Error('Theme renderer smoke test requires at least one theme fixture.');

const structures = [
  ['standard', 'stacked-fan'],
  ['asymmetric', 'editorial'],
  ['split', 'cinematic'],
  ['magazine', 'scattered'],
  ['sidebar', 'rolodex'],
];

const safeEntries = structures.map(([gridStyle, heroLayout], index) => {
  const theme = structuredClone(baseTheme);
  theme.date = `render-smoke-${index}`;
  theme.layout = { ...theme.layout, gridStyle };
  theme.hero = { ...theme.hero, layout: heroLayout };
  return { id: `${gridStyle}-${heroLayout}`, theme };
});

const unsafeTheme = structuredClone(baseTheme);
unsafeTheme.date = 'render-smoke-transparent';
unsafeTheme.colors.light['--color-card-bg'] = 'rgba(0, 0, 0, 0.5)';
const unsafeEntry = { id: 'transparent-card-fixture', theme: unsafeTheme };

const report = await renderThemeSet({
  rootDir: process.cwd(),
  entries: [...safeEntries, unsafeEntry],
});

const failures = [];
for (const entry of safeEntries) {
  for (const { name } of report.viewports) {
    const issues = report.results[entry.id].viewports[name].metrics.issues;
    if (issues.length > 0) failures.push(`${entry.id}/${name}: ${issues.join(', ')}`);
  }
}

for (const { name } of report.viewports) {
  const issues = report.results[unsafeEntry.id].viewports[name].metrics.issues;
  if (!issues.some((issue) => issue.startsWith('transparent-cards:'))) {
    failures.push(`${unsafeEntry.id}/${name}: transparent card was not rejected`);
  }
}

if (failures.length > 0) {
  throw new Error(`Theme renderer smoke test failed:\n${failures.join('\n')}`);
}

console.log(`Theme renderer smoke test passed: ${safeEntries.length * report.viewports.length} safe renders and ${report.viewports.length} rejection checks.`);
