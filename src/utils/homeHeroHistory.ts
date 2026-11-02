import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { HeroCardId } from '../components/hero/types';
import { heroCardSources } from '../components/hero/types';
import { CANONICAL_SITE } from '../utils/structuredData';

export const HOME_HERO_HISTORY_PUBLIC_PATH = '/home-hero-history.json';
export const HOME_HERO_HISTORY_MAX_ENTRIES = 14;
export const HOME_HERO_HISTORY_FETCH_TIMEOUT_MS = 2_500;

export interface HomeHeroHistoryEntry {
  date: string;
  lead: HeroCardId;
  probabilities: Partial<Record<HeroCardId, number>>;
  source: 'jev' | 'fallback';
}

export interface HomeHeroHistoryFile {
  decisions: HomeHeroHistoryEntry[];
}

function isoDateOnly(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(`${value}T12:00:00.000Z`) : value;
  return date.toISOString().slice(0, 10);
}

function daysBetween(later: string, earlier: string): number {
  const end = new Date(`${later}T12:00:00.000Z`).getTime();
  const start = new Date(`${earlier}T12:00:00.000Z`).getTime();
  return Math.round((end - start) / 86_400_000);
}

function penaltyMultiplier(daysAgo: number): number | null {
  if (daysAgo === 1) return 0.5;
  if (daysAgo >= 2 && daysAgo <= 4) return 0.75;
  return null;
}

/**
 * Reduce repeat leads using recent history, then renormalize probabilities.
 * Empty or missing history returns a shallow copy with no changes.
 */
export function applyRecencyPenalty(
  probabilities: Partial<Record<HeroCardId, number>>,
  history: HomeHeroHistoryEntry[] | undefined,
  today: string,
): Partial<Record<HeroCardId, number>> {
  if (!history?.length) {
    return { ...probabilities };
  }

  const cardIds = heroCardSources.map((source) => source.id);
  const multipliers = new Map<HeroCardId, number>();
  for (const id of cardIds) {
    multipliers.set(id, 1);
  }

  for (const entry of history) {
    const daysAgo = daysBetween(today, entry.date);
    const multiplier = penaltyMultiplier(daysAgo);
    if (multiplier == null) continue;
    const current = multipliers.get(entry.lead) ?? 1;
    multipliers.set(entry.lead, Math.min(current, multiplier));
  }

  const adjusted: Partial<Record<HeroCardId, number>> = {};
  let total = 0;
  for (const id of cardIds) {
    const base = probabilities[id] ?? 0;
    const value = base * (multipliers.get(id) ?? 1);
    adjusted[id] = value;
    total += value;
  }

  if (total <= 0) {
    return { ...probabilities };
  }

  for (const id of cardIds) {
    adjusted[id] = (adjusted[id] ?? 0) / total;
  }

  return adjusted;
}

export function resolveLeadFromProbabilities(
  probabilities: Partial<Record<HeroCardId, number>>,
  fallbackChoice: HeroCardId,
): HeroCardId {
  const cardIds = heroCardSources.map((source) => source.id);
  let bestId = fallbackChoice;
  let bestScore = probabilities[fallbackChoice] ?? -1;

  for (const id of cardIds) {
    const score = probabilities[id] ?? 0;
    if (score > bestScore || (score === bestScore && id.localeCompare(bestId) < 0)) {
      bestId = id;
      bestScore = score;
    }
  }

  return bestId;
}

export function trimHomeHeroHistory(
  decisions: HomeHeroHistoryEntry[],
  maxEntries = HOME_HERO_HISTORY_MAX_ENTRIES,
): HomeHeroHistoryEntry[] {
  return decisions.slice(-maxEntries);
}

export function appendHomeHeroDecision(
  decisions: HomeHeroHistoryEntry[],
  entry: HomeHeroHistoryEntry,
  maxEntries = HOME_HERO_HISTORY_MAX_ENTRIES,
): HomeHeroHistoryEntry[] {
  const withoutToday = decisions.filter((decision) => decision.date !== entry.date);
  return trimHomeHeroHistory([...withoutToday, entry], maxEntries);
}

export function parseHomeHeroHistoryPayload(payload: unknown): HomeHeroHistoryEntry[] {
  if (!payload || typeof payload !== 'object') return [];
  const decisions = (payload as HomeHeroHistoryFile).decisions;
  if (!Array.isArray(decisions)) return [];

  return decisions.filter(
    (entry): entry is HomeHeroHistoryEntry =>
      Boolean(entry) &&
      typeof entry === 'object' &&
      typeof (entry as HomeHeroHistoryEntry).date === 'string' &&
      typeof (entry as HomeHeroHistoryEntry).lead === 'string' &&
      ((entry as HomeHeroHistoryEntry).source === 'jev' ||
        (entry as HomeHeroHistoryEntry).source === 'fallback'),
  );
}

export function buildHomeHeroHistoryFetchUrl(
  origin: string,
  cacheBust = Date.now(),
): string {
  const url = new URL(HOME_HERO_HISTORY_PUBLIC_PATH, `${origin}/`);
  url.searchParams.set('build', String(cacheBust));
  return url.toString();
}

export function resolveHomeHeroHistoryOrigin(
  environment: Record<string, string | undefined> = process.env,
): string {
  const configured =
    environment.PUBLIC_SITE_URL ??
    environment.SITE_URL ??
    environment.VERCEL_PROJECT_PRODUCTION_URL;
  if (configured) {
    const withScheme = configured.startsWith('http') ? configured : `https://${configured}`;
    return withScheme.replace(/\/+$/, '');
  }
  return CANONICAL_SITE;
}

export async function fetchHomeHeroHistory(
  environment: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = HOME_HERO_HISTORY_FETCH_TIMEOUT_MS,
  cacheBust = Date.now(),
): Promise<HomeHeroHistoryEntry[]> {
  const origin = resolveHomeHeroHistoryOrigin(environment);
  const url = buildHomeHeroHistoryFetchUrl(origin, cacheBust);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!response.ok) return [];
    const payload = await response.json();
    return parseHomeHeroHistoryPayload(payload);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export function buildHomeHeroHistoryFile(
  decisions: HomeHeroHistoryEntry[],
): HomeHeroHistoryFile {
  return { decisions: trimHomeHeroHistory(decisions) };
}

export function writeHomeHeroHistoryFile(
  decisions: HomeHeroHistoryEntry[],
  projectRoot = process.cwd(),
): void {
  const target = join(projectRoot, 'public', 'home-hero-history.json');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(buildHomeHeroHistoryFile(decisions), null, 2)}\n`, 'utf8');
}

export function formatHomeHeroBuildContextDate(buildDate: Date): {
  date: string;
  weekday: string;
} {
  return {
    date: buildDate.toISOString(),
    weekday: buildDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
  };
}

export { isoDateOnly };
