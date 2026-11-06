/**
 * Critical font preloading for LCP.
 *
 * Returns the woff2 paths that should be preloaded for a given page. Preloads
 * are limited to the Latin subset of fonts we're confident the first viewport
 * needs — site UI (ABC Diatype) plus today's theme heading/body fonts when
 * they're self-hosted (legacy /styles/fonts/*.css or vendored
 * /fonts/daily-theme/ via `themeLatinPreloadPaths`).
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
const SOURCE_SERIF_4_LATIN = SELF_HOSTED_LATIN['Source Serif 4'];

const MAX_PRELOADS = 5;

const HIGH_PRIORITY_FONT_FILES = ['ABCDiatypeVariable.woff2'];

/** fetchpriority for a preloaded woff2 — home/index routes defer to image LCP. */
export function fontPreloadFetchPriority(
  pageType: PageType,
  fontPath: string,
): 'high' | undefined {
  if (pageType === 'home') return undefined;
  const fileName = fontPath.split('/').pop() || '';
  return HIGH_PRIORITY_FONT_FILES.some((name) => fileName.includes(name)) ? 'high' : undefined;
}

export function getCriticalFonts(
  pageType: PageType = 'home',
  themeFontNames: string[] = [],
  themeLatinPreloadPaths: string[] = [],
): string[] {
  const fonts: string[] = [ABC_DIATYPE];
  if (pageType === 'blog') {
    fonts.push(ABC_DIATYPE_MONO);
    if (SOURCE_SERIF_4_LATIN && !fonts.includes(SOURCE_SERIF_4_LATIN)) {
      fonts.push(SOURCE_SERIF_4_LATIN);
    }
  }

  for (const name of themeFontNames) {
    const url = SELF_HOSTED_LATIN[name];
    if (url && !fonts.includes(url)) fonts.push(url);
  }

  for (const path of themeLatinPreloadPaths) {
    if (path && !fonts.includes(path)) fonts.push(path);
  }

  return fonts.slice(0, MAX_PRELOADS);
}
