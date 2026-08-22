const DEFAULT_WORDS_PER_MINUTE = 238;

export function countReadableWords(source: string): number {
  const plainText = source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_~|=-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return plainText ? plainText.split(' ').length : 0;
}

export function estimateReadingMinutes(
  sources: Array<string | undefined>,
  wordsPerMinute = DEFAULT_WORDS_PER_MINUTE,
): number {
  const wordCount = sources.reduce((total, source) => total + countReadableWords(source ?? ''), 0);
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}
