import { useState, useEffect, useRef, useMemo } from 'react';
import { cards, resolveLayout } from './hero/types';
import type { Card, HeroLayout, LayoutProps } from './hero/types';
import { deriveHeroCardPalette } from './hero/themeCardColors';
import { HeroTitle } from './hero/HeroTitle';
import StackedFanLayout from './hero/layouts/StackedFanLayout';
import EditorialLayout from './hero/layouts/EditorialLayout';
import ScatteredLayout from './hero/layouts/ScatteredLayout';
import RolodexLayout from './hero/layouts/RolodexLayout';
import CinematicLayout from './hero/layouts/CinematicLayout';

const layoutComponents: Record<HeroLayout, React.ComponentType<LayoutProps>> = {
  'stacked-fan': StackedFanLayout,
  'editorial': EditorialLayout,
  'scattered': ScatteredLayout,
  'rolodex': RolodexLayout,
  'cinematic': CinematicLayout,
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

  // Fullscreen hero card (stacked-fan portal) should lock page scroll
  useEffect(() => {
    if (!selectedCard || heroLayout !== 'stacked-fan') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedCard, heroLayout]);

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
          className={`click-outside-overlay${heroLayout === 'stacked-fan' ? ' click-outside-overlay--hero-fullscreen' : ''}`}
          onClick={() => setSelectedCard(null)}
          aria-hidden="true"
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

        .card-stack-hero--cinematic {
          min-height: auto;
        }

        .card-stack-hero--cinematic .card-stack-container {
          height: auto;
          min-height: auto;
          max-width: 100%;
        }

        .card-stack-hero--cinematic .card-stack-hero__intro {
          align-items: flex-start;
          text-align: left;
        }

        .card-stack-hero--cinematic .hero-title {
          text-align: left;
          margin-left: 0;
          margin-right: 0;
          padding-top: 0;
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
          max-width: 1200px;
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
          /* Nested radii: inner = outer − inset (shader panels + hero frame). See: nested rounded corners */
          --card-radius: 20px;
          --card-panel-inset: 4px;
          --card-hero-frame: 1px;
          --card-hero-inner-radius: calc(var(--card-radius) - var(--card-hero-frame));
          --card-panel-inner-radius: max(0px, calc(var(--card-radius) - var(--card-panel-inset)));
          box-sizing: border-box;
          position: absolute;
          width: 240px;
          height: 320px;
          border-radius: var(--card-radius);
          cursor: pointer;
          overflow: hidden;
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 2px 8px rgba(0, 0, 0, 0.08),
            inset 0 0 0 0.5px rgba(255, 255, 255, 0.28);
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
            inset 0 0 0 0.5px rgba(255, 255, 255, 0.38);
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

        /* Portaled large card (stacked-fan): escapes scaled .cards-wrapper; centered stage, not edge-to-edge */
        .card-hero-fullscreen-stage {
          position: fixed;
          inset: 0;
          z-index: 10050;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: max(1rem, env(safe-area-inset-top, 0px))
            max(1rem, env(safe-area-inset-right, 0px))
            max(1rem, env(safe-area-inset-bottom, 0px))
            max(1rem, env(safe-area-inset-left, 0px));
          box-sizing: border-box;
          pointer-events: none;
        }

        .card-hero-fullscreen-stage .card-hero-fullscreen {
          pointer-events: auto;
          flex-shrink: 0;
        }

        /* Same proportions as fan cards (240×320): width : height = 3 : 4 */
        .card.card-selected.card-hero-fullscreen {
          position: relative;
          left: auto;
          top: auto;
          margin: 0;
          box-sizing: border-box;
          width: min(94vw, 480px, calc(min(88dvh, 720px) * 3 / 4));
          max-width: 100%;
          aspect-ratio: 3 / 4;
          height: auto;
          max-height: min(88dvh, 720px);
          border-radius: var(--card-radius);
          box-shadow:
            0 28px 80px rgba(0, 0, 0, 0.28),
            0 12px 36px rgba(0, 0, 0, 0.18),
            inset 0 0 0 0.5px rgba(255, 255, 255, 0.26);
          overflow-x: hidden;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .card-hero-fullscreen .card-pattern,
        .card-hero-fullscreen .card-thumbnail-area {
          height: 40%;
        }

        .card-hero-fullscreen.card-with-image .card-image {
          bottom: 40%;
        }

        .card-hero-fullscreen .card-content {
          padding: clamp(1.1rem, 3vw, 1.5rem) clamp(1.25rem, 4vw, 1.75rem) 0.75rem;
        }

        .card-hero-fullscreen .card-title {
          font-size: clamp(1.5rem, 4.2vw, 2.25rem);
        }

        .card-hero-fullscreen .card-subtitle {
          font-size: clamp(0.95rem, 2vw, 1.1rem);
        }

        .card-hero-fullscreen .card-expanded-content {
          padding: 0 clamp(1.25rem, 4vw, 1.75rem) clamp(1.25rem, 3.5vw, 1.75rem);
        }

        .card-hero-fullscreen .card-description {
          font-size: clamp(0.95rem, 2.2vw, 1.05rem);
          line-height: 1.62;
        }

        .card-hero-fullscreen.card-has-shader .card-content {
          padding-top: clamp(1.35rem, 3.5vw, 1.85rem);
        }

        .card-hero-fullscreen.card-has-shader .card-expanded-content {
          margin: 0 var(--card-panel-inset) var(--card-panel-inset) var(--card-panel-inset);
          padding: 16px calc(24px - var(--card-panel-inset)) calc(24px - var(--card-panel-inset))
            calc(24px - var(--card-panel-inset));
          border-radius: 0 0 var(--card-panel-inner-radius) var(--card-panel-inner-radius);
          max-width: none;
        }

        .card-hero-fullscreen.card-has-hero-layout .card-hero-image-wrap {
          height: min(36vh, 260px);
          min-height: 120px;
        }

        .card-hero-fullscreen.card-has-hero-layout .card-unified-panel {
          padding: clamp(1rem, 3vw, 1.35rem) clamp(1.1rem, 3.5vw, 1.5rem) clamp(1.1rem, 3vw, 1.35rem);
        }

        .card-hero-fullscreen.card-has-hero-layout .card-title {
          font-size: clamp(1.5rem, 4.2vw, 2.1rem);
        }

        .card-glass-mode {
          background-color: rgba(255, 255, 255, 0.05) !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 0.5px solid rgba(255, 255, 255, 0.12);
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

        /* === Hero image + unified panel (title, subtitle, description, CTA in one container) === */
        .card-has-hero-layout {
          overflow: hidden;
          /* Thin outer ring: card bg shows in frame; inner radius = outer − frame (nested corners). */
          padding: var(--card-hero-frame);
        }

        .card-hero-image-wrap {
          position: relative;
          flex-shrink: 0;
          width: 100%;
          height: 42%;
          min-height: 96px;
          overflow: hidden;
          border-radius: var(--card-hero-inner-radius) var(--card-hero-inner-radius) 0 0;
        }

        .card-hero-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          transition: filter 0.35s ease;
        }

        .card-hero-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
          transition: filter 0.35s ease;
        }

        .card-hero-image-wrap:not(.card-hero-image-wrap--active) .card-hero-image,
        .card-hero-image-wrap:not(.card-hero-image-wrap--active) .card-hero-video {
          filter: brightness(0.9) saturate(0.94);
        }

        .card-hero-image-wrap--active .card-hero-image,
        .card-hero-image-wrap--active .card-hero-video {
          filter: brightness(1) saturate(1);
        }

        @keyframes card-hero-drift {
          0% {
            transform: scale(1.06) translate(0%, 0%);
          }
          100% {
            transform: scale(1.14) translate(-2.5%, -1.5%);
          }
        }

        .card-hero-image-wrap--drift .card-hero-image {
          animation: card-hero-drift 9s ease-in-out infinite alternate;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .card-hero-image-wrap--drift .card-hero-image {
            animation: none;
          }
        }

        .card-unified-panel {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          padding: 14px 16px 16px;
          background: rgba(0, 18, 51, 0.55);
          border-top: 0.5px solid rgba(255, 255, 255, 0.14);
          position: relative;
          z-index: 1;
        }

        .card-has-hero-layout .card-unified-panel {
          border-radius: 0 0 var(--card-hero-inner-radius) var(--card-hero-inner-radius);
        }

        .card-unified-panel .card-title {
          text-shadow: none;
        }

        .card-unified-panel .card-subtitle {
          text-shadow: none;
          opacity: 0.88;
        }

        .card-unified-details {
          margin-top: 10px;
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .card-unified-details .card-description {
          margin-bottom: 16px;
          opacity: 0.95;
        }

        .card-unified-details .card-links {
          margin-top: auto;
        }

        .card-link--primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          align-self: flex-start;
          color: #0c1929;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 11px 18px;
          background: rgba(255, 255, 255, 0.96);
          border: none;
          border-radius: var(--radius-md);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          transition: background 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;
        }

        .card-link--primary:hover {
          color: #061018;
          background: #ffffff;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.24);
        }

        .card-selected.card-has-hero-layout .card-unified-panel {
          padding: 16px 18px 18px;
        }

        .card-selected.card-has-hero-layout .card-title {
          font-size: 1.75rem;
        }

        .card-selected.card-has-hero-layout .card-subtitle {
          font-size: 1rem;
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
          border-radius: var(--radius-md);
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

        .click-outside-overlay--hero-fullscreen {
          z-index: 10040;
          background: rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
        }

        @media (prefers-reduced-motion: reduce) {
          .click-outside-overlay--hero-fullscreen {
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
          }
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

        /* === Cinematic layout overrides === */
        .card-stack-hero--cinematic .cards-wrapper {
          width: 100%;
          height: auto;
          min-height: auto;
          display: flex;
          flex-direction: row;
          gap: 1rem;
          margin-top: 0;
          overflow: visible;
          align-items: stretch;
        }

        .cinematic-featured {
          flex: 3;
          min-width: 0;
        }

        .cinematic-filmstrip {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
          min-width: 0;
        }

        .card-stack-hero--cinematic .card {
          position: relative;
          left: auto;
          top: auto;
          margin: 0;
          border-radius: var(--card-radius, 20px);
        }

        .card-stack-hero--cinematic .card-featured {
          width: 100%;
          height: 380px;
        }

        .card-stack-hero--cinematic .card-filmstrip {
          width: 100%;
          height: 0;
          flex: 1;
          min-height: 56px;
          cursor: pointer;
        }

        /* Filmstrip cards: hide expanded content, show compact info */
        .card-stack-hero--cinematic .card-filmstrip .card-expanded-content,
        .card-stack-hero--cinematic .card-filmstrip .card-subtitle,
        .card-stack-hero--cinematic .card-filmstrip .card-description {
          display: none;
        }

        .card-stack-hero--cinematic .card-filmstrip .card-title {
          font-size: 0.8125rem;
        }

        .card-stack-hero--cinematic .card-filmstrip .card-content {
          padding: 0.5rem 0.75rem;
        }

        .card-stack-hero--cinematic .card-filmstrip .card-unified-panel {
          padding: 0.5rem 0.75rem;
        }

        /* Hero image in filmstrip: compact crop */
        .card-stack-hero--cinematic .card-filmstrip .card-hero-image-wrap {
          max-height: 40px;
        }

        .card-stack-hero--cinematic .card-selected {
          height: auto;
          min-height: 380px;
        }

        @media (max-width: 768px) {
          .card-stack-hero--cinematic .cards-wrapper {
            flex-direction: column;
          }

          .cinematic-filmstrip {
            flex-direction: row;
            overflow-x: auto;
            gap: 0.5rem;
            -webkit-overflow-scrolling: touch;
          }

          .card-stack-hero--cinematic .card-featured {
            height: 280px;
          }

          .card-stack-hero--cinematic .card-filmstrip {
            flex: 0 0 auto;
            width: 100px;
            height: 72px;
            min-height: auto;
          }
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

          .card-selected:not(.card-hero-fullscreen) {
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

          .card-selected:not(.card-hero-fullscreen) .card-title {
            font-size: 1.6rem;
          }

          .card-selected:not(.card-hero-fullscreen) .card-subtitle {
            font-size: 1.05rem;
          }

          .click-outside-overlay:not(.click-outside-overlay--hero-fullscreen) {
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

          .card-selected:not(.card-hero-fullscreen) {
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
