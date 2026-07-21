import { describe, expect, it } from 'vitest';
import {
  GRID_COOLDOWN,
  HERO_COOLDOWN,
  RECIPE_COOLDOWN,
  scheduleThemeStructure,
} from '../scripts/lib/theme-scheduler.mjs';

const recentThemes = [
  theme('playground', 'editorial', 'asymmetric'),
  theme('gallery', 'scattered', 'standard'),
  theme('journal', 'stacked-fan', 'magazine'),
  theme('poster', 'cinematic', 'split'),
];

describe('theme structure scheduler', () => {
  it('honors hero, grid, and recipe cooldowns when a strict candidate exists', () => {
    const result = scheduleThemeStructure(recentThemes, { date: '2026-07-19' });

    expect(recentThemes.slice(0, HERO_COOLDOWN).map((item) => item.hero.layout))
      .not.toContain(result.heroLayout);
    expect(recentThemes.slice(0, GRID_COOLDOWN).map((item) => item.layout.gridStyle))
      .not.toContain(result.gridStyle);
    expect(recentThemes.slice(0, RECIPE_COOLDOWN).map((item) => item.artDirection.recipe))
      .not.toContain(result.recipe.id);
    expect(result.relaxation).toBeNull();
  });

  it('is deterministic for the same date and history', () => {
    const first = scheduleThemeStructure(recentThemes, { date: '2026-07-19' });
    const second = scheduleThemeStructure(recentThemes, { date: '2026-07-19' });

    expect(second.recipe.id).toBe(first.recipe.id);
    expect(second.heroLayout).toBe(first.heroLayout);
    expect(second.gridStyle).toBe(first.gridStyle);
  });

  it('supports an explicitly requested recipe', () => {
    const result = scheduleThemeStructure([], {
      date: '2026-07-19',
      recipeName: 'journal',
    });

    expect(result.recipe.id).toBe('journal');
    expect(result.recipe.heroLayouts).toContain(result.heroLayout);
    expect(result.recipe.gridStyles).toContain(result.gridStyle);
  });

  it('rejects an unknown explicit recipe', () => {
    expect(() => scheduleThemeStructure([], { recipeName: 'missing' }))
      .toThrow('Unknown theme recipe "missing"');
  });

  it('reports when an explicit recipe exhausts its structural cooldowns', () => {
    const blockedJournalHistory = [
      theme('journal', 'stacked-fan', 'magazine'),
      theme('poster', 'editorial', 'split'),
    ];
    const result = scheduleThemeStructure(blockedJournalHistory, {
      date: '2026-07-19',
      recipeName: 'journal',
    });

    expect(result.relaxation).toBe('cooldown-exhausted');
    expect(result.recipe.id).toBe('journal');
    expect(result.recipe.heroLayouts).toContain(result.heroLayout);
    expect(result.gridStyle).toBe('magazine');
  });
});

function theme(recipe: string, hero: string, grid: string) {
  return {
    artDirection: { recipe },
    hero: { layout: hero },
    layout: { gridStyle: grid },
  };
}
