import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import themesData from '../src/data/daily-themes.json';
import { resolveDailyTheme } from '../src/utils/dailyThemes';
import { shaderTypeNeedsBackground } from '../src/utils/shaderBackgroundMount';
import { heroShaderTypeNeedsOverlay } from '../src/utils/heroShaderOverlay';

describe('shaderBackgroundMount', () => {
  it('treats none and empty shader types as no background mount', () => {
    expect(shaderTypeNeedsBackground('none')).toBe(false);
    expect(shaderTypeNeedsBackground(null)).toBe(false);
    expect(shaderTypeNeedsBackground('mesh-gradient')).toBe(true);
  });
});

describe('heroShaderOverlay', () => {
  it('treats only waves, paper, and grain as hero overlay shaders', () => {
    expect(heroShaderTypeNeedsOverlay('waves')).toBe(true);
    expect(heroShaderTypeNeedsOverlay('paper')).toBe(true);
    expect(heroShaderTypeNeedsOverlay('grain')).toBe(true);
    expect(heroShaderTypeNeedsOverlay('none')).toBe(false);
    expect(heroShaderTypeNeedsOverlay('mesh-gradient')).toBe(false);
    expect(heroShaderTypeNeedsOverlay(null)).toBe(false);
  });
});

describe('Shader background bundle', () => {
  it('omits the ShaderBackground astro island on writing pages when SSR shader is none', () => {
    const themes = (themesData as { themes: unknown[]; currentDate?: string }).themes;
    const currentDate = (themesData as { currentDate?: string }).currentDate;
    const todayTheme = resolveDailyTheme(themes as never[], currentDate ?? '');
    const shaderType = (todayTheme as { shader?: { type?: string } } | undefined)?.shader?.type ?? 'none';

    if (shaderTypeNeedsBackground(shaderType)) return;

    const htmlPath = join(
      process.cwd(),
      'dist/client/writing/optimizing-for-agents/index.html',
    );
    if (!existsSync(htmlPath)) return;

    const html = readFileSync(htmlPath, 'utf8');
    expect(html).not.toMatch(/component-url="\/_astro\/ShaderBackground\./);
  });
});

describe('Hero image shader bundle', () => {
  it('omits the HeroImageShader astro island on PageHeader pages (SSR mount shell only)', () => {
    const htmlPath = join(process.cwd(), 'dist/client/about/index.html');
    if (!existsSync(htmlPath)) return;

    const html = readFileSync(htmlPath, 'utf8');
    expect(html).toMatch(/data-hero-shader-mount/);
    expect(html).not.toMatch(/component-url="\/_astro\/HeroImageShader\./);
  });
});
