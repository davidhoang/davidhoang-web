/**
 * Narrow Google Fonts CSS2 URLs to weights the site actually uses for a theme
 * role, instead of the full catalog range stored in daily-themes.json.
 */

export type ThemeFontRole = 'heading' | 'body';

/** Weights used on --font-body outside the theme body token (nav, prose, etc.). */
const BODY_FONT_UI_WEIGHTS = [500, 600, 700] as const;

/** Weights used on --font-heading outside the theme heading token (footer titles). */
const HEADING_FONT_UI_WEIGHTS = [700] as const;

function parseWeight(value: unknown, fallback: number): number {
  if (value == null || value === '') return fallback;
  const match = String(value).trim().match(/\b([1-9]\d{2})\b/);
  const n = match ? parseInt(match[1], 10) : parseInt(String(value), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(900, Math.max(100, Math.round(n / 100) * 100));
}

/** Weights that must be reachable for a theme font role without changing layout. */
export function themeFontWeightsForRole(
  role: ThemeFontRole,
  typography?: { headingWeight?: unknown; bodyWeight?: unknown } | null,
): number[] {
  const heading = parseWeight(typography?.headingWeight, 600);
  const body = parseWeight(typography?.bodyWeight, 400);
  const weights = new Set<number>();

  if (role === 'heading') {
    weights.add(heading);
    for (const w of HEADING_FONT_UI_WEIGHTS) weights.add(w);
  } else {
    weights.add(body);
    for (const w of BODY_FONT_UI_WEIGHTS) weights.add(w);
  }

  return [...weights].sort((a, b) => a - b);
}

function parseDiscreteFontWeights(wghtSpec: string): number[] | null {
  if (wghtSpec.includes('..')) return null;
  const weights = wghtSpec
    .split(';')
    .map((part) => parseInt(part.trim(), 10))
    .filter((n) => !Number.isNaN(n));
  return weights.length > 0 ? weights : null;
}

/** Pick required weights that exist in the catalog; if none match, keep the catalog weights. */
function discreteWeightsForRequest(requiredWeights: number[], catalogWeights: number[]): number[] {
  const sortedRequired = [...new Set(requiredWeights)].sort((a, b) => a - b);
  const available = new Set(catalogWeights);
  const matched = sortedRequired.filter((w) => available.has(w));
  if (matched.length > 0) return matched;
  return [...catalogWeights].sort((a, b) => a - b);
}

function narrowFamilyAxis(familyParam: string, requiredWeights: number[]): string {
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
      valueParts[wghtIndex] = `${min}..${max}`;
    } else {
      const catalog = parseDiscreteFontWeights(wghtValue);
      const picked = catalog ? discreteWeightsForRequest(sorted, catalog) : sorted;
      valueParts[wghtIndex] = picked.join(';');
    }
    return `${name}:${axes}@${valueParts.join(',')}`;
  }

  const wghtSpec = axisPart.replace(/^wght@/, '');
  if (wghtSpec.includes('..')) {
    return `${name}:wght@${min}..${max}`;
  }

  const catalog = parseDiscreteFontWeights(wghtSpec);
  const picked = catalog ? discreteWeightsForRequest(sorted, catalog) : sorted;
  return `${name}:wght@${picked.join(';')}`;
}

/**
 * Returns a Google Fonts stylesheet URL limited to {@link requiredWeights}.
 * Non-Google URLs are returned unchanged.
 */
export function narrowGoogleFontStylesheetUrl(url: string, requiredWeights: number[]): string {
  if (!url.includes('fonts.googleapis.com/css2')) return url;
  if (requiredWeights.length === 0) return url;

  let parsed: URL;
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

export function themeFontStylesheetUrl(
  font: { url?: string | null } | null | undefined,
  role: ThemeFontRole,
  typography?: { headingWeight?: unknown; bodyWeight?: unknown } | null,
): string | undefined {
  if (!font?.url) return undefined;
  const weights = themeFontWeightsForRole(role, typography);
  return narrowGoogleFontStylesheetUrl(font.url, weights);
}
