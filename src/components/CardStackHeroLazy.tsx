import React, { Suspense, lazy } from 'react';

// Lazy load the CardStackHero component (735 lines, uses framer-motion)
const CardStackHero = lazy(() => import('./CardStackHero'));

// Skeleton placeholder that mirrors hero title + card stack footprint (reduces layout jump)
const CardStackHeroSkeleton = () => (
  <>
    <style>{`
      @keyframes card-stack-skeleton-pulse {
        50% { opacity: 0.28; }
      }

      .card-stack-hero-skeleton {
        width: 100%;
        min-height: clamp(420px, 52dvh, 640px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding: 0 var(--content-padding, 1rem) 0.5rem;
        box-sizing: border-box;
      }

      .card-stack-hero-skeleton__inner {
        width: 100%;
        max-width: min(100%, var(--container-max-width, 72rem));
        margin-inline: auto;
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .card-stack-hero-skeleton__bar {
        border-radius: 10px;
        background: var(--color-border);
        opacity: 0.55;
        animation: card-stack-skeleton-pulse 1.6s ease-in-out infinite;
      }

      .card-stack-hero-skeleton__bar--eyebrow {
        width: min(12rem, 42%);
        height: 0.65rem;
        margin-bottom: 1rem;
      }

      .card-stack-hero-skeleton__bar--title {
        width: min(92%, 36rem);
        height: clamp(3.125rem, calc(1.125rem + 8.5vw), 3.875rem);
        margin-bottom: clamp(1rem, 3vw, 2.75rem);
      }

      .card-stack-hero-skeleton__cards {
        position: relative;
        width: 240px;
        height: 340px;
        margin-top: auto;
        flex-shrink: 0;
        transform-origin: center bottom;
      }

      .card-stack-hero-skeleton__card {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 200px;
        height: 260px;
        margin-left: -100px;
        margin-top: -130px;
        border-radius: 18px;
        background: var(--color-border);
        animation: card-stack-skeleton-pulse 1.6s ease-in-out infinite;
      }

      @media (max-width: 768px) {
        .card-stack-hero-skeleton {
          min-height: 400px;
          padding-left: 0;
          padding-right: 0;
        }

        .card-stack-hero-skeleton__cards {
          margin-top: clamp(22px, 4vw, 36px);
          transform: scale(0.75);
        }
      }

      @media (max-width: 480px) {
        .card-stack-hero-skeleton__cards {
          transform: scale(0.65);
          margin-top: clamp(18px, 5vw, 28px);
        }
      }
    `}</style>
    <div
      className="card-stack-hero-skeleton"
      aria-busy="true"
      aria-label="Loading hero section"
    >
      <div className="card-stack-hero-skeleton__inner">
        <div className="card-stack-hero-skeleton__bar card-stack-hero-skeleton__bar--eyebrow" />
        <div className="card-stack-hero-skeleton__bar card-stack-hero-skeleton__bar--title" />
        <div className="card-stack-hero-skeleton__cards">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="card-stack-hero-skeleton__card"
              style={{
                opacity: 0.4 + i * 0.1,
                transform: `translateX(${(i - 1.5) * 28}px) rotate(${(i - 1.5) * 5}deg)`,
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  </>
);

interface CardStackHeroLazyProps {
  aboutThumbnailSrc?: string;
}

export default function CardStackHeroLazy({ aboutThumbnailSrc }: CardStackHeroLazyProps = {}) {
  return (
    <Suspense fallback={<CardStackHeroSkeleton />}>
      <CardStackHero aboutThumbnailSrc={aboutThumbnailSrc} />
    </Suspense>
  );
}
