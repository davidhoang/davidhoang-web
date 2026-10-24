/** Shared RSS collection ordering — production feeds omit drafts, newest first. */

export type RssCollectionEntry = {
  data: {
    draft?: boolean;
    pubDate: Date;
  };
};

export function rssEntriesForFeed<T extends RssCollectionEntry>(
  entries: T[],
  options: { production?: boolean } = {},
): T[] {
  const production = options.production ?? true;
  const visible = production ? entries.filter((entry) => !entry.data.draft) : entries;
  return [...visible].sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}
