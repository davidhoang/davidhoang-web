/**
 * Build narrowed Google Fonts CSS2 URLs for fonts referenced in daily-themes.json.
 * Logic mirrors src/utils/theme-font-stylesheet.ts (keep in sync when that changes).
 */

/** @typedef {{ name?: string; url?: string | null }} ThemeFontEntry */
/** @typedef {{ headingWeight?: unknown; bodyWeight?: unknown } | null | undefined} ThemeTypography */

/** @type {Set<string>} */
const SELF_HOSTED_ALREADY = new Set([
  'Inter',
  'Space Grotesk',
  'Cormorant Garamond',
  'Source Serif 4',
]);

const BODY_FONT_UI_WEIGHTS = [500, 600, 700];
const HEADING_FONT_UI_WEIGHTS = [700];

function parseWeight(value, fallback) {
  if (value == null || value === '') return fallback;
  const match = String(value).trim().match(/\b([1-9]\d{2})\b/);
  const n = match ? parseInt(match[1], 10) : parseInt(String(value), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(900, Math.max(100, Math.round(n / 100) * 100));
}

/**
 * @param {'heading' | 'body'} role
 * @param {ThemeTypography} typography
 */
export function themeFontWeightsForRole(role, typography) {
  const heading = parseWeight(typography?.headingWeight, 600);
  const body = parseWeight(typography?.bodyWeight, 400);
  /** @type {Set<number>} */
  const weights = new Set();

  if (role === 'heading') {
    weights.add(heading);
    for (const w of HEADING_FONT_UI_WEIGHTS) weights.add(w);
  } else {
    weights.add(body);
    for (const w of BODY_FONT_UI_WEIGHTS) weights.add(w);
  }

  return [...weights].sort((a, b) => a - b);
}

function parseDiscreteFontWeights(wghtSpec) {
  if (wghtSpec.includes('..')) return null;
  const weights = wghtSpec
    .split(';')
    .map((part) => parseInt(part.trim(), 10))
    .filter((n) => !Number.isNaN(n));
  return weights.length > 0 ? weights : null;
}

function discreteWeightsForRequest(requiredWeights, catalogWeights) {
  const sortedRequired = [...new Set(requiredWeights)].sort((a, b) => a - b);
  const available = new Set(catalogWeights);
  const matched = sortedRequired.filter((w) => available.has(w));
  if (matched.length > 0) return matched;
  return [...catalogWeights].sort((a, b) => a - b);
}

function formatWghtAxisValue(min, max) {
  if (min === max) return String(min);
  return `${min}..${max}`;
}

function narrowFamilyAxis(familyParam, requiredWeights) {
  const colonIndex = familyParam.indexOf(':');
  if (colonIndex === -1) return familyParam;

  const name = familyParam.slice(0, colonIndex);
  const axisPart = familyParam.slice(colonIndex + 1);
  if (!axisPart.includes('wght@')) return familyParam;

  const sorted = [...new Set(requiredWeights)].sort((a, b) => a - b);
  if (sorted.length === 0) return familyParam;

  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  if (axisPart.includes(',')) {
    const atIndex = axisPart.indexOf('@');
    const axes = axisPart.slice(0, atIndex);
    const values = axisPart.slice(atIndex + 1);
    const axisNames = axes.split(',');
    const valueParts = values.split(',');
    const wghtIndex = axisNames.indexOf('wght');
    if (wghtIndex === -1) return familyParam;

    const wghtValue = valueParts[wghtIndex] ?? '';
    if (wghtValue.includes('..')) {
      valueParts[wghtIndex] = formatWghtAxisValue(min, max);
    } else {
      const catalog = parseDiscreteFontWeights(wghtValue);
      const picked = catalog ? discreteWeightsForRequest(sorted, catalog) : sorted;
      valueParts[wghtIndex] = picked.join(';');
    }
    return `${name}:${axes}@${valueParts.join(',')}`;
  }

  const wghtSpec = axisPart.replace(/^wght@/, '');
  if (wghtSpec.includes('..')) {
    return `${name}:wght@${formatWghtAxisValue(min, max)}`;
  }

  const catalog = parseDiscreteFontWeights(wghtSpec);
  const picked = catalog ? discreteWeightsForRequest(sorted, catalog) : sorted;
  return `${name}:wght@${picked.join(';')}`;
}

export function narrowGoogleFontStylesheetUrl(url, requiredWeights) {
  if (!url.includes('fonts.googleapis.com/css2')) return url;
  if (requiredWeights.length === 0) return url;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const family = parsed.searchParams.get('family');
  if (!family) return url;

  parsed.searchParams.set('family', narrowFamilyAxis(family, requiredWeights));
  return parsed.toString();
}

/**
 * @param {ThemeFontEntry | null | undefined} font
 * @param {'heading' | 'body'} role
 * @param {ThemeTypography} typography
 */
export function themeFontStylesheetUrl(font, role, typography) {
  if (!font?.url) return undefined;
  const weights = themeFontWeightsForRole(role, typography);
  return narrowGoogleFontStylesheetUrl(font.url, weights);
}

/**
 * Unique narrowed stylesheet URLs for every theme in daily-themes.json that still
 * points at Google Fonts (excluding families already self-hosted in-repo).
 *
 * @param {unknown} themesData - parsed daily-themes.json
 * @returns {Map<string, { displayName: string }>} href -> first font name using it
 */
export function collectNarrowedGoogleStylesheetUrls(themesData) {
  /** @type {Map<string, { displayName: string }>} */
  const urls = new Map();
  const themes = themesData?.themes;
  if (!Array.isArray(themes)) return urls;

  for (const theme of themes) {
    const typography = theme?.typography;
    for (const role of /** @type {const} */ (['heading', 'body'])) {
      const font = theme?.fonts?.[role];
      if (!font?.name || !font?.url) continue;
      if (SELF_HOSTED_ALREADY.has(font.name)) continue;
      const href = themeFontStylesheetUrl(font, role, typography);
      if (!href || !href.includes('fonts.googleapis.com/css2')) continue;
      if (!urls.has(href)) {
        urls.set(href, { displayName: font.name });
      }
    }
  }

  return urls;
}
