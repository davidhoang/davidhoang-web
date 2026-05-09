const WORDS_PER_MINUTE = 225;

export function calculateReadingTime(markdown: string | undefined): number {
  if (!markdown) return 1;
  // Strip fenced code blocks so they don't inflate the prose word count.
  const prose = markdown.replace(/```[\s\S]*?```/g, '');
  const words = prose.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
