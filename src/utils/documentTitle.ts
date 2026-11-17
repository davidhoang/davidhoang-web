/**
 * Serialize text for `<title set:html={...} />`.
 * Astro's default text interpolation over-escapes apostrophes (`&#39;`) while
 * attribute meta tags keep literal `'`, so SERP/social audits see mismatched titles.
 * Only escape characters that are unsafe in HTML text (`&`, `<`, `>`).
 */
export function serializeDocumentTitle(title: string): string {
  return title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}