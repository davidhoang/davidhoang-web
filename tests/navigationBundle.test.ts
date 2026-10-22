import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Navigation bundle (PCD-143)', () => {
  it('keeps viewport-capabilities in its own manual chunk ahead of hero-components', () => {
    const config = readFileSync(join(process.cwd(), 'astro.config.mjs'), 'utf8');
    expect(config).toMatch(/['"]viewport-capabilities['"]/);
    expect(config).toMatch(/src\/utils\/viewport-capabilities\.ts/);

    const viewportIdx = config.indexOf("'viewport-capabilities'");
    const heroIdx = config.indexOf("'hero-components'");
    expect(viewportIdx).toBeGreaterThan(-1);
    expect(heroIdx).toBeGreaterThan(viewportIdx);
  });

  it('imports viewport helpers from utils in Navigation, not hero islands', () => {
    const nav = readFileSync(join(process.cwd(), 'src/components/Navigation.astro'), 'utf8');
    expect(nav).toMatch(/from ['"].*viewport-capabilities['"]/);
    expect(nav).not.toMatch(/CardStackHero|hero-components/);
  });

  it('does not statically import hero-components or framer-motion in the nav entry chunk', () => {
    const astroDir = join(process.cwd(), 'dist/client/_astro');
    if (!existsSync(astroDir)) {
      return;
    }

    const navChunk = readdirSync(astroDir).find(
      (name) => name.startsWith('Navigation.astro_astro_type_script_index_0_lang.') && name.endsWith('.js'),
    );
    expect(navChunk).toBeTruthy();

    const source = readFileSync(join(astroDir, navChunk!), 'utf8');
    expect(source).not.toMatch(/hero-components\./);
    expect(source).not.toMatch(/framer-motion\./);
    expect(source).toMatch(/viewport-capabilities\./);
  });
});
