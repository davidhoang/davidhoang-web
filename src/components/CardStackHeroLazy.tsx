import React, { Suspense, lazy } from 'react';

// Lazy load the CardStackHero component (735 lines, uses framer-motion)
const CardStackHero = lazy(() => import('./CardStackHero'));

const LCP_STILL_SRC = '/images/davidhoang-web-config-still.webp';
const LCP_STILL_WIDTH = 600;
const LCP_STILL_HEIGHT = 338;

// Skeleton placeholder that mirrors hero title + card stack footprint (reduces layout jump).
// Front card includes a real LCP <img> so the preloaded still paints before React hydrates.
const CardStackHeroSkeleton = ({ lcpImageSrc }: { lcpImageSrc?: string }) => (
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
              className={
                i === 0
                  ? 'card-stack-hero-skeleton__card card-stack-hero-skeleton__card--lcp'
                  : 'card-stack-hero-skeleton__card'
              }
              style={{
                opacity: 0.4 + i * 0.1,
                transform: `translate(${i === 0 ? 0 : i === 1 ? 12 : i === 2 ? -10 : 8}px, ${i * 14}px) rotate(${i === 0 ? 0 : i === 1 ? 2.5 : i === 2 ? -2 : 1.5}deg) scale(${1 - i * 0.035})`,
                zIndex: 4 - i,
                animationDelay: `${i * 0.12}s`,
              }}
            >
              {i === 0 && lcpImageSrc ? (
                <img
                  className="card-stack-hero-skeleton__lcp-img"
                  src={lcpImageSrc}
                  alt=""
                  width={LCP_STILL_WIDTH}
                  height={LCP_STILL_HEIGHT}
                  fetchPriority="high"
                  decoding="async"
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);

interface CardStackHeroLazyProps {
  aboutThumbnailSrc?: string;
  /** Preloaded config still — painted in the Suspense fallback for LCP. */
  lcpImageSrc?: string;
}

export default function CardStackHeroLazy({
  aboutThumbnailSrc,
  lcpImageSrc = LCP_STILL_SRC,
}: CardStackHeroLazyProps = {}) {
  return (
    <Suspense fallback={<CardStackHeroSkeleton lcpImageSrc={lcpImageSrc} />}>
      <CardStackHero aboutThumbnailSrc={aboutThumbnailSrc} />
    </Suspense>
  );
}
