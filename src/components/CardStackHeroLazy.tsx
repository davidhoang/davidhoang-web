import { useEffect, useState, type ComponentType } from 'react';
import { afterLcpOrTimeout, scheduleIdleWork } from '../utils/deferUntilAfterLcp';
import type { Card } from './hero/types';

const LCP_STILL_SRC = '/images/davidhoang-web-config-still.webp';
const LCP_STILL_WIDTH = 600;
const LCP_STILL_HEIGHT = 338;

/** Mirror mobileHeroStack peek poses (first 4 cards) — duplicated to keep this island off hero-components. */
const SKELETON_STACK = [
  { x: 0, y: 0, rotation: 0, scale: 1 },
  { x: 20, y: 12, rotation: 2.5, scale: 0.97 },
  { x: -14, y: 24, rotation: -2, scale: 0.94 },
  { x: 10, y: 34, rotation: 1.5, scale: 0.91 },
] as const;

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
          {SKELETON_STACK.map((pose, i) => (
            <div
              key={i}
              className={
                i === 0
                  ? 'card-stack-hero-skeleton__card card-stack-hero-skeleton__card--lcp'
                  : 'card-stack-hero-skeleton__card'
              }
              style={{
                opacity: 0.4 + i * 0.1,
                transform: `translate(${pose.x}px, ${pose.y}px) rotate(${pose.rotation}deg) scale(${pose.scale})`,
                zIndex: SKELETON_STACK.length - i,
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
  cards?: Card[];
  /** Preloaded config still — painted in the skeleton fallback for LCP. */
  lcpImageSrc?: string;
}

export default function CardStackHeroLazy({
  aboutThumbnailSrc,
  cards,
  lcpImageSrc = LCP_STILL_SRC,
}: CardStackHeroLazyProps = {}) {
  const [CardStackHero, setCardStackHero] = useState<ComponentType<CardStackHeroLazyProps> | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    let cancelLcpWait: (() => void) | undefined;
    let cancelIdle: (() => void) | undefined;

    cancelLcpWait = afterLcpOrTimeout(
      () => {
        if (cancelled) return;
        cancelIdle = scheduleIdleWork(() => {
          if (cancelled) return;
          void import('./CardStackHero').then((mod) => {
            if (!cancelled) setCardStackHero(() => mod.default);
          });
        });
      },
      0,
      6000,
    );

    return () => {
      cancelled = true;
      cancelLcpWait?.();
      cancelIdle?.();
    };
  }, []);

  if (!CardStackHero) {
    return <CardStackHeroSkeleton lcpImageSrc={lcpImageSrc} />;
  }

  return (
    <CardStackHero
      aboutThumbnailSrc={aboutThumbnailSrc}
      cards={cards}
      lcpImageSrc={lcpImageSrc}
    />
  );
}
