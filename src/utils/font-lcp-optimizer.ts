/**
 * Advanced Font Loading & LCP Optimizer
 * 
 * Implements sophisticated font loading strategies to optimize LCP:
 * - Dynamic font subsetting
 * - Theme-aware preloading
 * - Critical path font prioritization
 * - FOUT/FOIT prevention
 */

interface FontLoadingOptions {
  enableDynamicPreloading?: boolean;
  enableFontDisplay?: boolean;
  enableResourceHints?: boolean;
  themeAware?: boolean;
}

interface CriticalFontConfig {
  family: string;
  weight: string | number;
  style?: string;
  url: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  theme?: string[];
}

// Critical fonts configuration for LCP optimization
const CRITICAL_FONT_CONFIG: CriticalFontConfig[] = [
  // Primary system font - always critical
  {
    family: 'ABC Diatype',
    weight: '300 900', // Variable font weight range
    url: '/fonts/ABCDiatypeVariable.woff2',
    priority: 'critical'
  },
  
  // Most common theme font - Inter
  {
    family: 'Inter',
    weight: '400',
    url: '/fonts/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7.woff2',
    priority: 'high',
    theme: ['default', 'minimal', 'modern']
  },
  
  // Popular serif theme font
  {
    family: 'Cormorant Garamond', 
    weight: '400',
    url: '/fonts/co3bmX5slCNuHLi8bLeY9MK7whWMhyjYqXtK.woff2',
    priority: 'high',
    theme: ['elegant', 'classic']
  },
  
  // Monospace for code (secondary priority)
  {
    family: 'ABC Diatype Mono',
    weight: '300 900',
    url: '/fonts/ABCDiatypeMonoVariable.woff2',
    priority: 'medium'
  }
];

/**
 * Font LCP Optimizer Class
 */
export class FontLCPOptimizer {
  private options: FontLoadingOptions;
  private loadedFonts = new Set<string>();
  private observer?: PerformanceObserver;

  constructor(options: FontLoadingOptions = {}) {
    this.options = {
      enableDynamicPreloading: true,
      enableFontDisplay: true,
      enableResourceHints: true,
      themeAware: true,
      ...options
    };
  }

  /**
   * Initialize font loading optimization
   */
  public init(): void {
    if (typeof window === 'undefined') return;

    this.setupFontLoadingObserver();
    this.optimizeFontDisplay();
    
    if (this.options.themeAware) {
      this.setupThemeAwareFontLoading();
    }
    
    if (this.options.enableDynamicPreloading) {
      this.dynamicallyPreloadFonts();
    }
  }

  /**
   * Setup performance observer for font loading metrics
   */
  private setupFontLoadingObserver(): void {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource' && entry.initiatorType === 'link') {
            const resource = entry as PerformanceResourceTiming;
            if (resource.name.includes('.woff2')) {
              this.onFontLoaded(resource.name, resource.loadEnd - resource.loadStart);
            }
          }
        }
      });

      try {
        this.observer.observe({ entryTypes: ['resource'] });
      } catch (e) {
        // Fallback for older browsers
        console.debug('Performance observer not supported');
      }
    }
  }

  /**
   * Optimize font-display for better LCP
   */
  private optimizeFontDisplay(): void {
    // Ensure all font-face rules use font-display: swap
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-display: swap;
      }
      
      /* Fallback font matching for better FOUT prevention */
      .font-loading {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      }
      
      /* Smooth transition when web fonts load */
      html {
        font-synthesis: none;
        text-rendering: optimizeLegibility;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup theme-aware font loading
   */
  private setupThemeAwareFontLoading(): void {
    // Monitor theme changes
    const themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'data-daily-theme' || 
             mutation.attributeName === 'data-theme')) {
          this.preloadThemeFonts();
        }
      });
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-daily-theme', 'data-theme']
    });

    // Initial theme font preloading
    this.preloadThemeFonts();
  }

  /**
   * Preload fonts for current theme
   */
  private preloadThemeFonts(): void {
    const currentTheme = this.getCurrentTheme();
    const themeFonts = CRITICAL_FONT_CONFIG.filter(font => 
      !font.theme || font.theme.includes(currentTheme)
    );

    themeFonts.forEach(font => {
      if (!this.loadedFonts.has(font.url)) {
        this.preloadFont(font);
      }
    });
  }

  /**
   * Get current theme from DOM
   */
  private getCurrentTheme(): string {
    const dailyTheme = document.documentElement.getAttribute('data-daily-theme');
    if (dailyTheme && dailyTheme !== 'default') {
      return dailyTheme;
    }
    return 'default';
  }

  /**
   * Preload a font with optimal settings
   */
  private preloadFont(font: CriticalFontConfig): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = font.url;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    
    if (font.priority === 'critical' || font.priority === 'high') {
      link.setAttribute('fetchpriority', 'high');
    }
    
    document.head.appendChild(link);
    this.loadedFonts.add(font.url);
  }

  /**
   * Dynamically preload fonts based on content analysis
   */
  private dynamicallyPreloadFonts(): void {
    // Analyze page content to determine which fonts are most critical
    const headings = document.querySelectorAll('h1, h2, h3');
    const hasLargeHeadings = headings.length > 3;
    
    // Preload additional fonts if we have lots of headings
    if (hasLargeHeadings) {
      const headingFont = CRITICAL_FONT_CONFIG.find(f => f.family === 'ABC Diatype');
      if (headingFont && !this.loadedFonts.has(headingFont.url)) {
        this.preloadFont(headingFont);
      }
    }
  }

  /**
   * Handle font loaded event
   */
  private onFontLoaded(url: string, loadTime: number): void {
    this.loadedFonts.add(url);
    
    // Mark critical fonts as loaded for LCP measurement
    const isCriticalFont = CRITICAL_FONT_CONFIG.some(f => url.includes(f.url));
    if (isCriticalFont) {
      document.documentElement.classList.add('critical-fonts-loaded');
      
      // Report font loading metrics
      if ('performance' in window && 'measure' in window.performance) {
        try {
          performance.measure(`font-loaded-${url.split('/').pop()}`, {
            start: 0,
            end: loadTime
          });
        } catch (e) {
          // Ignore measurement errors
        }
      }
    }
  }

  /**
   * Get recommended fonts for preloading based on page type
   */
  public static getRecommendedPreloads(pageType: 'home' | 'blog' | 'about'): CriticalFontConfig[] {
    const basePreloads = CRITICAL_FONT_CONFIG.filter(f => f.priority === 'critical' || f.priority === 'high');
    
    switch (pageType) {
      case 'blog':
        // Include monospace font for code blocks
        return [
          ...basePreloads,
          ...CRITICAL_FONT_CONFIG.filter(f => f.family.includes('Mono'))
        ].slice(0, 4);
        
      case 'about':
        // Prioritize serif fonts for readability
        return [
          ...basePreloads,
          ...CRITICAL_FONT_CONFIG.filter(f => f.family.includes('Garamond'))
        ].slice(0, 4);
        
      default:
        return basePreloads.slice(0, 3);
    }
  }

  /**
   * Cleanup observers
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Export singleton instance
export const fontLCPOptimizer = new FontLCPOptimizer();

// Auto-initialize on DOM ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => fontLCPOptimizer.init());
  } else {
    fontLCPOptimizer.init();
  }
}