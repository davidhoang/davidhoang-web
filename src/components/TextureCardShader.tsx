/**
 * Paper Design dithering surface tinted with the active theme. TextureCard
 * mounts it on hover / focus; generated writing covers mount it as an island.
 * @see https://shaders.paper.design/dithering
 */

import { useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import type {
  DitheringOverrides,
  TextureCardDitheringLayerProps,
} from '../shaders/lazy/TextureCardDitheringLayer';

interface Props {
  /** Dithering params that replace the TextureCard look */
  shader?: DitheringOverrides;
  /** Animation speed; reduced motion always renders a still frame */
  speed?: number;
}

const FILL: CSSProperties = { position: 'absolute', inset: 0 };

// Paper's dispose() drops the canvas but leaves the GL context for GC. Index
// pages mount and unmount many surfaces while scrolling, so release each
// context as its canvas unmounts to stay under the browser's live-context limit.
// Keep this at module scope: React re-runs a ref whose identity changes.
const releaseContextOnUnmount = (el: HTMLDivElement) => () => {
  el.querySelector('canvas')?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
};

export default function TextureCardShader({ shader, speed = 0.85 }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [eInk, setEInk] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [colors, setColors] = useState({ front: '#00b3ff', back: '#000000' });
  const [Layer, setLayer] = useState<ComponentType<TextureCardDitheringLayerProps> | null>(null);

  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setNearViewport(entry.isIntersecting), {
      rootMargin: '240px 0px',
    });
    io.observe(hostRef.current!);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(mq.matches);
    syncMotion();
    mq.addEventListener('change', syncMotion);

    const syncTheme = () => {
      const root = document.documentElement;
      const cs = getComputedStyle(root);
      setEInk(root.getAttribute('data-e-ink') === 'true');
      setColors({
        back: cs.getPropertyValue('--color-bg').trim() || '#ffffff',
        front: cs.getPropertyValue('--color-link').trim() || '#0066cc',
      });
    };

    syncTheme();
    const obs = new MutationObserver(syncTheme);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-e-ink'],
    });

    return () => {
      io.disconnect();
      mq.removeEventListener('change', syncMotion);
      obs.disconnect();
    };
  }, []);

  const shouldRender = nearViewport && !eInk;

  useEffect(() => {
    if (!shouldRender) {
      setLayer(null);
      return;
    }

    let cancelled = false;
    import('../shaders/lazy/TextureCardDitheringLayer').then((mod) => {
      if (!cancelled) setLayer(() => mod.default);
    });

    return () => {
      cancelled = true;
    };
  }, [shouldRender]);

  return (
    <div ref={hostRef} style={FILL}>
      {shouldRender && Layer && (
        <div ref={releaseContextOnUnmount} style={FILL}>
          <Layer colors={colors} speed={reducedMotion ? 0 : speed} shader={shader} />
        </div>
      )}
    </div>
  );
}
