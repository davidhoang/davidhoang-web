/**
 * Paper Design dithering shader for TextureCard hover / focus surfaces.
 * @see https://shaders.paper.design/dithering
 */

import { useEffect, useState, type ComponentType } from 'react';
import type { TextureCardDitheringLayerProps } from '../shaders/lazy/TextureCardDitheringLayer';

export default function TextureCardShader() {
  const [mounted, setMounted] = useState(false);
  const [eInk, setEInk] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [colors, setColors] = useState({ front: '#00b3ff', back: '#000000' });
  const [Layer, setLayer] = useState<ComponentType<TextureCardDitheringLayerProps> | null>(null);

  useEffect(() => {
    setMounted(true);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(mq.matches);
    syncMotion();
    mq.addEventListener('change', syncMotion);

    const syncTheme = () => {
      const root = document.documentElement;
      setEInk(root.getAttribute('data-e-ink') === 'true');
      const bg = getComputedStyle(root).getPropertyValue('--color-bg').trim();
      const link = getComputedStyle(root).getPropertyValue('--color-link').trim();
      setColors({
        back: bg || '#ffffff',
        front: link || '#0066cc',
      });
    };

    syncTheme();
    const obs = new MutationObserver(syncTheme);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-e-ink'],
    });

    return () => {
      mq.removeEventListener('change', syncMotion);
      obs.disconnect();
    };
  }, []);

  const shouldRender = mounted && !eInk;

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

  if (!shouldRender || !Layer) {
    return null;
  }

  return <Layer colors={colors} reducedMotion={reducedMotion} />;
}
