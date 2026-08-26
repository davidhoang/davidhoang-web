export interface CommandPaletteSearchItem {
  title: string;
  description: string;
  path: string;
  type: 'page' | 'writing' | 'note';
  tags?: string[];
  excerpt?: string;
}

export interface RankedCommandPaletteItem extends CommandPaletteSearchItem {
  score: number;
}

export const RECENT_SEARCHES_STORAGE_KEY = 'davidhoang.command-palette.recent-searches';
export const MAX_RECENT_SEARCHES = 5;

type SearchStorage = Pick<Storage, 'getItem' | 'setItem'>;

function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function fuzzySequenceScore(query: string, text: string): number {
  if (query.length < 2 || query.length > text.length) return 0;

  let queryIndex = 0;
  let previousMatch = -2;
  let firstMatch = -1;
  let score = 0;

  for (let textIndex = 0; textIndex < text.length && queryIndex < query.length; textIndex++) {
    if (text[textIndex] !== query[queryIndex]) continue;

    if (firstMatch === -1) firstMatch = textIndex;
    score += textIndex === previousMatch + 1 ? 7 : 2;
    if (textIndex === 0 || text[textIndex - 1] === ' ') score += 6;
    previousMatch = textIndex;
    queryIndex++;
  }

  if (queryIndex !== query.length) return 0;

  const span = previousMatch - firstMatch + 1;
  return Math.max(1, 45 + score - (span - query.length) * 2 - firstMatch);
}

function scoreField(query: string, text: string): number {
  const normalizedText = normalize(text);
  if (!normalizedText) return 0;
  if (normalizedText === query) return 140;
  if (normalizedText.startsWith(query)) return 125;

  const words = normalizedText.split(' ');
  if (words.some((word) => word.startsWith(query))) return 112;

  const substringIndex = normalizedText.indexOf(query);
  if (substringIndex >= 0) return 100 - Math.min(substringIndex, 20);

  const queryWords = query.split(' ');
  if (
    queryWords.length > 1 &&
    queryWords.every((queryWord) => words.some((word) => word.startsWith(queryWord)))
  ) {
    return 92;
  }

  const initials = words.map((word) => word[0]).join('');
  if (query.length > 1 && initials.startsWith(query.replaceAll(' ', ''))) return 84;

  return fuzzySequenceScore(query.replaceAll(' ', ''), normalizedText.replaceAll(' ', ''));
}

export function scoreCommandPaletteItem(
  query: string,
  item: CommandPaletteSearchItem,
): number {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return 0;

  const titleScore = scoreField(normalizedQuery, item.title);
  const descriptionScore = scoreField(normalizedQuery, item.description) * 0.55;
  const excerptScore = scoreField(normalizedQuery, item.excerpt ?? '') * 0.4;
  const tagScore = Math.max(
    0,
    ...(item.tags ?? []).map((tag) => scoreField(normalizedQuery, tag) * 0.7),
  );

  return Math.round(Math.max(titleScore, descriptionScore, excerptScore, tagScore));
}

export function rankCommandPaletteItems(
  query: string,
  items: CommandPaletteSearchItem[],
  limit = 12,
): RankedCommandPaletteItem[] {
  return items
    .map((item, index) => ({
      item,
      index,
      score: scoreCommandPaletteItem(query, item),
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.item.title.localeCompare(b.item.title) ||
        a.index - b.index,
    )
    .slice(0, limit)
    .map(({ item, score }) => ({ ...item, score }));
}

export function normalizeRecentSearch(query: string): string {
  return query.trim().replace(/\s+/g, ' ').slice(0, 80);
}

export function updateRecentSearches(
  searches: string[],
  query: string,
  limit = MAX_RECENT_SEARCHES,
): string[] {
  const normalizedQuery = normalizeRecentSearch(query);
  if (normalizedQuery.length < 2) return searches.slice(0, limit);

  return [
    normalizedQuery,
    ...searches.filter(
      (search) => normalize(search) !== normalize(normalizedQuery),
    ),
  ].slice(0, limit);
}

export function readRecentSearches(storage: SearchStorage = localStorage): string[] {
  try {
    const payload = JSON.parse(storage.getItem(RECENT_SEARCHES_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(payload)) return [];
    return payload
      .filter((value): value is string => typeof value === 'string')
      .map(normalizeRecentSearch)
      .filter((value) => value.length >= 2)
      .slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

export function saveRecentSearch(
  query: string,
  storage: SearchStorage = localStorage,
): string[] {
  const searches = updateRecentSearches(readRecentSearches(storage), query);
  try {
    storage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(searches));
  } catch {
    // Search remains fully functional when storage is unavailable or full.
  }
  return searches;
}
