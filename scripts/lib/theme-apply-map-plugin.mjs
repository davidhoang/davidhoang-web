import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildThemeApply } from './daily-theme-apply.mjs';

const THEMES_REL = join('src', 'data', 'daily-themes.json');
const OUT_REL = join('public', 'theme-apply-map.js');

/** @param {string} root */
export function writeThemeApplyMapFile(root) {
  const themesPath = join(root, THEMES_REL);
  const outPath = join(root, OUT_REL);
  const themesData = JSON.parse(readFileSync(themesPath, 'utf-8'));

  /** @type {Record<string, unknown>} */
  const themesApplyMap = {};
  for (const theme of themesData.themes || []) {
    if (theme?.date) {
      themesApplyMap[theme.date] = buildThemeApply(theme);
    }
  }

  const js = `window.__themesApplyMap=${JSON.stringify(themesApplyMap)};`;
  writeFileSync(outPath, js, 'utf-8');
}

export function themeApplyMapPlugin() {
  /** @type {string} */
  let root = process.cwd();

  return {
    name: 'theme-apply-map',
    configResolved(config) {
      root = config.root;
    },
    buildStart() {
      writeThemeApplyMapFile(root);
    },
    configureServer(server) {
      writeThemeApplyMapFile(root);
      server.watcher.on('change', (file) => {
        if (file.endsWith('daily-themes.json')) {
          writeThemeApplyMapFile(root);
        }
      });
    },
  };
}
