import { THEME_RECIPES, getThemeRecipe } from './theme-recipes.mjs';

export const HERO_COOLDOWN = 4;
export const GRID_COOLDOWN = 3;
export const RECIPE_COOLDOWN = THEME_RECIPES.length - 1;

/**
 * Pick a deterministic recipe + structural template. Strict cooldowns are
 * applied whenever the recipe vocabulary makes them possible. If an explicit
 * recipe exhausts its own choices, the least-recent option is used and the
 * relaxation is reported for logs.
 */
export function scheduleThemeStructure(recentThemes, options = {}) {
  const explicitRecipe = getThemeRecipe(options.recipeName);
  if (options.recipeName && !explicitRecipe) {
    throw new Error(`Unknown theme recipe "${options.recipeName}"`);
  }

  const recipes = explicitRecipe ? [explicitRecipe] : THEME_RECIPES;
  const date = options.date || new Date().toISOString().split('T')[0];
  const allCandidates = recipes.flatMap((recipe) =>
    recipe.heroLayouts.flatMap((heroLayout) =>
      recipe.gridStyles.map((gridStyle) => ({ recipe, heroLayout, gridStyle })),
    ),
  );

  const recentHeroes = recentThemes.slice(0, HERO_COOLDOWN).map((theme) => theme.hero?.layout).filter(Boolean);
  const recentGrids = recentThemes.slice(0, GRID_COOLDOWN).map((theme) => theme.layout?.gridStyle).filter(Boolean);
  const recentRecipes = recentThemes
    .map((theme) => theme.artDirection?.recipe)
    .filter(Boolean)
    .slice(0, RECIPE_COOLDOWN);

  const strictCandidates = allCandidates.filter((candidate) =>
    !recentHeroes.includes(candidate.heroLayout) &&
    !recentGrids.includes(candidate.gridStyle) &&
    (explicitRecipe || !recentRecipes.includes(candidate.recipe.id)),
  );

  const pool = strictCandidates.length > 0 ? strictCandidates : allCandidates;
  const relaxation = strictCandidates.length > 0 ? null : 'cooldown-exhausted';
  const usage = buildUsage(recentThemes);

  const ranked = pool
    .map((candidate) => ({
      ...candidate,
      score: candidateScore(candidate, usage, recentHeroes, recentGrids, recentRecipes),
      tieBreak: stableHash(`${date}|${candidate.recipe.id}|${candidate.heroLayout}|${candidate.gridStyle}`),
    }))
    .sort((a, b) => a.score - b.score || a.tieBreak - b.tieBreak);

  const selected = ranked[0];
  return {
    recipe: selected.recipe,
    heroLayout: selected.heroLayout,
    gridStyle: selected.gridStyle,
    relaxation,
    cooldowns: {
      hero: HERO_COOLDOWN,
      grid: GRID_COOLDOWN,
      recipe: RECIPE_COOLDOWN,
    },
  };
}

function buildUsage(recentThemes) {
  const counts = { recipes: {}, heroes: {}, grids: {} };
  for (const theme of recentThemes) {
    increment(counts.recipes, theme.artDirection?.recipe);
    increment(counts.heroes, theme.hero?.layout);
    increment(counts.grids, theme.layout?.gridStyle);
  }
  return counts;
}

function candidateScore(candidate, usage, recentHeroes, recentGrids, recentRecipes) {
  const recipeRecency = recencyPenalty(candidate.recipe.id, recentRecipes, RECIPE_COOLDOWN);
  const heroRecency = recencyPenalty(candidate.heroLayout, recentHeroes, HERO_COOLDOWN);
  const gridRecency = recencyPenalty(candidate.gridStyle, recentGrids, GRID_COOLDOWN);

  return (
    recipeRecency * 1000 +
    heroRecency * 500 +
    gridRecency * 500 +
    (usage.recipes[candidate.recipe.id] || 0) * 20 +
    (usage.heroes[candidate.heroLayout] || 0) * 10 +
    (usage.grids[candidate.gridStyle] || 0) * 10
  );
}

function recencyPenalty(value, recentValues, cooldown) {
  const index = recentValues.indexOf(value);
  return index === -1 ? 0 : cooldown - index;
}

function increment(record, value) {
  if (!value) return;
  record[value] = (record[value] || 0) + 1;
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
