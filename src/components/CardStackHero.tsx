import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { MotionConfig } from 'framer-motion';
import { cards, resolveLayout } from './hero/types';
import type { Card, HeroLayout, LayoutProps } from './hero/types';
import { isMobileHeroViewport, readHeroViewportTier } from './hero/heroViewport';
import { deriveHeroCardPalette } from './hero/themeCardColors';
import { HeroTitle } from './hero/HeroTitle';
import { HeroDialProvider } from './hero/HeroDialProvider';
// Default + mobile-forced layout stays eager; other layouts lazy-split.
import StackedFanLayout from './hero/layouts/StackedFanLayout';

const EditorialLayout = lazy(() => import('./hero/layouts/EditorialLayout'));
const ScatteredLayout = lazy(() => import('./hero/layouts/ScatteredLayout'));
const RolodexLayout = lazy(() => import('./hero/layouts/RolodexLayout'));
const CinematicLayout = lazy(() => import('./hero/layouts/CinematicLayout'));

function readInitialHeroLayout(): HeroLayout {
  if (typeof window === 'undefined') return 'stacked-fan';
  if (isMobileHeroViewport()) return 'stacked-fan';
  return resolveLayout(document.documentElement.getAttribute('data-hero-layout'));
}

const layoutComponents: Record<HeroLayout, React.ComponentType<LayoutProps>> = {
  'stacked-fan': StackedFanLayout,
  'editorial': EditorialLayout,
  'scattered': ScatteredLayout,
  'rolodex': RolodexLayout,
  'cinematic': CinematicLayout,
};

interface CardStackHeroProps {
  aboutThumbnailSrc?: string;
}

function openCardLink(link?: string) {
  if (!link) return;
  const external = /^(https?:)?\/\//i.test(link);
  if (external) {
    window.open(link, '_blank', 'noopener,noreferrer');
    return;
  }
  window.location.href = link;
}

export default function CardStackHero({ aboutThumbnailSrc }: CardStackHeroProps = {}) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [cardStyle, setCardStyle] = useState<string | null>(null);
  const [heroLayout, setHeroLayout] = useState<HeroLayout>(readInitialHeroLayout);
  const [cardPaletteRev, setCardPaletteRev] = useState(0);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [entranceKey, setEntranceKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const replayEntrance = useCallback(() => {
    setHasAnimatedIn(false);
    setIsLoaded(false);
    setEntranceKey((key) => key + 1);
    requestAnimationFrame(() => {
      setIsLoaded(true);
      window.setTimeout(
        () => setHasAnimatedIn(true),
        100 + cards.length * 80 + 500
      );
    });
  }, []);

  // Apply viewport tier + layout before paint so mobile scale/height are correct
  // when cards become visible (avoids desktop-sized flash on phones).
  useLayoutEffect(() => {
    const syncHeroViewport = () => {
      document.documentElement.setAttribute('data-hero-viewport', readHeroViewportTier());
    };
    syncHeroViewport();
    window.addEventListener('resize', syncHeroViewport);
    setIsLayoutReady(true);
    return () => window.removeEventListener('resize', syncHeroViewport);
  }, []);

  // Daily theme: recolor hero cards from --color-link family; default theme keeps types.ts colors
  useEffect(() => {
    const bump = () => setCardPaletteRev((n) => n + 1);
    bump();
    const rafId = requestAnimationFrame(bump);
    const obs = new MutationObserver(bump);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-daily-theme', 'data-theme', 'data-e-ink'],
    });
    window.addEventListener('theme-changed', bump);
    return () => {
      cancelAnimationFrame(rafId);
      obs.disconnect();
      window.removeEventListener('theme-changed', bump);
    };
  }, []);

  const displayCards: Card[] = useMemo(() => {
    const themed = deriveHeroCardPalette(cards.length);
    return cards.map((c, i) => {
      const color = themed?.[i] ?? c.color;
      const thumbnail = c.id === 'about' && aboutThumbnailSrc ? aboutThumbnailSrc : c.thumbnail;
      return { ...c, color, thumbnail };
    });
  }, [cardPaletteRev, aboutThumbnailSrc]);

  // Observe data-card-style and data-hero-layout on <html>.
  // On mobile (≤768px), force stacked-fan regardless of theme — editorial,
  // scattered, and rolodex assume desktop dimensions and overflow on phones.
  // Also listen for theme-changed (dispatched on document) so layout sync isn't
  // solely dependent on MutationObserver delivery under a busy main thread.
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');

    const update = () => {
      const root = document.documentElement;
      // Glass card style is banned (cards must never be transparent — see design.md).
      // Normalize any legacy themes still emitting "glass" to "elevated".
      const rawCardStyle = root.getAttribute('data-card-style');
      setCardStyle(rawCardStyle === 'glass' ? 'elevated' : rawCardStyle);
      const themeLayout = resolveLayout(root.getAttribute('data-hero-layout'));
      setHeroLayout(mql.matches ? 'stacked-fan' : themeLayout);
    };

    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-card-style', 'data-hero-layout'],
    });
    mql.addEventListener('change', update);
    document.addEventListener('theme-changed', update);

    return () => {
      observer.disconnect();
      mql.removeEventListener('change', update);
      document.removeEventListener('theme-changed', update);
    };
  }, []);

  // IntersectionObserver for deferred animation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsInView(true);
      setIsLoaded(true);
      setHasAnimatedIn(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Trigger entrance animation after in view and layout is sized for viewport
  useEffect(() => {
    if (!isInView || !isLayoutReady) return;

    const timer = setTimeout(() => setIsLoaded(true), 100);
    const completeTimer = setTimeout(() => setHasAnimatedIn(true), 100 + cards.length * 80 + 500);
    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [isInView, isLayoutReady]);

  const handleCardClick = (_cardId: string, link?: string) => {
    setHoveredCard(null);
    openCardLink(link);
  };

  const LayoutComponent = layoutComponents[heroLayout];

  return (
    <HeroDialProvider onReplayEntrance={replayEntrance}>
    <MotionConfig reducedMotion="user">
    <div
      className={`card-stack-hero card-stack-hero--${heroLayout}${isLayoutReady ? ' card-stack-hero--layout-ready' : ''}`}
      ref={containerRef}
    >
      <div className="card-stack-container">
        <header className="card-stack-hero__intro">
          <HeroTitle hasSelection={false} isVisible={isLoaded} />
        </header>
        <Suspense fallback={null}>
          <LayoutComponent
            key={entranceKey}
            cards={displayCards}
            selectedCard={null}
            hoveredCard={hoveredCard}
            isLoaded={isLoaded}
            hasAnimatedIn={hasAnimatedIn}
            cardStyle={cardStyle}
            onCardClick={handleCardClick}
            onCardDismiss={() => {}}
            onCardHover={setHoveredCard}
          />
        </Suspense>
      </div>
    </div>
    </MotionConfig>
    </HeroDialProvider>
  );
}
