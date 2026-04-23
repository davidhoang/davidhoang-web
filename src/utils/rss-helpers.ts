/**
 * Shared helpers for the RSS feeds under /rss.xml and /rss/*.
 *
 * These encapsulate the two pieces of logic that must not regress:
 * 1. Drafts are filtered out in production so unpublished posts don't
 *    leak to subscribers.
 * 2. Entries are sorted newest-first by pubDate.
 */

type RssEntryLike = {
  data: {
    draft?: boolean;
    pubDate: Date;
    tags?: string[];
  };
};

/**
 * In production, filter entries where `data.draft` is truthy.
 * In dev, return everything so drafts are previewable.
 */
export function filterDraftsInProd<T extends RssEntryLike>(
  entries: readonly T[],
  isProd: boolean,
): T[] {
  return isProd ? entries.filter((entry) => !entry.data.draft) : entries.slice();
}

/**
 * Sort entries by pubDate descending (newest first).
 * Returns a new array; does not mutate the input.
 */
export function sortByPubDateDesc<T extends RssEntryLike>(entries: readonly T[]): T[] {
  return entries
    .slice()
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/**
 * Convenience: apply draft filter then sort newest-first.
 */
export function prepareRssEntries<T extends RssEntryLike>(
  entries: readonly T[],
  isProd: boolean,
): T[] {
  return sortByPubDateDesc(filterDraftsInProd(entries, isProd));
}

/**
 * Keep entries that include the given tag.
 */
export function filterByTag<T extends RssEntryLike>(
  entries: readonly T[],
  tag: string,
): T[] {
  return entries.filter((entry) => (entry.data.tags || []).includes(tag));
}
