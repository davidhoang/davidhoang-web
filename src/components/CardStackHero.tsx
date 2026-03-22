import { useState, useEffect, useRef, useMemo } from 'react';
import { cards, resolveLayout } from './hero/types';
import type { Card, HeroLayout, LayoutProps } from './hero/types';
import { deriveHeroCardPalette } from './hero/themeCardColors';
import { HeroTitle } from './hero/HeroTitle';
import StackedFanLayout from './hero/layouts/StackedFanLayout';
import EditorialLayout from './hero/layouts/EditorialLayout';
import ScatteredLayout from './hero/layouts/ScatteredLayout';
import RolodexLayout from './hero/layouts/RolodexLayout';

const layoutComponents: Record<HeroLayout, React.ComponentType<LayoutProps>> = {
  'stacked-fan': StackedFanLayout,
  'editorial': EditorialLayout,
  'scattered': ScatteredLayout,
  'rolodex': RolodexLayout,
};

export default function CardStackHero() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasAnimatedIn, setHasAnimatedIn] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [cardStyle, setCardStyle] = useState<string | null>(null);
  const [heroLayout, setHeroLayout] = useState<HeroLayout>('stacked-fan');
  const [cardPaletteRev, setCardPaletteRev] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
    if (!themed) return cards;
    return cards.map((c, i) => ({
      ...c,
      color: themed[i] ?? c.color,
    }));
  }, [cardPaletteRev]);

  // Observe data-card-style and data-hero-layout on <html>
  useEffect(() => {
    const update = () => {
      const root = document.documentElement;
      setCardStyle(root.getAttribute('data-card-style'));
      setHeroLayout(resolveLayout(root.getAttribute('data-hero-layout')));
    };

    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-card-style', 'data-hero-layout'],
    });

    return () => observer.disconnect();
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

  // Trigger entrance animation after in view
  useEffect(() => {
    if (!isInView) return;

    const timer = setTimeout(() => setIsLoaded(true), 100);
    const completeTimer = setTimeout(() => setHasAnimatedIn(true), 100 + cards.length * 80 + 500);
    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [isInView]);

  const handleCardClick = (cardId: string, link?: string) => {
    if (cardId === 'about' && link) {
      window.location.href = link;
      return;
    }
    setSelectedCard(selectedCard === cardId ? null : cardId);
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
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + cards.length) % cards.length;
        setSelectedCard(cards[prevIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCard]);

  const hasSelection = selectedCard !== null;
  const LayoutComponent = layoutComponents[heroLayout];

  return (
    <div className={`card-stack-hero card-stack-hero--${heroLayout}`} ref={containerRef}>
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
          onCardHover={setHoveredCard}
        />
      </div>

      {selectedCard && (
        <div
          className="click-outside-overlay"
          onClick={() => setSelectedCard(null)}
        />
      )}

      <style>{`
        .card-stack-hero {
          width: 100%;
          min-height: clamp(420px, 52dvh, 640px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 0 var(--content-padding, 1rem) 0.5rem;
          position: relative;
          overflow: visible;
          box-sizing: border-box;
        }

        .card-stack-hero--stacked-fan {
          overflow: hidden;
        }

        .card-stack-container {
          position: relative;
          width: 100%;
          max-width: min(100%, var(--container-max-width, 72rem));
          margin-inline: auto;
          height: 450px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          overflow: visible;
        }

        .card-stack-hero--stacked-fan .card-stack-container {
          height: 510px;
        }

        .card-stack-hero--editorial {
          min-height: auto;
        }

        .card-stack-hero--editorial .card-stack-container {
          flex-direction: column;
          align-items: flex-start;
          height: auto;
          min-height: auto;
          max-width: 100%;
          gap: 1.5rem;
        }

        .card-stack-hero--scattered .card-stack-container {
          height: 520px;
        }

        .card-stack-hero--rolodex .card-stack-container {
          perspective: 1200px;
        }

        .card-stack-hero__intro {
          width: 100%;
          max-width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 0.25rem;
        }

        .card-stack-hero--stacked-fan .card-stack-hero__intro {
          margin-bottom: clamp(0.5rem, 1.5vw, 1rem);
        }

        /* Override global .hero-title (shared-components) which targets page wrappers */
        .card-stack-hero .hero-title {
          height: auto;
          min-height: 0;
          margin-top: 0;
          margin-bottom: clamp(1.75rem, 4vw, 2.75rem);
          display: block;
          border-radius: 0;
          justify-content: unset;
          align-items: unset;
          font-size: clamp(2.5rem, 7vw, 6rem);
          font-weight: 700;
          padding: 0 0.5rem;
          text-align: center;
          color: var(--color-text);
          font-family: var(--font-primary);
          line-height: 1.05;
          letter-spacing: -0.03em;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          text-wrap: balance;
        }

        .card-stack-hero--stacked-fan .hero-title {
          margin-bottom: clamp(2.5rem, 6vw, 4rem);
        }

        .card-stack-hero--editorial .card-stack-hero__intro {
          align-items: flex-start;
          text-align: left;
        }

        .card-stack-hero--editorial .hero-title {
          text-align: left;
          margin-left: 0;
          margin-right: 0;
          padding-top: 0;
        }

        .and-link,
        .role-link {
          display: inline !important;
          color: var(--color-link);
          text-decoration: none;
          cursor: pointer;
          transition: color 0.2s ease;
          position: relative;
          border: none;
          padding: 0;
          margin: 0;
        }

        .and-link:hover,
        .role-link:hover {
          color: var(--color-link-hover);
        }

        /* Suppress theme link-style ::after pseudo on hero links */
        .and-link::after,
        .role-link::after {
          display: none !important;
        }

        .cards-wrapper {
          position: relative;
          width: 240px;
          height: 340px;
          margin-top: 20px;
        }

        .card-stack-hero--stacked-fan .cards-wrapper {
          margin-top: clamp(28px, 4vw, 56px);
        }

        .card {
          /* Concentric nested radii: inner = outer − inset (see shader expanded panel). */
          --card-radius: 20px;
          --card-panel-inset: 12px;
          --card-panel-inner-radius: max(0px, calc(var(--card-radius) - var(--card-panel-inset)));
          position: absolute;
          width: 240px;
          height: 320px;
          border-radius: var(--card-radius);
          cursor: pointer;
          overflow: hidden;
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 2px 8px rgba(0, 0, 0, 0.08),
            inset 0 0 0 1px rgba(255, 255, 255, 0.3);
          display: flex;
          flex-direction: column;
          left: 50%;
          top: 50%;
          margin-left: -120px;
          margin-top: -160px;
          transform-origin: center center;
          transition: box-shadow 0.3s ease;
          will-change: transform, opacity;
        }

        .card:hover {
          box-shadow:
            0 20px 50px rgba(0, 0, 0, 0.2),
            0 8px 24px rgba(0, 0, 0, 0.12),
            inset 0 0 0 1px rgba(255, 255, 255, 0.4);
        }

        .card:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.5);
          outline-offset: -4px;
        }

        .card-selected {
          width: 320px;
          height: auto;
          min-height: 320px;
          margin-left: -160px;
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.25), 0 12px 32px rgba(0, 0, 0, 0.15);
        }

        .card-glass-mode {
          background-color: rgba(255, 255, 255, 0.05) !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .card-glass-overlay {
          position: absolute;
          inset: 0;
          opacity: 0.15;
          z-index: 0;
          pointer-events: none;
        }

        .card-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 55%;
          overflow: hidden;
        }

        .card-selected .card-pattern {
          height: 40%;
        }

        .card-image {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-size: cover;
          background-position: center top;
        }

        .card-thumbnail-area {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 55%;
          overflow: hidden;
        }

        .card-thumbnail {
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center top;
        }

        .card-selected .card-thumbnail-area {
          height: 40%;
        }

        .card-with-image .card-content {
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
          padding-top: 60px;
        }

        .card-selected.card-with-image .card-image {
          bottom: 40%;
        }

        .card-selected.card-with-image .card-content {
          background: rgba(0,0,0,0.85);
          padding-top: 24px;
        }

        .card-content {
          margin-top: auto;
          padding: 20px;
          color: white;
          position: relative;
          z-index: 1;
        }

        .card-selected .card-content {
          padding: 24px 24px 0 24px;
        }

        .card-title {
          font-size: 1.35rem;
          font-weight: 600;
          margin: 0;
          line-height: 1.2;
          color: white;
        }

        .card-selected .card-title {
          font-size: 1.75rem;
        }

        .card-subtitle {
          color: white;
          font-size: 0.9rem;
          margin: 6px 0 0 0;
          opacity: 0.75;
        }

        .card-selected .card-subtitle {
          font-size: 1rem;
          margin-top: 8px;
        }

        /* Shader header cards: title overlaps dither/mesh — scrim + shadow for legibility */
        .card-has-shader .card-content {
          padding-top: 28px;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.88) 0%,
            rgba(0, 0, 0, 0.62) 36%,
            rgba(0, 0, 0, 0.28) 65%,
            transparent 100%
          );
        }

        .card-has-shader .card-title,
        .card-has-shader .card-subtitle {
          text-shadow:
            0 1px 2px rgba(0, 0, 0, 0.95),
            0 2px 14px rgba(0, 0, 0, 0.5);
        }

        .card-has-shader .card-subtitle {
          opacity: 0.96;
        }

        .card-selected.card-has-shader .card-content {
          padding-top: 32px;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.9) 0%,
            rgba(0, 0, 0, 0.68) 32%,
            rgba(0, 0, 0, 0.32) 58%,
            transparent 100%
          );
        }

        .card-selected.card-has-shader .card-expanded-content {
          margin: 0 var(--card-panel-inset) var(--card-panel-inset) var(--card-panel-inset);
          /* Margin + padding keeps 24px from card edge to copy; inner radius = outer − inset */
          padding: 20px calc(24px - var(--card-panel-inset)) calc(24px - var(--card-panel-inset))
            calc(24px - var(--card-panel-inset));
          background: rgba(0, 0, 0, 0.22);
          border-radius: 0 0 var(--card-panel-inner-radius) var(--card-panel-inner-radius);
        }

        .card-has-shader .card-description {
          opacity: 1;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
        }

        .card-has-shader .card-link {
          background: rgba(0, 0, 0, 0.4);
          border: 1px dashed rgba(255, 255, 255, 0.5);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
        }

        .card-has-shader .card-link:hover {
          background: rgba(0, 0, 0, 0.55);
        }

        .card-expanded-content {
          padding: 16px 24px 24px 24px;
          color: white;
        }

        .card-description {
          font-size: 0.95rem;
          line-height: 1.6;
          margin: 0 0 20px 0;
          color: white;
          opacity: 0.9;
        }

        .card-links {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .card-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: white;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.9rem;
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 8px;
          transition: background 0.2s;
        }

        .card-link:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .click-outside-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10;
        }

        /* === Editorial layout overrides === */
        .card-stack-hero--editorial .cards-wrapper {
          width: 100%;
          height: auto;
          min-height: auto;
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 0;
          overflow: visible;
        }

        .card-stack-hero--editorial .card {
          position: relative;
          left: auto;
          top: auto;
          margin: 0;
          width: calc(33.333% - 0.75rem);
          min-width: 180px;
          height: 280px;
          flex-shrink: 0;
        }

        .card-stack-hero--editorial .card-selected {
          width: calc(33.333% - 0.75rem);
          min-width: 260px;
          height: auto;
          min-height: 280px;
          margin-left: 0;
        }

        /* === Scattered layout overrides === */
        .card-stack-hero--scattered .cards-wrapper {
          width: 100%;
          height: 420px;
          max-width: 1000px;
        }

        .card-stack-hero--scattered .card {
          width: 200px;
          height: 260px;
          margin-left: -100px;
          margin-top: -130px;
        }

        .card-stack-hero--scattered .card-selected {
          width: 300px;
          margin-left: -150px;
          height: auto;
          min-height: 260px;
        }

        /* === Rolodex layout overrides === */
        .card-stack-hero--rolodex .cards-wrapper {
          width: 280px;
          height: 380px;
          perspective: 1200px;
          transform-style: preserve-3d;
        }

        .card-stack-hero--rolodex .card {
          width: 280px;
          height: 360px;
          margin-left: -140px;
          margin-top: -180px;
          backface-visibility: hidden;
        }

        .card-stack-hero--rolodex .card-selected {
          width: 340px;
          margin-left: -170px;
          height: auto;
          min-height: 360px;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .card-stack-hero--stacked-fan .cards-wrapper {
            transform: scale(0.8);
          }

          .card-stack-hero--editorial .card-stack-hero__intro {
            align-items: center;
            text-align: center;
          }

          .card-stack-hero--editorial .hero-title {
            text-align: center;
          }
        }

        @media (max-width: 768px) {
          .card-stack-hero {
            min-height: 400px;
            padding-left: 0;
            padding-right: 0;
          }

          .card-stack-container {
            height: 380px;
            max-width: 100%;
          }

          .card-stack-hero--stacked-fan .card-stack-container {
            height: 430px;
          }

          .card-stack-hero--stacked-fan .cards-wrapper {
            margin-top: clamp(22px, 4vw, 36px);
            transform: scale(0.75);
          }

          .card-selected {
            position: fixed;
            top: 50%;
            left: 50%;
            width: calc(100vw - 2rem);
            max-width: 400px;
            margin-left: 0;
            margin-top: 0;
            transform: translate(-50%, -50%) !important;
            z-index: 30;
            min-height: auto;
            height: auto;
          }

          .card-selected .card-title {
            font-size: 1.6rem;
          }

          .card-selected .card-subtitle {
            font-size: 1.05rem;
          }

          .click-outside-overlay {
            background: rgba(0, 0, 0, 0.4);
          }

          .card-stack-hero--scattered .cards-wrapper {
            transform: scale(0.7);
          }

          .card-stack-hero--rolodex .cards-wrapper {
            transform: scale(0.8);
          }
        }

        @media (max-width: 480px) {
          .card-stack-hero--stacked-fan .cards-wrapper {
            transform: scale(0.65);
            margin-top: clamp(18px, 5vw, 28px);
          }

          .card-stack-container {
            height: 340px;
          }

          .card-stack-hero--stacked-fan .card-stack-container {
            height: 385px;
          }

          .card-stack-hero--stacked-fan .hero-title {
            margin-bottom: clamp(1.75rem, 6vw, 2.75rem);
          }

          .card-selected {
            width: calc(100vw - 1.5rem);
            max-width: 360px;
          }

          .card-stack-hero--scattered .cards-wrapper {
            transform: scale(0.55);
          }

          .card-stack-hero--rolodex .cards-wrapper {
            transform: scale(0.65);
          }
        }
      `}</style>
    </div>
  );
}
