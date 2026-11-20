import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * When data-shader is "none", shader mounts must not static-import react-vendor
 * (Vite preload helper used to live in career-components).
 */
describe('shader-mount bundle (poteto-mode perf)', () => {
  it('defines shader-mount manual chunk ahead of utils', () => {
    const config = readFileSync(join(process.cwd(), 'astro.config.mjs'), 'utf8');
    expect(config).toMatch(/['"]shader-mount['"]/);
    const shaderIdx = config.indexOf("'shader-mount'");
    const utilsIdx = config.indexOf("['utils'");
    expect(shaderIdx).toBeGreaterThan(-1);
    expect(utilsIdx).toBeGreaterThan(shaderIdx);
  });

  it('layout shader init script does not static-import react-vendor on notes', () => {
    const astroDir = join(process.cwd(), 'dist/client/_astro');
    if (!existsSync(astroDir)) return;

    const layoutShader = readdirSync(astroDir).find(
      (name) =>
        name.startsWith('MainLayout.astro_astro_type_script_index_2_lang.') && name.endsWith('.js'),
    );
    expect(layoutShader).toBeTruthy();

    const source = readFileSync(join(astroDir, layoutShader!), 'utf8');
    expect(source).not.toMatch(/react-vendor\./);
    expect(source).not.toMatch(/career-components\./);
    expect(source).toMatch(/shader-bootstrap\./);
    expect(source).not.toMatch(/shader-mount\./);

    const bootstrap = readdirSync(astroDir).find(
      (name) => name.startsWith('shader-bootstrap.') && name.endsWith('.js'),
    );
    expect(bootstrap).toBeTruthy();
    const bootstrapSource = readFileSync(join(astroDir, bootstrap!), 'utf8');
    expect(bootstrapSource).not.toMatch(/from"\.\/career-components/);
    expect(bootstrapSource).not.toMatch(/from"\.\/react-vendor/);
  });

  it('keeps Navigation nav-FX script off career-components preload', () => {
    const astroDir = join(process.cwd(), 'dist/client/_astro');
    if (!existsSync(astroDir)) return;

    const navChunk = readdirSync(astroDir).find(
      (name) => name.startsWith('Navigation.astro_astro_type_script_index_0_lang.') && name.endsWith('.js'),
    );
    expect(navChunk).toBeTruthy();
    const source = readFileSync(join(astroDir, navChunk!), 'utf8');
    expect(source).not.toMatch(/from"\.\/career-components/);
  });
});