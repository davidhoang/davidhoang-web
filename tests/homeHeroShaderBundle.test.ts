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

  it('defers CardStackHero + framer-motion until after LCP and idle', () => {
    const lazy = readFileSync(join(process.cwd(), 'src/components/CardStackHeroLazy.tsx'), 'utf8');
    expect(lazy).toMatch(/afterLcpOrTimeout/);
    expect(lazy).toMatch(/scheduleIdleWork/);
    expect(lazy).toMatch(/import\('\.\/CardStackHero'\)/);
    expect(lazy).not.toMatch(/\blazy\s*\(/);
    expect(lazy).not.toMatch(/\bSuspense\b/);

    const config = readFileSync(join(process.cwd(), 'astro.config.mjs'), 'utf8');
    const heroChunk = config.match(/'hero-components',\s*\[([\s\S]*?)\],/)?.[1] ?? '';
    expect(heroChunk).not.toMatch(/CardStackHeroLazy\.tsx/);
    expect(config).toMatch(/'lcp-defer'/);
  });

  it('keeps framer-motion out of the CardStackHeroLazy island entry chunk', () => {
    const astroDir = join(process.cwd(), 'dist/client/_astro');
    if (!existsSync(astroDir)) return;

    const lazyChunk = readdirSync(astroDir).find(
      (name) => name.startsWith('CardStackHeroLazy.') && name.endsWith('.js'),
    );
    expect(lazyChunk).toBeTruthy();

    const source = readFileSync(join(astroDir, lazyChunk!), 'utf8');
    expect(source).not.toMatch(/from"\.\/framer-motion/);
    expect(source).not.toMatch(/from"\.\/hero-components/);
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
