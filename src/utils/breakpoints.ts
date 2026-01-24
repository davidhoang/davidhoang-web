/**
 * Centralized Breakpoint Configuration
 *
 * This file provides a single source of truth for all responsive breakpoints
 * used throughout the application. Import these constants in JavaScript/TypeScript
 * files to ensure consistency with CSS media queries.
 *
 * Breakpoint Strategy:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ Breakpoint      │ Value  │ Target Devices                              │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ MOBILE          │ 480px  │ Small phones, portrait mode                 │
 * │ TABLET          │ 768px  │ Tablets, large phones, small tablets        │
 * │ TABLET_LARGE    │ 900px  │ Large tablets (iPad Pro), landscape tablets │
 * │ DESKTOP         │ 1024px │ Small laptops, desktop browsers             │
 * │ DESKTOP_LARGE   │ 1440px │ Standard desktop monitors                   │
 * │ DESKTOP_XL      │ 1920px │ Large desktop monitors, 4K displays         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Usage:
 *   import { BREAKPOINTS, isMobile, isTablet, isDesktop } from '@/utils/breakpoints';
 *
 *   // Check current viewport
 *   if (isMobile()) {
 *     // Mobile-specific code
 *   }
 *
 *   // Use raw values
 *   if (window.innerWidth <= BREAKPOINTS.TABLET) {
 *     // Tablet and smaller
 *   }
 */

export const BREAKPOINTS = {
  /** Small phones, portrait mode (max-width: 480px) */
  MOBILE: 480,

  /** Tablets, large phones (max-width: 768px) */
  TABLET: 768,

  /** Large tablets like iPad Pro (max-width: 900px) */
  TABLET_LARGE: 900,

  /** Small laptops, desktop browsers (max-width: 1024px) */
  DESKTOP: 1024,

  /** Standard desktop monitors (max-width: 1440px) */
  DESKTOP_LARGE: 1440,

  /** Large desktop monitors, 4K displays (min-width: 1920px) */
  DESKTOP_XL: 1920,
} as const;

/**
 * Check if the current viewport is mobile-sized (≤480px)
 */
export function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= BREAKPOINTS.MOBILE;
}

/**
 * Check if the current viewport is tablet-sized or smaller (≤768px)
 */
export function isTablet(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= BREAKPOINTS.TABLET;
}

/**
 * Check if the current viewport is large tablet-sized or smaller (≤900px)
 */
export function isTabletLarge(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= BREAKPOINTS.TABLET_LARGE;
}

/**
 * Check if the current viewport is desktop-sized or larger (>768px)
 */
export function isDesktop(): boolean {
  return typeof window !== 'undefined' && window.innerWidth > BREAKPOINTS.TABLET;
}

/**
 * Check if the current viewport is large desktop (≥1920px)
 */
export function isDesktopXL(): boolean {
  return typeof window !== 'undefined' && window.innerWidth >= BREAKPOINTS.DESKTOP_XL;
}

/**
 * Get a media query string for use in matchMedia
 * @param breakpoint - The breakpoint value
 * @param type - 'max' for max-width, 'min' for min-width
 */
export function getMediaQuery(breakpoint: number, type: 'max' | 'min' = 'max'): string {
  return `(${type}-width: ${breakpoint}px)`;
}

/**
 * Check if the device supports hover (not touch-only)
 */
export function supportsHover(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
}

/**
 * Check if the device has a coarse pointer (touch screen)
 */
export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
