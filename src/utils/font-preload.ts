/**
 * Font Preloading Utilities for LCP Optimization
 * 
 * Identifies and preloads critical fonts for faster LCP (Largest Contentful Paint).
 * Prioritizes fonts based on theme and page type.
 */

// Critical font files that should always be preloaded
export const CRITICAL_FONTS = {
  // Primary system fonts (always needed)
  primary: [
    '/fonts/ABCDiatypeVariable.woff2',
    '/fonts/ABCDiatypeMonoVariable.woff2',
  ],
  
  // Most common self-hosted Google Fonts (Latin)
  google: [
    // Inter Regular (most common)
    '/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2',
    // Cormorant Garamond Regular (popular theme font)  
    '/fonts/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.woff2',
    // Inter Medium (headings)
    '/fonts/UcC73FwrK3iLTeHuS_nVMrMrMxCp50SjIa1ZL7.woff2',
    // Space Grotesk Regular (theme font)
    '/fonts/N4duVc9C58uwPiY8_59Fz4TTiuj4xTzsSvF.woff2',
  ]
};

// Font priorities for different page types
export const PAGE_FONT_PRIORITIES = {
  home: [
    'ABCDiatypeVariable.woff2',
    'UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2', // Inter Regular
    'co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.woff2', // Cormorant Garamond
  ],
  blog: [
    'ABCDiatypeVariable.woff2', 
    'UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2', // Inter Regular
    'ABCDiatypeMonoVariable.woff2', // Code blocks
  ],
  about: [
    'ABCDiatypeVariable.woff2',
    'co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.woff2', // Cormorant Garamond
  ]
};

/**
 * Get critical fonts to preload based on page type
 */
export function getCriticalFonts(pageType: keyof typeof PAGE_FONT_PRIORITIES = 'home'): string[] {
  const priorities = PAGE_FONT_PRIORITIES[pageType] || PAGE_FONT_PRIORITIES.home;
  const allCritical = [...CRITICAL_FONTS.primary, ...CRITICAL_FONTS.google];
  
  // Return fonts in priority order, removing duplicates
  const prioritySet = new Set(priorities);
  const orderedFonts = priorities.concat(
    allCritical.filter(font => !prioritySet.has(font.split('/').pop() || ''))
  );
  
  return orderedFonts.slice(0, 6); // Limit to 6 preloads max
}

/**
 * Generate preload link HTML for critical fonts
 */
export function generateFontPreloadHTML(fonts: string[]): string {
  return fonts
    .map(font => `<link rel="preload" href="${font}" as="font" type="font/woff2" crossorigin />`)
    .join('\n  ');
}

/**
 * Get theme-specific critical fonts
 */
export function getThemeFonts(themeMode: 'default' | 'daily' = 'default'): string[] {
  if (themeMode === 'daily') {
    return [
      '/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2', // Inter Regular
      '/fonts/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.woff2', // Cormorant Garamond
      '/fonts/aFTH7PxzY382XsXX63LUYL6GYFcan6NJrKp-VPj1KOxQ.woff2', // Bodoni Moda
    ];
  }
  
  return CRITICAL_FONTS.primary;
}

/**
 * Font loading optimization strategies
 */
export const FONT_LOADING_STRATEGIES = {
  // For above-the-fold content
  critical: {
    display: 'swap',
    priority: 'high',
    preload: true
  },
  
  // For below-the-fold content  
  secondary: {
    display: 'swap',
    priority: 'low',
    preload: false
  },
  
  // For theme-specific fonts
  theme: {
    display: 'swap', 
    priority: 'medium',
    preload: 'conditional' // Only if theme is active
  }
} as const;

/**
 * Get font loading strategy for a specific font
 */
export function getFontLoadingStrategy(fontPath: string): typeof FONT_LOADING_STRATEGIES[keyof typeof FONT_LOADING_STRATEGIES] {
  if (CRITICAL_FONTS.primary.some(f => fontPath.includes(f))) {
    return FONT_LOADING_STRATEGIES.critical;
  }
  
  if (CRITICAL_FONTS.google.some(f => fontPath.includes(f))) {
    return FONT_LOADING_STRATEGIES.theme;
  }
  
  return FONT_LOADING_STRATEGIES.secondary;
}