import { useState, useEffect, useRef } from 'react';
import { cards, resolveLayout } from './hero/types';
import type { HeroLayout, LayoutProps } from './hero/types';
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
  const containerRef = useRef<HTMLDivElement>(null);

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
        <HeroTitle hasSelection={hasSelection} />
        <LayoutComponent
          cards={cards}
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
          min-height: 480px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 0 1rem 0 1rem;
          position: relative;
          overflow: visible;
          box-sizing: border-box;
        }

        .card-stack-container {
          position: relative;
          width: 100%;
          max-width: 100%;
          height: 450px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          overflow: visible;
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

        .hero-title {
          font-size: clamp(1.1rem, 4.5vw, 3rem);
          font-weight: 700;
          margin: 0 auto 1.5rem auto;
          padding: 0 0.5rem;
          text-align: center;
          color: var(--color-text);
          font-family: var(--font-primary);
          line-height: 1.3;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          white-space: nowrap;
        }

        .card-stack-hero--editorial .hero-title {
          text-align: left;
          white-space: nowrap;
          width: 100%;
          max-width: 100%;
          margin: 0;
          padding-top: 0;
        }

        .and-link {
          color: var(--color-link);
          text-decoration: none;
          cursor: pointer;
          margin: 0 0.15em;
          transition: color 0.2s ease;
        }

        /* Suppress theme link-style ::after pseudo on hero links */
        .and-link::after,
        .role-link::after {
          display: none !important;
        }

        .and-link:hover {
          color: var(--color-link-hover);
        }

        .role-link {
          color: var(--color-link);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .role-link:hover {
          color: var(--color-link-hover);
        }

        .cards-wrapper {
          position: relative;
          width: 240px;
          height: 340px;
          margin-top: 20px;
        }

        .card {
          position: absolute;
          width: 240px;
          height: 320px;
          border-radius: 20px;
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
        @media (max-width: 1100px) {
          .card-stack-hero--stacked-fan .cards-wrapper {
            transform: scale(0.85);
          }
        }

        @media (max-width: 900px) {
          .card-stack-hero--stacked-fan .cards-wrapper {
            transform: scale(0.75);
          }

          .card-stack-hero--editorial .hero-title {
            text-align: center;
          }
        }

        @media (max-width: 768px) {
          .card-stack-hero {
            min-height: 400px;
          }

          .card-stack-container {
            height: 380px;
          }

          .card-stack-hero--stacked-fan .cards-wrapper {
            margin-top: 15px;
            transform: scale(0.65);
          }

          .card-selected {
            width: 280px;
            margin-left: -140px;
          }

          .card-selected .card-title {
            font-size: 1.4rem;
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
            transform: scale(0.55);
          }

          .card-stack-container {
            height: 320px;
          }

          .card-selected {
            width: 260px;
            margin-left: -130px;
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
