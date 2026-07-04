/**
 * Theme diversity scoring and prompt helpers.
 *
 * Compares generated themes against recent history to reduce repetition
 * of hero layouts, grid styles, font pairings, and other categorical fields.
 */

/** @typedef {{ key: string, label: string, weight: number, get: (theme: object) => string | undefined }} DiversityDimension */

/** @type {DiversityDimension[]} */
export const DIVERSITY_DIMENSIONS = [
  { key: 'heroLayout', label: 'Hero', weight: 3, get: (t) => t.hero?.layout },
  { key: 'gridStyle', label: 'Grid', weight: 3, get: (t) => t.layout?.gridStyle },
  {
    key: 'headingFont',
    label: 'Heading font',
    weight: 2.5,
    get: (t) => resolveFontName(t.fonts?.heading),
  },
  {
    key: 'bodyFont',
    label: 'Body font',
    weight: 2,
    get: (t) => resolveFontName(t.fonts?.body),
  },
  { key: 'cardStyle', label: 'Cards', weight: 2, get: (t) => t.cards?.style },
  { key: 'linkStyle', label: 'Links', weight: 1.5, get: (t) => t.links?.style },
  { key: 'footerStyle', label: 'Footer', weight: 1.5, get: (t) => t.footer?.style },
  { key: 'shaderType', label: 'Shader', weight: 1.5, get: (t) => t.shader?.type },
  { key: 'texture', label: 'Texture', weight: 1, get: (t) => t.background?.texture },
  { key: 'imageStyle', label: 'Images', weight: 1, get: (t) => t.images?.style },
  { key: 'imageHover', label: 'Image hover', weight: 1, get: (t) => t.images?.hover },
  { key: 'colorScheme', label: 'Color scheme', weight: 1, get: (t) => t.colors?.colorScheme },
  { key: 'contrastMode', label: 'Contrast mode', weight: 0.5, get: (t) => t.colors?.contrastMode },
];

export const DEFAULT_SIMILARITY_THRESHOLD = 0.55;
export const MAX_DIVERSITY_ATTEMPTS = 3;
/** Minimum weighted dimensions that must differ from yesterday's theme */
export const MIN_CHANGES_FROM_YESTERDAY = 3;

/**
 * @param {string | { name?: string } | undefined} font
 * @returns {string | undefined}
 */
function resolveFontName(font) {
  if (!font) return undefined;
  if (typeof font === 'string') return font;
  return font.name;
}

/**
 * @param {object} theme
 * @returns {Record<string, string>}
 */
export function extractFingerprint(theme) {
  /** @type {Record<string, string>} */
  const fingerprint = {};

  for (const dim of DIVERSITY_DIMENSIONS) {
    const value = dim.get(theme);
    if (value != null && value !== '') {
      fingerprint[dim.key] = String(value);
    }
  }

  return fingerprint;
}

/**
 * Weighted similarity in [0, 1]. Higher = more alike.
 *
 * @param {object} themeA
 * @param {object} themeB
 * @returns {number}
 */
export function computeSimilarity(themeA, themeB) {
  let matchedWeight = 0;
  let totalWeight = 0;

  for (const dim of DIVERSITY_DIMENSIONS) {
    const a = dim.get(themeA);
    const b = dim.get(themeB);
    if (a == null || b == null || a === '' || b === '') continue;

    totalWeight += dim.weight;
    if (String(a) === String(b)) {
      matchedWeight += dim.weight;
    }
  }

  if (totalWeight === 0) return 0;
  return matchedWeight / totalWeight;
}

/**
 * @param {object} newTheme
 * @param {object[]} recentThemes
 * @param {number} [threshold]
 * @returns {{
 *   pass: boolean,
 *   score: number,
 *   closestTheme: object | null,
 *   matches: Array<{ key: string, label: string, value: string }>,
 *   changesFromYesterday: number
 * }}
 */
export function assessDiversity(newTheme, recentThemes, threshold = DEFAULT_SIMILARITY_THRESHOLD) {
  if (!recentThemes.length) {
    return {
      pass: true,
      score: 0,
      closestTheme: null,
      matches: [],
      changesFromYesterday: DIVERSITY_DIMENSIONS.length,
    };
  }

  let maxScore = 0;
  /** @type {object | null} */
  let closestTheme = null;
  /** @type {Array<{ key: string, label: string, value: string }>} */
  let matches = [];

  for (const recent of recentThemes) {
    const score = computeSimilarity(newTheme, recent);
    if (score > maxScore) {
      maxScore = score;
      closestTheme = recent;
      matches = getMatchingDimensions(newTheme, recent);
    }
  }

  const yesterday = recentThemes[0];
  const changesFromYesterday = yesterday
    ? countDimensionChanges(newTheme, yesterday)
    : DIVERSITY_DIMENSIONS.length;

  const pass =
    maxScore < threshold && changesFromYesterday >= MIN_CHANGES_FROM_YESTERDAY;

  return {
    pass,
    score: maxScore,
    closestTheme,
    matches,
    changesFromYesterday,
  };
}

/**
 * @param {object} themeA
 * @param {object} themeB
 * @returns {Array<{ key: string, label: string, value: string }>}
 */
function getMatchingDimensions(themeA, themeB) {
  /** @type {Array<{ key: string, label: string, value: string }>} */
  const matches = [];

  for (const dim of DIVERSITY_DIMENSIONS) {
    const a = dim.get(themeA);
    const b = dim.get(themeB);
    if (a != null && b != null && String(a) === String(b)) {
      matches.push({ key: dim.key, label: dim.label, value: String(a) });
    }
  }

  return matches;
}

/**
 * @param {object} themeA
 * @param {object} themeB
 * @returns {number}
 */
function countDimensionChanges(themeA, themeB) {
  let changes = 0;

  for (const dim of DIVERSITY_DIMENSIONS) {
    const a = dim.get(themeA);
    const b = dim.get(themeB);
    if (a == null || b == null || a === '' || b === '') {
      changes += 1;
      continue;
    }
    if (String(a) !== String(b)) {
      changes += 1;
    }
  }

  return changes;
}

/**
 * @param {object} theme
 * @returns {string}
 */
function formatThemeSummaryLine(theme) {
  const heading = resolveFontName(theme.fonts?.heading) || '?';
  const body = resolveFontName(theme.fonts?.body) || '?';

  return [
    `Hero: ${theme.hero?.layout || '?'}`,
    `Grid: ${theme.layout?.gridStyle || '?'}`,
    `Cards: ${theme.cards?.style || '?'}`,
    `Links: ${theme.links?.style || '?'}`,
    `Fonts: ${heading} + ${body}`,
    `Shader: ${theme.shader?.type || 'none'}`,
    `Footer: ${theme.footer?.style || '?'}`,
    `Images: ${theme.images?.style || '?'}`,
  ].join(' | ');
}

/**
 * Build a prompt section describing recent themes to avoid repeating.
 *
 * @param {object[]} recentThemes
 * @returns {string}
 */
export function formatRecentThemesPromptSection(recentThemes) {
  if (!recentThemes.length) return '';

  const lines = recentThemes.map((theme) => {
    const date = theme.date || 'unknown date';
    const name = theme.name || 'Untitled';
    return `### ${date} — "${name}"\n- ${formatThemeSummaryLine(theme)}`;
  });

  const yesterday = recentThemes[0];
  const avoidHero = yesterday?.hero?.layout;
  const avoidGrid = [...new Set(recentThemes.slice(0, 2).map((t) => t.layout?.gridStyle).filter(Boolean))];
  const recentHeadingFonts = [...new Set(recentThemes.slice(0, 3).map((t) => resolveFontName(t.fonts?.heading)).filter(Boolean))];
  const recentBodyFonts = [...new Set(recentThemes.slice(0, 3).map((t) => resolveFontName(t.fonts?.body)).filter(Boolean))];

  const requirements = [
    '## DIVERSITY REQUIREMENTS',
    'Your theme must feel like a different website from the recent themes above — not a palette swap.',
  ];

  if (avoidHero) {
    requirements.push(`- Do NOT use hero layout "${avoidHero}" (used yesterday).`);
  }
  if (avoidGrid.length) {
    requirements.push(`- Avoid grid style${avoidGrid.length > 1 ? 's' : ''}: ${avoidGrid.map((g) => `"${g}"`).join(', ')}.`);
  }
  if (recentHeadingFonts.length) {
    requirements.push(`- Do NOT reuse heading font${recentHeadingFonts.length > 1 ? 's' : ''}: ${recentHeadingFonts.join(', ')}.`);
  }
  if (recentBodyFonts.length) {
    requirements.push(`- Do NOT reuse body font${recentBodyFonts.length > 1 ? 's' : ''}: ${recentBodyFonts.join(', ')}.`);
  }
  requirements.push(
    `- Change at least ${MIN_CHANGES_FROM_YESTERDAY} major dimensions from yesterday (hero, grid, fonts, cards, links, footer, shader).`,
  );

  return [
    '## RECENT THEMES — AVOID REPEATING THESE PATTERNS',
    '',
    'The last daily themes used these combinations. Pivot away from this cluster:',
    '',
    ...lines,
    '',
    ...requirements,
    '',
    'Also avoid reusing or echoing these theme names:',
    ...recentThemes.map((t) => `- "${t.name}"`),
  ].join('\n');
}

/**
 * Feedback appended on retry when diversity check fails.
 *
 * @param {ReturnType<typeof assessDiversity>} assessment
 * @param {number} [threshold]
 * @returns {string}
 */
export function formatDiversityRetrySection(assessment, threshold = DEFAULT_SIMILARITY_THRESHOLD) {
  const closest = assessment.closestTheme;
  const name = closest?.name || 'a recent theme';
  const scorePct = Math.round(assessment.score * 100);
  const thresholdPct = Math.round(threshold * 100);

  const matchLines = assessment.matches
    .slice(0, 8)
    .map((m) => `- ${m.label}: "${m.value}"`)
    .join('\n');

  return [
    '## DIVERSITY RETRY — YOUR LAST OUTPUT WAS TOO SIMILAR',
    '',
    `Similarity to "${name}": ${scorePct}% (max allowed: ${thresholdPct}%).`,
    `Only ${assessment.changesFromYesterday} dimensions changed from yesterday (need at least ${MIN_CHANGES_FROM_YESTERDAY}).`,
    '',
    'These values matched a recent theme and MUST change:',
    matchLines || '- Too many overlapping choices overall',
    '',
    'Generate a fresh JSON theme that deliberately pivots: different hero layout, grid style, font pairing, and footer treatment.',
  ].join('\n');
}
