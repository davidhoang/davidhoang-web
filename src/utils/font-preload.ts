/**
 * Critical font preloading for LCP.
 *
 * Returns the woff2 paths that should be preloaded for a given page. Preloads
 * are limited to the Latin subset of fonts we're confident the first viewport
 * needs — site UI (ABC Diatype) plus today's theme heading/body fonts when
 * they're self-hosted.
 *
 * Themes whose fonts come from Google Fonts (Clash Display, IBM Plex Sans,
 * Unbounded, Bodoni Moda, Crimson Text) are intentionally not preloaded here —
 * their CSS link in MainLayout drives loading.
 */

type PageType = 'home' | 'blog' | 'about';

// Latin subset .woff2 paths for fonts we self-host via /styles/fonts/*.css.
// Keep aligned with FONT_CSS_RAW in MainLayout.astro.
const SELF_HOSTED_LATIN: Record<string, string> = {
  'Inter': '/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2',
  'Cormorant Garamond': '/fonts/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.woff2',
  'Space Grotesk': '/fonts/V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.woff2',
  'Source Serif 4': '/fonts/vEFF2_tTDB4M7-auWDN0ahZJW3IX2ih5nk3AucvUHf6kDXr4.woff2',
};

const ABC_DIATYPE = '/fonts/ABCDiatypeVariable.woff2';
const ABC_DIATYPE_MONO = '/fonts/ABCDiatypeMonoVariable.woff2';

const MAX_PRELOADS = 5;

export function getCriticalFonts(
  pageType: PageType = 'home',
  themeFontNames: string[] = [],
): string[] {
  const fonts: string[] = [ABC_DIATYPE];
  if (pageType === 'blog') fonts.push(ABC_DIATYPE_MONO);

  for (const name of themeFontNames) {
    const url = SELF_HOSTED_LATIN[name];
    if (url && !fonts.includes(url)) fonts.push(url);
  }

  return fonts.slice(0, MAX_PRELOADS);
}
