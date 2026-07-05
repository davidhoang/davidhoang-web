export type HeroViewportTier = 'compact' | 'mobile' | 'tablet' | 'desktop';

/** Matches CardStackHero breakpoints (480 / 768 / 1024). */
export function readHeroViewportTier(): HeroViewportTier {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w <= 480) return 'compact';
  if (w <= 768) return 'mobile';
  if (w <= 1024) return 'tablet';
  return 'desktop';
}

export function isMobileHeroViewport(): boolean {
  const tier = readHeroViewportTier();
  return tier === 'compact' || tier === 'mobile';
}
