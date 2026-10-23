import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Home hero card shader bundle (PCD-143)', () => {
  it('defers HeroCardShaderPattern via idle + in-view import, not React.lazy', () => {
    const deferred = readFileSync(
      join(process.cwd(), 'src/components/hero/HeroCardShaderDeferred.tsx'),
      'utf8',
    );
    expect(deferred).toMatch(/shouldLoadHeroCardShaders/);
    expect(deferred).toMatch(/IntersectionObserver/);
    expect(deferred).toMatch(/requestIdleCallback|scheduleIdleWork/);
    expect(deferred).toMatch(/largest-contentful-paint|afterLcpOrTimeout/);
    expect(deferred).toMatch(/import\('\.\/HeroCardShaderPattern'\)/);
    expect(deferred).not.toMatch(/\blazy\s*\(/);

    const cardBase = readFileSync(join(process.cwd(), 'src/components/hero/CardBase.tsx'), 'utf8');
    expect(cardBase).toMatch(/HeroCardShaderDeferred/);
    expect(cardBase).not.toMatch(/HeroCardShaderPattern/);
  });

  it('does not modulepreload paper-shaders or HeroCardShaderPattern on the homepage', () => {
    const htmlPath = join(process.cwd(), 'dist/client/index.html');
    if (!existsSync(htmlPath)) return;

    const html = readFileSync(htmlPath, 'utf8');
    const hrefs = [...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map((m) => m[1]);
    const shaderPreloads = hrefs.filter(
      (href) => href.includes('paper-shaders') || href.includes('HeroCardShaderPattern'),
    );
    expect(shaderPreloads).toEqual([]);
  });

  it('keeps paper-shaders out of the homepage island entry static graph', () => {
    const astroDir = join(process.cwd(), 'dist/client/_astro');
    if (!existsSync(astroDir)) return;

    const indexIsland = readdirSync(astroDir).find(
      (name) => name.startsWith('index.astro_astro_type_script_index_0_lang.') && name.endsWith('.js'),
    );
    expect(indexIsland).toBeTruthy();

    const source = readFileSync(join(astroDir, indexIsland!), 'utf8');
    expect(source).not.toMatch(/paper-shaders\./);
    expect(source).not.toMatch(/HeroCardShaderPattern/);
  });
});
