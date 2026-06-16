export type ContentKind = 'writing' | 'notes';

export interface RelatedContentItem {
  kind: ContentKind;
  id: string;
  title: string;
  description: string;
  href: string;
  date: Date;
  coverImage?: string;
  score: number;
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'it', 'its',
  'with', 'as', 'by', 'from', 'that', 'this', 'was', 'are', 'be', 'has', 'had', 'have', 'not',
  'what', 'how', 'you', 'your', 'we', 'our', 'new', 'will', 'can', 'about',
]);

export function getKeywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word)),
  );
}

export function scoreRelatedMatch(options: {
  sourceTags: string[];
  sourceKeywords: Set<string>;
  targetTags: string[];
  targetKeywords: Set<string>;
  explicit?: boolean;
}): number {
  const { sourceTags, sourceKeywords, targetTags, targetKeywords, explicit } = options;
  let score = explicit ? 100 : 0;

  for (const tag of targetTags) {
    if (sourceTags.includes(tag)) score += 10;
  }

  for (const word of targetKeywords) {
    if (sourceKeywords.has(word)) score += 1;
  }

  return score;
}

type ScorableEntry = {
  id: string;
  data: {
    title: string;
    description?: string;
    tags?: string[];
    pubDate: Date;
    updatedDate?: Date;
    coverImage?: string;
    ogImage?: string;
    draft?: boolean;
  };
};

function toRelatedItem(
  kind: ContentKind,
  entry: ScorableEntry,
  score: number,
): RelatedContentItem {
  const description = entry.data.description || '';
  const date = entry.data.updatedDate || entry.data.pubDate;
  const href = kind === 'writing' ? `/writing/${entry.id}` : `/notes/${entry.id}`;

  return {
    kind,
    id: entry.id,
    title: entry.data.title,
    description,
    href,
    date,
    coverImage: entry.data.coverImage || entry.data.ogImage,
    score,
  };
}

export function findRelatedContent(options: {
  kind: ContentKind;
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  relatedWriting?: string[];
  relatedNotes?: string[];
  writingEntries: ScorableEntry[];
  noteEntries: ScorableEntry[];
  limit?: number;
}): RelatedContentItem[] {
  const {
    kind,
    id,
    title,
    description = '',
    tags = [],
    relatedWriting = [],
    relatedNotes = [],
    writingEntries,
    noteEntries,
    limit = 4,
  } = options;

  const sourceKeywords = getKeywords(`${title} ${description}`);
  const explicitIds = new Set([
    ...relatedWriting.map((slug) => `writing:${slug}`),
    ...relatedNotes.map((slug) => `notes:${slug}`),
  ]);

  const candidates: RelatedContentItem[] = [];

  for (const entry of writingEntries) {
    if (kind === 'writing' && entry.id === id) continue;
    const explicit = explicitIds.has(`writing:${entry.id}`);
    const score = scoreRelatedMatch({
      sourceTags: tags,
      sourceKeywords,
      targetTags: entry.data.tags || [],
      targetKeywords: getKeywords(`${entry.data.title} ${entry.data.description || ''}`),
      explicit,
    });
    if (score > 0) candidates.push(toRelatedItem('writing', entry, score));
  }

  for (const entry of noteEntries) {
    if (kind === 'notes' && entry.id === id) continue;
    const explicit = explicitIds.has(`notes:${entry.id}`);
    const score = scoreRelatedMatch({
      sourceTags: tags,
      sourceKeywords,
      targetTags: entry.data.tags || [],
      targetKeywords: getKeywords(`${entry.data.title} ${entry.data.description || ''}`),
      explicit,
    });
    if (score > 0) candidates.push(toRelatedItem('notes', entry, score));
  }

  return candidates
    .sort((a, b) => b.score - a.score || b.date.valueOf() - a.date.valueOf())
    .slice(0, limit);
}

export function filterPublished<T extends ScorableEntry>(
  entries: T[],
  includeDrafts: boolean,
): T[] {
  return includeDrafts ? entries : entries.filter((entry) => !entry.data.draft);
}
