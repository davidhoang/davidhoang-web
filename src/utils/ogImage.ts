/**
 * Open Graph image helpers shared by the `/api/og` endpoint and page layouts.
 *
 * Centralizing this keeps the fallback contract consistent: every page that
 * doesn't ship a bespoke `ogImage` gets an on-brand generated card instead of
 * the single static site portrait.
 */

export type OgCardType = 'writing' | 'notes' | 'page';

/** Badge shown in the top-left of the generated card. General pages get none. */
export function resolveOgBadge(type: string | null | undefined): string {
  if (type === 'notes') return 'Notes';
  if (type === 'writing') return 'Writing';
  return '';
}

/** Shrink the headline as it gets longer so it stays inside the 1200×630 card. */
export function resolveOgTitleFontSize(titleLength: number): number {
  if (titleLength > 80) return 40;
  if (titleLength > 50) return 48;
  return 56;
}

/**
 * Build a relative `/api/og` URL for a generated card. Layouts pass the result
 * through their absolute-URL helper before emitting it as `og:image`.
 */
export function buildOgImageUrl(input: {
  title: string;
  description?: string;
  type?: OgCardType;
}): string {
  const params = new URLSearchParams();
  params.set('title', input.title);
  if (input.description) {
    params.set('description', input.description);
  }
  params.set('type', input.type ?? 'page');
  return `/api/og?${params.toString()}`;
}
