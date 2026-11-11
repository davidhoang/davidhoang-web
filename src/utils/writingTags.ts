/** Tag helpers for writing posts: listing pages live at `/writing/tag/{tag}`. */

interface TaggedEntry {
  data: { tags?: string[] };
}

export interface WritingTagCount {
  tag: string;
  count: number;
}

const TAG_LABEL_OVERRIDES: Record<string, string> = {
  ai: 'AI',
};

export function writingTagPath(tag: string): string {
  return `/writing/tag/${encodeURIComponent(tag)}`;
}

/** Sentence-case display label: `interface-design` → `Interface design`. */
export function formatWritingTagLabel(tag: string): string {
  const override = TAG_LABEL_OVERRIDES[tag.toLowerCase()];
  if (override) return override;
  const words = tag.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Unique tags with post counts, most used first, then alphabetical. */
export function collectWritingTags(entries: readonly TaggedEntry[]): WritingTagCount[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of new Set(entry.data.tags || [])) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function filterWritingByTag<T extends TaggedEntry>(entries: readonly T[], tag: string): T[] {
  return entries.filter((entry) => (entry.data.tags || []).includes(tag));
}
