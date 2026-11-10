import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import themesData from '../src/data/daily-themes.json';
import { resolveDailyTheme } from '../src/utils/dailyThemes';
import { shaderTypeNeedsBackground } from '../src/utils/shaderBackgroundMount';

describe('shaderBackgroundMount', () => {
  it('treats none and empty shader types as no background mount', () => {
    expect(shaderTypeNeedsBackground('none')).toBe(false);
    expect(shaderTypeNeedsBackground(null)).toBe(false);
    expect(shaderTypeNeedsBackground('mesh-gradient')).toBe(true);
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
