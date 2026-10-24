import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('TextureCard shader bundle (PCD-143)', () => {
  it('defers TextureCardShader via hover/focus import, not React.lazy', () => {
    const deferred = readFileSync(
      join(process.cwd(), 'src/components/TextureCardShaderDeferred.tsx'),
      'utf8',
    );
    expect(deferred).toMatch(/shouldLoadTextureCardShaders/);
    expect(deferred).toMatch(/pointerenter/);
    expect(deferred).toMatch(/focusin/);
    expect(deferred).toMatch(/import\('\.\/TextureCardShader'\)/);
    expect(deferred).not.toMatch(/\blazy\s*\(/);

    const textureCard = readFileSync(join(process.cwd(), 'src/components/TextureCard.astro'), 'utf8');
    expect(textureCard).toMatch(/TextureCardShaderDeferred/);
    expect(textureCard).not.toMatch(/TextureCardShader client:/);
  });

  it('does not modulepreload paper-shaders or TextureCardShader on design-resources', () => {
    const htmlPath = join(process.cwd(), 'dist/client/design-resources/index.html');
    if (!existsSync(htmlPath)) return;

    const html = readFileSync(htmlPath, 'utf8');
    const hrefs = [...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map((m) => m[1]);
    const shaderPreloads = hrefs.filter(
      (href) =>
        href.includes('paper-shaders') ||
        href.includes('TextureCardShader') ||
        href.includes('TextureCardDitheringLayer'),
    );
    expect(shaderPreloads).toEqual([]);
  });

  it('keeps paper-shaders out of the TextureCard deferred island static graph', () => {
    const astroDir = join(process.cwd(), 'dist/client/_astro');
    if (!existsSync(astroDir)) return;

    const deferredIsland = readdirSync(astroDir).find(
      (name) => name.startsWith('TextureCardShaderDeferred.') && name.endsWith('.js'),
    );
    expect(deferredIsland).toBeTruthy();

    const source = readFileSync(join(astroDir, deferredIsland!), 'utf8');
    expect(source).not.toMatch(/paper-shaders\./);
    expect(source).not.toMatch(/TextureCardDitheringLayer/);
    expect(source).toMatch(/TextureCardShader/);
  });
});
