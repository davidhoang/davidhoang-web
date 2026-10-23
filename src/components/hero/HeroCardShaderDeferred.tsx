import { useEffect, useRef, useState, type ComponentType } from 'react';
import { shouldLoadHeroCardShaders } from '../../utils/viewport-capabilities';
import type { Card } from './types';

type HeroCardShaderPatternProps = {
  cardId: string;
  pattern: Card['pattern'];
  color: string;
};

function scheduleIdleWork(work: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const win = window as Window & {
    requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (win.requestIdleCallback) {
    const id = win.requestIdleCallback(work, { timeout: 2500 });
    return () => win.cancelIdleCallback?.(id);
  }
  const id = globalThis.setTimeout(work, 1);
  return () => globalThis.clearTimeout(id);
}

/**
 * Defers HeroCardShaderPattern + paper-shaders until the card surface is near
 * the viewport and the main thread is idle. `.card-pattern` keeps `card.color`
 * visible until the shader mounts (no CLS).
 */
export function HeroCardShaderDeferred({ cardId, pattern, color }: HeroCardShaderPatternProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [Pattern, setPattern] = useState<ComponentType<HeroCardShaderPatternProps> | null>(null);

  useEffect(() => {
    if (pattern === 'none') return;

    let cancelled = false;
    let cancelIdle: (() => void) | undefined;
    let observer: IntersectionObserver | undefined;

    const tryLoad = () => {
      if (cancelled || !shouldLoadHeroCardShaders()) return;
      cancelIdle = scheduleIdleWork(() => {
        if (cancelled || !shouldLoadHeroCardShaders()) return;
        void import('./HeroCardShaderPattern').then((mod) => {
          if (!cancelled) setPattern(() => mod.HeroCardShaderPattern);
        });
      });
    };

    const host = hostRef.current;
    if (!host) return;

    const onIntersect: IntersectionObserverCallback = (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer?.disconnect();
      observer = undefined;
      requestAnimationFrame(() => {
        requestAnimationFrame(tryLoad);
      });
    };

    if (typeof IntersectionObserver === 'undefined') {
      tryLoad();
    } else {
      observer = new IntersectionObserver(onIntersect, { rootMargin: '120px', threshold: 0 });
      observer.observe(host);
    }

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = () => {
      if (!shouldLoadHeroCardShaders()) {
        cancelled = true;
        cancelIdle?.();
        setPattern(null);
      }
    };
    motionQuery.addEventListener('change', onMotionChange);

    const themeObs = new MutationObserver(onMotionChange);
    themeObs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-e-ink'],
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      cancelIdle?.();
      motionQuery.removeEventListener('change', onMotionChange);
      themeObs.disconnect();
    };
  }, [cardId, pattern, color]);

  if (pattern === 'none') return null;

  return (
    <div
      ref={hostRef}
      className="hero-card-shader-deferred-host"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      aria-hidden
    >
      {Pattern ? <Pattern cardId={cardId} pattern={pattern} color={color} /> : null}
    </div>
  );
}
