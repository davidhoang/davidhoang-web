/**
 * Coherent art-direction recipes built entirely from the existing daily-theme
 * primitives. Recipes constrain combinations; they do not introduce new
 * rendering capabilities or viewport-dependent positioning.
 */

export const THEME_RECIPES = [
  {
    id: 'poster',
    name: 'Graphic Poster',
    intent: 'One oversized typographic gesture with sharp, high-contrast supporting surfaces.',
    dominantPrimitive: 'type',
    heroLayouts: ['editorial', 'scattered'],
    gridStyles: ['asymmetric', 'split'],
    cardStyles: ['flat', 'outlined'],
    linkStyles: ['bracket', 'underline', 'color-only'],
    footerStyles: ['brutalist', 'split'],
    textures: ['none', 'grid'],
    imageStyles: ['grayscale', 'duotone'],
    imageHovers: ['colorize', 'none'],
    colorSchemes: ['complementary', 'split-complementary'],
    contrastModes: ['high', 'standard'],
    scaleRatios: ['1.618', '2'],
    shaderTypes: ['none', 'dot-grid'],
    bounds: {
      borderRadius: [0, 4],
      containerMaxWidth: [1100, 1200],
      sectionSpacing: [3, 5],
      contentPadding: [1.25, 1.5],
      cardPadding: [1, 1.5],
    },
  },
  {
    id: 'journal',
    name: 'Editorial Journal',
    intent: 'A paced reading experience with print hierarchy, measured density, and quiet material texture.',
    dominantPrimitive: 'type',
    heroLayouts: ['stacked-fan', 'editorial'],
    gridStyles: ['magazine'],
    cardStyles: ['flat', 'elevated'],
    linkStyles: ['underline', 'animated-underline'],
    footerStyles: ['editorial', 'classic'],
    textures: ['grain', 'none'],
    imageStyles: ['muted', 'grayscale'],
    imageHovers: ['colorize', 'none'],
    colorSchemes: ['analogous', 'split-complementary'],
    contrastModes: ['standard', 'low'],
    scaleRatios: ['1.333', '1.414'],
    shaderTypes: ['none', 'grain'],
    bounds: {
      borderRadius: [4, 12],
      containerMaxWidth: [1100, 1200],
      sectionSpacing: [3, 5],
      contentPadding: [1.5, 2],
      cardPadding: [1.25, 1.75],
    },
  },
  {
    id: 'gallery',
    name: 'Immersive Gallery',
    intent: 'Images lead the composition while generous opaque surfaces create depth and focus.',
    dominantPrimitive: 'image',
    heroLayouts: ['cinematic', 'rolodex'],
    gridStyles: ['split', 'asymmetric'],
    cardStyles: ['filled', 'elevated'],
    linkStyles: ['color-only', 'highlight'],
    footerStyles: ['boxed', 'gradient'],
    textures: ['none', 'gradient'],
    imageStyles: ['vivid', 'duotone'],
    imageHovers: ['zoom', 'lift', 'glow'],
    colorSchemes: ['analogous', 'triadic'],
    contrastModes: ['standard', 'high'],
    scaleRatios: ['1.414', '1.618'],
    shaderTypes: ['none', 'mesh-gradient'],
    bounds: {
      borderRadius: [16, 24],
      containerMaxWidth: [1100, 1200],
      sectionSpacing: [4, 6],
      contentPadding: [1.5, 2],
      cardPadding: [1.5, 2],
    },
  },
  {
    id: 'index',
    name: 'System Index',
    intent: 'A compact information rail with visible structure, disciplined rules, and technical detail.',
    dominantPrimitive: 'grid',
    heroLayouts: ['rolodex', 'stacked-fan'],
    gridStyles: ['sidebar'],
    cardStyles: ['outlined', 'flat'],
    linkStyles: ['bracket', 'color-only'],
    footerStyles: ['retro', 'minimal'],
    textures: ['grid', 'dots', 'none'],
    imageStyles: ['muted', 'grayscale'],
    imageHovers: ['none', 'colorize'],
    colorSchemes: ['complementary', 'analogous'],
    contrastModes: ['high', 'standard'],
    scaleRatios: ['1.2', '1.333'],
    shaderTypes: ['none', 'dot-grid'],
    bounds: {
      borderRadius: [0, 8],
      containerMaxWidth: [1000, 1200],
      sectionSpacing: [2, 4],
      contentPadding: [1.25, 1.5],
      cardPadding: [1, 1.5],
    },
  },
  {
    id: 'playground',
    name: 'Color Playground',
    intent: 'A deliberately energetic composition with irregular rhythm and one controlled surprise.',
    dominantPrimitive: 'surface',
    heroLayouts: ['scattered', 'cinematic'],
    gridStyles: ['asymmetric', 'magazine', 'standard'],
    cardStyles: ['filled', 'outlined'],
    linkStyles: ['highlight', 'animated-underline'],
    footerStyles: ['marquee', 'retro', 'boxed'],
    textures: ['none', 'dots', 'gradient'],
    imageStyles: ['vivid', 'duotone'],
    imageHovers: ['zoom', 'glow'],
    colorSchemes: ['triadic', 'split-complementary'],
    contrastModes: ['high', 'standard'],
    scaleRatios: ['1.414', '1.618'],
    shaderTypes: ['none', 'simplex'],
    bounds: {
      borderRadius: [8, 20],
      containerMaxWidth: [1100, 1200],
      sectionSpacing: [3, 5],
      contentPadding: [1.25, 2],
      cardPadding: [1.25, 2],
    },
  },
];

export function listThemeRecipes() {
  return THEME_RECIPES.map(({ id, name }) => ({ id, name }));
}

export function getThemeRecipe(id) {
  if (!id) return null;
  const normalized = String(id).trim().toLowerCase();
  return THEME_RECIPES.find((recipe) => recipe.id === normalized) || null;
}

export function formatThemeRecipePrompt(recipe, schedule = {}) {
  if (!recipe) return '';

  const scheduledStructure = schedule.heroLayout && schedule.gridStyle
    ? [
        '',
        'Scheduled structure (mandatory):',
        `- hero.layout MUST be "${schedule.heroLayout}"`,
        `- layout.gridStyle MUST be "${schedule.gridStyle}"`,
      ]
    : [];

  const range = (key, unit) => `${recipe.bounds[key][0]}${unit}–${recipe.bounds[key][1]}${unit}`;

  return [
    '## ART-DIRECTION RECIPE — MANDATORY',
    `Recipe: ${recipe.name} (${recipe.id})`,
    `Intent: ${recipe.intent}`,
    `Dominant primitive: ${recipe.dominantPrimitive}`,
    '',
    'Make one dominant visual gesture and let every other choice support it. Do not mix in an unrelated aesthetic.',
    ...scheduledStructure,
    '',
    `- cards.style: ${recipe.cardStyles.map(quote).join(' | ')}`,
    `- links.style: ${recipe.linkStyles.map(quote).join(' | ')}`,
    `- footer.style: ${recipe.footerStyles.map(quote).join(' | ')}`,
    `- background.texture: ${recipe.textures.map(quote).join(' | ')}`,
    `- images.style: ${recipe.imageStyles.map(quote).join(' | ')}`,
    `- images.hover: ${recipe.imageHovers.map(quote).join(' | ')}`,
    `- colors.colorScheme: ${recipe.colorSchemes.map(quote).join(' | ')}`,
    `- colors.contrastMode: ${recipe.contrastModes.map(quote).join(' | ')}`,
    `- typography.scaleRatio: ${recipe.scaleRatios.map(quote).join(' | ')}`,
    `- shader.type: ${recipe.shaderTypes.map(quote).join(' | ')}`,
    '',
    'Recipe bounds:',
    `- layout.borderRadius: ${range('borderRadius', 'px')}`,
    `- layout.containerMaxWidth: ${range('containerMaxWidth', 'px')}`,
    `- layout.sectionSpacing: ${range('sectionSpacing', 'rem')}`,
    `- layout.contentPadding: ${range('contentPadding', 'rem')}`,
    `- cards.padding: ${range('cardPadding', 'rem')}`,
  ].join('\n');
}

export function enforceThemeRecipe(theme, recipe, schedule = {}) {
  if (!recipe) return theme;

  theme.typography ||= {};
  theme.cards ||= {};
  theme.layout ||= {};
  theme.hero ||= {};
  theme.links ||= {};
  theme.footer ||= {};
  theme.background ||= {};
  theme.images ||= {};
  theme.colors ||= {};
  theme.shader ||= {};

  const seed = `${theme.name || ''}|${theme.description || ''}|${recipe.id}`;
  theme.hero.layout = schedule.heroLayout || allowedValue(theme.hero.layout, recipe.heroLayouts, seed, 'hero');
  theme.layout.gridStyle = schedule.gridStyle || allowedValue(theme.layout.gridStyle, recipe.gridStyles, seed, 'grid');
  theme.cards.style = allowedValue(theme.cards.style, recipe.cardStyles, seed, 'cards');
  theme.links.style = allowedValue(theme.links.style, recipe.linkStyles, seed, 'links');
  theme.footer.style = allowedValue(theme.footer.style, recipe.footerStyles, seed, 'footer');
  theme.background.texture = allowedValue(theme.background.texture, recipe.textures, seed, 'texture');
  theme.images.style = allowedValue(theme.images.style, recipe.imageStyles, seed, 'images');
  theme.images.hover = allowedValue(theme.images.hover, recipe.imageHovers, seed, 'image-hover');
  theme.colors.colorScheme = allowedValue(theme.colors.colorScheme, recipe.colorSchemes, seed, 'color-scheme');
  theme.colors.contrastMode = allowedValue(theme.colors.contrastMode, recipe.contrastModes, seed, 'contrast');
  theme.typography.scaleRatio = allowedValue(String(theme.typography.scaleRatio || ''), recipe.scaleRatios, seed, 'scale');
  theme.typography.fontVariationSettings = 'normal';
  theme.shader.type = allowedValue(theme.shader.type, recipe.shaderTypes, seed, 'shader');

  theme.layout.borderRadius = clampCssValue(
    theme.layout.borderRadius,
    recipe.bounds.borderRadius,
    'px',
  );
  theme.layout.containerMaxWidth = clampCssValue(
    theme.layout.containerMaxWidth,
    recipe.bounds.containerMaxWidth,
    'px',
  );
  theme.layout.sectionSpacing = clampCssValue(
    theme.layout.sectionSpacing,
    recipe.bounds.sectionSpacing,
    'rem',
  );
  theme.layout.contentPadding = clampCssValue(
    theme.layout.contentPadding,
    recipe.bounds.contentPadding,
    'rem',
  );
  theme.cards.padding = clampCssValue(
    theme.cards.padding,
    recipe.bounds.cardPadding,
    'rem',
  );

  theme.artDirection = {
    recipe: recipe.id,
    name: recipe.name,
    dominantPrimitive: recipe.dominantPrimitive,
  };

  return theme;
}

function allowedValue(value, allowed, seed, dimension) {
  if (allowed.includes(value)) return value;
  return allowed[stableHash(`${seed}|${dimension}`) % allowed.length];
}

function clampCssValue(raw, [min, max], unit) {
  const parsed = Number.parseFloat(raw);
  const fallback = (min + max) / 2;
  const value = Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
  return `${Number(value.toFixed(3))}${unit}`;
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function quote(value) {
  return `"${value}"`;
}
