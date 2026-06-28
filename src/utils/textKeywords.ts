/** Shared stop-word list for content similarity (related posts, writing graph). */
export const CONTENT_STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'it', 'its',
  'with', 'as', 'by', 'from', 'that', 'this', 'was', 'are', 'be', 'has', 'had', 'have', 'not',
  'what', 'how', 'you', 'your', 'we', 'our', 'new', 'will', 'can', 'about',
  'so', 'if', 'do', 'does', 'than', 'then', 'into', 'over', 'they',
  'them', 'their', 'these', 'those', 'may', 'just', 'also',
]);

export type KeywordOptions = {
  /** Minimum token length in characters (default 3). Writing graph uses 4. */
  minWordLength?: number;
};

export function getKeywords(text: string, options?: KeywordOptions): Set<string> {
  const minLen = options?.minWordLength ?? 3;
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length >= minLen && !CONTENT_STOP_WORDS.has(word)),
  );
}
