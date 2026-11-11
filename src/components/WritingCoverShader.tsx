/**
 * Generated cover for writing posts that have no image of their own.
 * Renders a Paper dithering shader seeded by the post slug and tinted with the
 * active theme tokens. The host element's CSS background is the fallback for
 * e-ink, no WebGL, and the moments before the shader chunk loads.
 */

import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { blendColors, colorToHex } from './hero/themeCardColors';
import { getWritingCoverArt } from '../utils/writingCoverArt';
import type { WritingCoverShaderLayerProps } from '../shaders/lazy/WritingCoverShaderLayer';

interface Props {
  /** Stable per-post seed (the post slug) */
  seed: string;
  /** Slow drift for large heroes; index thumbnails stay still */
  animated?: boolean;
}

interface CoverEnvironment {
  eInk: boolean;
  reducedMotion: boolean;
  colors: { front: string; back: string };
}

const ANIMATED_SPEED = 0.16;

function readEnvironment(reducedMotion: boolean): CoverEnvironment {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const isDark = root.getAttribute('data-theme') === 'dark';
  const bg = colorToHex(cs.getPropertyValue('--color-bg'), isDark ? '#111111' : '#ffffff');
  const link = colorToHex(cs.getPropertyValue('--color-link'), isDark ? '#8bb8ff' : '#333333');
  return {
    eInk: root.getAttribute('data-e-ink') === 'true',
    reducedMotion,
    colors: {
      back: blendColors(bg, link, 0.06),
      front: blendColors(bg, link, 0.82),
    },
  };
}

export default function WritingCoverShader({ seed, animated = false }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [env, setEnv] = useState<CoverEnvironment | null>(null);
  const [Layer, setLayer] = useState<ComponentType<WritingCoverShaderLayerProps> | null>(null);
  const art = useMemo(() => getWritingCoverArt(seed), [seed]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const io = new IntersectionObserver(
      ([entry]) => setNearViewport(entry.isIntersecting),
      { rootMargin: '240px 0px' },
    );
    io.observe(host);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setEnv(readEnvironment(mq.matches));
    sync();
    mq.addEventListener('change', sync);
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-e-ink', 'data-daily-theme', 'style', 'class'],
    });
    return () => {
      mq.removeEventListener('change', sync);
      obs.disconnect();
    };
  }, []);

  const shouldRender = nearViewport && env !== null && !env.eInk;

  useEffect(() => {
    if (!shouldRender || Layer) return;
    let cancelled = false;
    import('../shaders/lazy/WritingCoverShaderLayer').then((mod) => {
      if (!cancelled) setLayer(() => mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, [shouldRender, Layer]);

  return (
    <div ref={hostRef} className="writing-cover-shader">
      {shouldRender && Layer && env && (
        <Layer
          art={art}
          colors={env.colors}
          speed={animated && !env.reducedMotion ? ANIMATED_SPEED : 0}
        />
      )}
    </div>
  );
}
