import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('themes-explorer bundle (PCD-264)', () => {
  it('defines themes-explorer manual chunk ahead of framer-motion', () => {
    const config = readFileSync(join(process.cwd(), 'astro.config.mjs'), 'utf8');
    expect(config).toMatch(/['"]themes-explorer['"]/);
    expect(config).toMatch(/node_modules\/@json-render\//);
    expect(config).not.toMatch(/ThemesExplorerMount\.tsx/);

    const themesIdx = config.indexOf("'themes-explorer'");
    const framerIdx = config.indexOf("'framer-motion'");
    expect(themesIdx).toBeGreaterThan(-1);
    expect(framerIdx).toBeGreaterThan(themesIdx);
  });

  it('loads /daily-themes through ThemesExplorerMount, not the heavy explorer entry', () => {
    const page = readFileSync(join(process.cwd(), 'src/pages/daily-themes.astro'), 'utf8');
    expect(page).toMatch(/ThemesExplorerMount/);
    expect(page).not.toMatch(/ThemesExplorer client:/);
  });

  it('keeps json-render out of the mount island static graph', () => {
    const mount = readFileSync(
      join(process.cwd(), 'src/components/generative-ui/ThemesExplorerMount.tsx'),
      'utf8',
    );
    expect(mount).toMatch(/import\('\.\/ThemesExplorer'\)/);
    expect(mount).not.toMatch(/@json-render/);
    expect(mount).not.toMatch(/from ['"]zod['"]/);
  });

  it('built mount chunk only dynamic-imports the optional themes-explorer bundle', () => {
    const astroDir = join(process.cwd(), 'dist/client/_astro');
    if (!existsSync(astroDir)) return;

    const mountChunk = readdirSync(astroDir).find(
      (name) => name.startsWith('ThemesExplorerMount.') && name.endsWith('.js'),
    );
    expect(mountChunk).toBeTruthy();

    const source = readFileSync(join(astroDir, mountChunk!), 'utf8');
    expect(source).toMatch(/themes-explorer\./);
    expect(source).not.toMatch(/from"\.\/themes-explorer/);
    expect(source).not.toMatch(/@json-render/);
  });
});