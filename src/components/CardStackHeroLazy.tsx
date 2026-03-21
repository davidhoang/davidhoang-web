import React, { Suspense, lazy } from 'react';

// Lazy load the CardStackHero component (735 lines, uses framer-motion)
const CardStackHero = lazy(() => import('./CardStackHero'));

const skeletonBar = (width: string, height: string, marginBottom?: string) => ({
  width,
  height,
  marginBottom,
  borderRadius: '10px',
  background: 'var(--color-border)',
  opacity: 0.55,
  animation: 'card-stack-skeleton-pulse 1.6s ease-in-out infinite',
});

// Skeleton placeholder that mirrors hero title + card stack footprint (reduces layout jump)
const CardStackHeroSkeleton = () => (
  <>
    <style>{`
      @keyframes card-stack-skeleton-pulse {
        50% { opacity: 0.28; }
      }
    `}</style>
    <div
      className="card-stack-hero-skeleton"
      style={{
        width: '100%',
        minHeight: 'clamp(420px, 52dvh, 640px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '0 var(--content-padding, 1rem) 0.5rem',
        boxSizing: 'border-box',
      }}
      aria-busy="true"
      aria-label="Loading hero section"
    >
      <div
        style={{
          width: '100%',
          maxWidth: 'min(100%, var(--container-max-width, 72rem))',
          marginInline: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={skeletonBar('min(12rem, 42%)', '0.65rem', '1rem')} />
        <div style={skeletonBar('min(92%, 36rem)', 'clamp(2.25rem, 8vw, 3.75rem)', 'clamp(1.75rem, 4vw, 2.75rem)')} />
        <div
          style={{
            position: 'relative',
            width: '240px',
            height: '340px',
            marginTop: '12px',
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '200px',
                height: '260px',
                marginLeft: '-100px',
                marginTop: '-130px',
                borderRadius: '18px',
                background: 'var(--color-border)',
                opacity: 0.4 + i * 0.1,
                transform: `translateX(${(i - 1.5) * 28}px) rotate(${(i - 1.5) * 5}deg)`,
                animation: 'card-stack-skeleton-pulse 1.6s ease-in-out infinite',
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  </>
);

export default function CardStackHeroLazy() {
  return (
    <Suspense fallback={<CardStackHeroSkeleton />}>
      <CardStackHero />
    </Suspense>
  );
}
