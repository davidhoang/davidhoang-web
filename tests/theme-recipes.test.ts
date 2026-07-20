import { describe, expect, it } from 'vitest';
import {
  THEME_RECIPES,
  enforceThemeRecipe,
  formatThemeRecipePrompt,
  getThemeRecipe,
} from '../scripts/lib/theme-recipes.mjs';

describe('theme recipes', () => {
  it('covers every existing hero and grid primitive', () => {
    const heroes = new Set(THEME_RECIPES.flatMap((recipe) => recipe.heroLayouts));
    const grids = new Set(THEME_RECIPES.flatMap((recipe) => recipe.gridStyles));

    expect(heroes).toEqual(new Set(['stacked-fan', 'editorial', 'scattered', 'rolodex', 'cinematic']));
    expect(grids).toEqual(new Set(['standard', 'asymmetric', 'split', 'magazine', 'sidebar']));
  });

  it('formats a mandatory recipe prompt with a locked structure', () => {
    const recipe = getThemeRecipe('gallery');
    if (!recipe) throw new Error('gallery recipe missing');
    const prompt = formatThemeRecipePrompt(recipe, {
      heroLayout: 'cinematic',
      gridStyle: 'split',
    });

    expect(prompt).toContain('Immersive Gallery');
    expect(prompt).toContain('hero.layout MUST be "cinematic"');
    expect(prompt).toContain('layout.gridStyle MUST be "split"');
  });

  it('enforces categorical choices and bounded CSS values', () => {
    const recipe = getThemeRecipe('index');
    if (!recipe) throw new Error('index recipe missing');
    const theme = enforceThemeRecipe({
      name: 'Test Theme',
      typography: { scaleRatio: '2' },
      cards: { style: 'filled', padding: '3rem' },
      layout: {
        borderRadius: '24px',
        containerMaxWidth: '700px',
        sectionSpacing: '6rem',
        contentPadding: '2rem',
        gridStyle: 'magazine',
      },
      hero: { layout: 'cinematic' },
      links: { style: 'highlight' },
      footer: { style: 'gradient' },
      background: { texture: 'gradient' },
      images: { style: 'vivid', hover: 'zoom' },
      colors: { colorScheme: 'triadic', contrastMode: 'low' },
      shader: { type: 'mesh-gradient' },
    }, recipe, { heroLayout: 'rolodex', gridStyle: 'sidebar' });

    expect(theme.artDirection.recipe).toBe('index');
    expect(theme.hero.layout).toBe('rolodex');
    expect(theme.layout.gridStyle).toBe('sidebar');
    expect(recipe.cardStyles).toContain(theme.cards.style);
    expect(recipe.scaleRatios).toContain(theme.typography.scaleRatio);
    expect(theme.layout.borderRadius).toBe('8px');
    expect(theme.layout.containerMaxWidth).toBe('1000px');
    expect(theme.cards.padding).toBe('1.5rem');
  });
});
