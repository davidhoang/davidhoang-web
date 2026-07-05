import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { MotionConfig } from 'framer-motion';
import { cards, resolveLayout } from './hero/types';
import type { Card, HeroLayout, LayoutProps } from './hero/types';
import { isMobileHeroViewport, readHeroViewportTier } from './hero/heroViewport';
import { deriveHeroCardPalette } from './hero/themeCardColors';
import { HeroTitle } from './hero/HeroTitle';
import StackedFanLayout from './hero/layouts/StackedFanLayout';
import EditorialLayout from './hero/layouts/EditorialLayout';
import ScatteredLayout from './hero/layouts/ScatteredLayout';
import RolodexLayout from './hero/layouts/RolodexLayout';
import CinematicLayout from './hero/layouts/CinematicLayout';

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

export default function CardStackHero({ aboutThumbnailSrc }: CardStackHeroProps = {}) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [cardStyle, setCardStyle] = useState<string | null>(null);
  const [heroLayout, setHeroLayout] = useState<HeroLayout>(readInitialHeroLayout);
  const [cardPaletteRev, setCardPaletteRev] = useState(0);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

    return () => {
      observer.disconnect();
      mql.removeEventListener('change', update);
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

  // Fullscreen hero card (stacked-fan portal) should lock page scroll
  useEffect(() => {
    if (!selectedCard || heroLayout !== 'stacked-fan') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedCard, heroLayout]);

  // Focus management: move focus to selected card, restore on close
  useEffect(() => {
    if (selectedCard) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the selected card element
      requestAnimationFrame(() => {
        const card = document.querySelector('.card-selected') as HTMLElement;
        if (card) card.focus();
      });
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [selectedCard]);

  const handleCardClick = (cardId: string, link?: string) => {
    if (cardId === 'about' && link) {
      window.location.href = link;
      return;
    }
    setSelectedCard((prev) => {
      const closing = prev === cardId;
      // Opening or switching cards: fan unmounts without mouseleave, so hover state can go stale.
      if (!closing) {
        setHoveredCard(null);
      }
      return closing ? null : cardId;
    });
  };

  const handleCardDismiss = () => {
    setSelectedCard(null);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCard) return;

      const currentIndex = cards.findIndex(card => card.id === selectedCard);

      if (e.key === 'Escape') {
        setSelectedCard(null);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % cards.length;
        setSelectedCard(cards[nextIndex].id);
        setHoveredCard(null);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + cards.length) % cards.length;
        setSelectedCard(cards[prevIndex].id);
        setHoveredCard(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCard]);

  const hasSelection = selectedCard !== null;
  const LayoutComponent = layoutComponents[heroLayout];

  return (
    <MotionConfig reducedMotion="user">
    <div
      className={`card-stack-hero card-stack-hero--${heroLayout}${isLayoutReady ? ' card-stack-hero--layout-ready' : ''}`}
      ref={containerRef}
    >
      <div className="card-stack-container">
        <header className="card-stack-hero__intro">
          <HeroTitle hasSelection={hasSelection} isVisible={isLoaded} />
        </header>
        <LayoutComponent
          cards={displayCards}
          selectedCard={selectedCard}
          hoveredCard={hoveredCard}
          isLoaded={isLoaded}
          hasAnimatedIn={hasAnimatedIn}
          cardStyle={cardStyle}
          onCardClick={handleCardClick}
          onCardDismiss={handleCardDismiss}
          onCardHover={setHoveredCard}
        />
      </div>

      {selectedCard && (
        <div
          className={`click-outside-overlay${
            heroLayout === 'stacked-fan' ? ' click-outside-overlay--hero-fullscreen' : ''
          }${
            heroLayout === 'stacked-fan' && isMobileHeroViewport()
              ? ' click-outside-overlay--hero-sheet'
              : ''
          }`}
          onClick={() => setSelectedCard(null)}
          role="presentation"
        />
      )}

    </div>
    </MotionConfig>
  );
}
