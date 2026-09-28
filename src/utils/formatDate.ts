/** e.g. "December 31, 2025" */
export function formatLongDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Relative label for recent dates; short absolute date for older ones. */
export function formatRelative(date: Date, now = Date.now()): string {
  const diff = now - date.getTime();
  const day = 86400000;
  if (diff < day) return 'Today';
  if (diff < day * 2) return 'Yesterday';
  if (diff < day * 7) return `${Math.floor(diff / day)} days ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date(now).getFullYear() ? 'numeric' : undefined,
  });
}

const LIST_DATE_RECENT_MS = 14 * 86400000;

/**
 * Shared list/card dates: relative freshness within 14 days, otherwise long form.
 * Notes keep relative feel for recent updates; Writing uses the same rule for parity.
 */
export function formatListDate(date: Date, now = Date.now()): string {
  const diff = now - date.getTime();
  if (diff >= 0 && diff < LIST_DATE_RECENT_MS) {
    return formatRelative(date, now);
  }
  return formatLongDate(date);
}
