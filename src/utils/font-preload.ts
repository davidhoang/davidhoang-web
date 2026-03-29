/**
 * Font Preloading Utilities for LCP Optimization
 *
 * Preloads only the critical fonts per page type.
 * Secondary/theme fonts load naturally via font-display:swap.
 */

// Only preload the primary brand font — other fonts load via CSS with font-display:swap
export const CRITICAL_FONTS = {
  primary: [
    '/fonts/ABCDiatypeVariable.woff2',
  ],
  mono: [
    '/fonts/ABCDiatypeMonoVariable.woff2',
  ],
};

// Page-type → font list (max 3 preloads to avoid contention)
export const PAGE_FONT_PRIORITIES: Record<string, string[]> = {
  home: [
    '/fonts/ABCDiatypeVariable.woff2',
  ],
  blog: [
    '/fonts/ABCDiatypeVariable.woff2',
    '/fonts/ABCDiatypeMonoVariable.woff2', // Code blocks
  ],
  about: [
    '/fonts/ABCDiatypeVariable.woff2',
  ],
};

/**
 * Get critical fonts to preload based on page type.
 * Returns at most 3 font URLs.
 */
export function getCriticalFonts(pageType: keyof typeof PAGE_FONT_PRIORITIES = 'home'): string[] {
  return PAGE_FONT_PRIORITIES[pageType] || PAGE_FONT_PRIORITIES.home;
}
