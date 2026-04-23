/**
 * Pure helpers used by the /api/og endpoint.
 * Kept separate so the title-sizing and description-truncation logic is
 * unit-testable without rendering an image.
 */

/**
 * Clamp the title font size based on title length.
 * Matches the thresholds used in the rendered OG image.
 */
export function clampTitleFontSize(titleLength: number): number {
  if (titleLength > 80) return 40;
  if (titleLength > 50) return 48;
  return 56;
}

/**
 * Truncate a description with an ellipsis when it exceeds `max` characters.
 * Slices to `max - 3` to make room for the ellipsis, matching the previous
 * inline logic (`slice(0, 117) + '...'` for a 120-char limit).
 */
export function truncateDescription(description: string, max = 120): string {
  if (!description) return '';
  if (description.length <= max) return description;
  return description.slice(0, max - 3) + '...';
}

/** Normalize the `type` query param to the label shown in the badge. */
export function typeLabel(type: string | null | undefined): string {
  return type === 'notes' ? 'Notes' : 'Writing';
}
