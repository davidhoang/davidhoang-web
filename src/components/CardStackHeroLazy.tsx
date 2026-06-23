import React, { Suspense, lazy } from 'react';

// Lazy load the CardStackHero component (735 lines, uses framer-motion)
const CardStackHero = lazy(() => import('./CardStackHero'));

// Skeleton placeholder that mirrors hero title + card stack footprint (reduces layout jump)
const CardStackHeroSkeleton = () => (
  <>
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
