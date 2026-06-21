import type { ThemeData } from '../components/generative-ui/ThemeSpecRenderer';

export type ThemeFilterKey =
  | 'all'
  | 'serif'
  | 'sans-serif'
  | 'display'
  | 'elevated'
  | 'flat'
  | 'outlined'
  | 'filled'
  | 'high-contrast'
  | 'shader'
  | 'editorial'
  | 'stacked-fan'
  | 'scattered'
  | 'rolodex';

export type ThemeSortKey = 'newest' | 'oldest' | 'name';

export const THEME_FILTERS: { key: ThemeFilterKey; label: string; group?: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'serif', label: 'Serif', group: 'Type' },
  { key: 'sans-serif', label: 'Sans-serif', group: 'Type' },
  { key: 'display', label: 'Display', group: 'Type' },
  { key: 'elevated', label: 'Elevated', group: 'Surface' },
  { key: 'flat', label: 'Flat', group: 'Surface' },
  { key: 'outlined', label: 'Outlined', group: 'Surface' },
  { key: 'filled', label: 'Filled', group: 'Surface' },
  { key: 'high-contrast', label: 'High contrast', group: 'Tone' },
  { key: 'shader', label: 'Shader', group: 'Motion' },
  { key: 'editorial', label: 'Editorial hero', group: 'Hero' },
  { key: 'stacked-fan', label: 'Stacked fan', group: 'Hero' },
  { key: 'scattered', label: 'Scattered', group: 'Hero' },
  { key: 'rolodex', label: 'Rolodex', group: 'Hero' },
];

const FONT_FILTERS = new Set(['serif', 'sans-serif', 'display']);
const CARD_FILTERS = new Set(['elevated', 'flat', 'outlined', 'filled']);
const HERO_FILTERS = new Set(['editorial', 'stacked-fan', 'scattered', 'rolodex']);

export function matchesThemeFilter(theme: ThemeData, filter: ThemeFilterKey): boolean {
  if (filter === 'all') return true;

  if (FONT_FILTERS.has(filter)) {
    return (
      theme.fonts?.heading?.category === filter ||
      theme.fonts?.body?.category === filter
    );
  }

  if (CARD_FILTERS.has(filter)) {
    return theme.cards?.style === filter;
  }

  if (filter === 'high-contrast') {
    return theme.colors?.contrastMode === 'high';
  }

  if (filter === 'shader') {
    const shaderType = theme.shader?.type;
    return Boolean(shaderType && shaderType !== 'none');
  }

  if (HERO_FILTERS.has(filter)) {
    return theme.hero?.layout === filter;
  }

  return true;
}

export function themeSearchText(theme: ThemeData): string {
  return [
    theme.name,
    theme.description,
    theme.date,
    theme.fonts?.heading?.name,
    theme.fonts?.body?.name,
    theme.fonts?.heading?.category,
    theme.fonts?.body?.category,
    theme.colors?.colorScheme,
    theme.cards?.style,
    theme.layout?.gridStyle,
    theme.hero?.layout,
    theme.links?.style,
    theme.background?.texture,
    theme.footer?.style,
    theme.shader?.type,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function matchesThemeSearch(theme: ThemeData, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return themeSearchText(theme).includes(normalized);
}

export function sortThemes<T extends ThemeData>(themes: T[], sort: ThemeSortKey): T[] {
  const sorted = [...themes];
  sorted.sort((a, b) => {
    if (sort === 'name') {
      return a.name.localeCompare(b.name);
    }
    const dateA = a.date;
    const dateB = b.date;
    return sort === 'newest' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
  });
  return sorted;
}

export function filterThemes<T extends ThemeData>(
  themes: T[],
  options: { filter: ThemeFilterKey; search: string; sort: ThemeSortKey },
): T[] {
  const filtered = themes.filter(
    (theme) => matchesThemeFilter(theme, options.filter) && matchesThemeSearch(theme, options.search),
  );
  return sortThemes(filtered, options.sort);
}

export function paletteToCss(theme: ThemeData): string {
  const lines: string[] = [`/* ${theme.name} (${theme.date}) */`];

  for (const [key, value] of Object.entries(theme.colors?.light || {})) {
    lines.push(`${key}: ${value};`);
  }

  if (theme.fonts?.heading?.stack) {
    lines.push(`--font-heading: ${theme.fonts.heading.stack};`);
  }
  if (theme.fonts?.body?.stack) {
    lines.push(`--font-body: ${theme.fonts.body.stack};`);
  }

  return lines.join('\n');
}

export function buildThemeShareUrl(date: string, origin = ''): string {
  const url = new URL('/daily-themes', origin || 'https://www.davidhoang.com');
  url.searchParams.set('theme', date);
  return url.toString();
}

export function buildCompareShareUrl(dates: string[], origin = ''): string {
  const url = new URL('/daily-themes', origin || 'https://www.davidhoang.com');
  url.searchParams.set('compare', dates.slice(0, 2).join(','));
  return url.toString();
}

export function parseThemeUrlState(search: string): { theme?: string; compare?: string[] } {
  const params = new URLSearchParams(search);
  const theme = params.get('theme') || undefined;
  const compare = params
    .get('compare')
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 2);

  return { theme, compare };
}

export function themeMetaSummary(theme: ThemeData): { label: string; value: string }[] {
  return [
    { label: 'Grid', value: theme.layout?.gridStyle || '—' },
    { label: 'Hero', value: theme.hero?.layout || '—' },
    { label: 'Links', value: theme.links?.style || '—' },
    { label: 'Shader', value: theme.shader?.type || 'none' },
    { label: 'Cards', value: theme.cards?.style || '—' },
    { label: 'Scheme', value: theme.colors?.colorScheme || '—' },
  ];
}
