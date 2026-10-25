import {
  BREAKPOINT_COMPACT_MAX,
  BREAKPOINT_PHONE_MAX,
  BREAKPOINT_TABLET_MAX,
} from '../../utils/breakpoints';

export type HeroViewportTier = 'compact' | 'mobile' | 'tablet' | 'desktop';

/** Matches CardStackHero breakpoints (480 / 767 / 1024). */
export function readHeroViewportTier(): HeroViewportTier {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w <= BREAKPOINT_COMPACT_MAX) return 'compact';
  if (w <= BREAKPOINT_PHONE_MAX) return 'mobile';
  if (w <= BREAKPOINT_TABLET_MAX) return 'tablet';
  return 'desktop';
}

export function isMobileHeroViewport(): boolean {
  const tier = readHeroViewportTier();
  return tier === 'compact' || tier === 'mobile';
}
