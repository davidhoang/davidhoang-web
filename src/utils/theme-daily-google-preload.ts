import latinMap from '../data/theme-daily-google-font-latin.json';
import { themeFontWeightsForRole, type ThemeFontRole } from './theme-font-stylesheet';

type LatinWeights = Record<string, Record<string, string>>;

const LATIN = latinMap as LatinWeights;

/**
 * Latin-subset woff2 paths for theme fonts vendored under /fonts/daily-theme/.
 * Used for <link rel="preload">; weights match themeFontWeightsForRole.
 */
export function latinWoff2ForThemeFont(
  familyName: string,
  role: ThemeFontRole,
  typography: { headingWeight?: unknown; bodyWeight?: unknown } | null | undefined,
): string[] {
  const weights = themeFontWeightsForRole(role, typography);
  const perFamily = LATIN[familyName];
  if (!perFamily) return [];
  const paths: string[] = [];
  for (const w of weights) {
    const path = perFamily[String(w)];
    if (path && !paths.includes(path)) paths.push(path);
  }
  return paths;
}
