import React, { Suspense, lazy } from 'react';

// Lazy load the CardStackHero component (735 lines, uses framer-motion)
const CardStackHero = lazy(() => import('./CardStackHero'));

// Skeleton placeholder that matches the hero layout dimensions
const CardStackHeroSkeleton = () => (
  <div
    style={{
      minHeight: '500px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
    aria-busy="true"
    aria-label="Loading hero section"
  />
);

export default function CardStackHeroLazy() {
  return (
    <Suspense fallback={<CardStackHeroSkeleton />}>
      <CardStackHero />
    </Suspense>
  );
}
