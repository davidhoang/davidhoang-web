export type HeroViewportTier = 'compact' | 'mobile' | 'desktop';

/** Matches CardStackHero mobile breakpoints (480 / 768). */
export function readHeroViewportTier(): HeroViewportTier {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w <= 480) return 'compact';
  if (w <= 768) return 'mobile';
  return 'desktop';
}

export function isMobileHeroViewport(): boolean {
  const tier = readHeroViewportTier();
  return tier === 'compact' || tier === 'mobile';
}
