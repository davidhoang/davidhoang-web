/**
 * Paper Design dithering shader for TextureCard hover / focus surfaces.
 * @see https://shaders.paper.design/dithering
 */

import { useEffect, useState } from 'react';
import { loadPaperShaders } from '../utils/lazyPaperShaders';

type PaperShaders = Awaited<ReturnType<typeof loadPaperShaders>>;

export default function TextureCardShader() {
  const [mounted, setMounted] = useState(false);
  const [eInk, setEInk] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [colors, setColors] = useState({ front: '#00b3ff', back: '#000000' });
  const [paperShaders, setPaperShaders] = useState<PaperShaders | null>(null);

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
      setPaperShaders(null);
      return;
    }

    let cancelled = false;
    loadPaperShaders().then((mod) => {
      if (!cancelled) setPaperShaders(mod);
    });

    return () => {
      cancelled = true;
    };
  }, [shouldRender]);

  if (!shouldRender || !paperShaders) {
    return null;
  }

  const Dithering = paperShaders.Dithering as any;

  return (
    <Dithering
      style={{ width: '100%', height: '100%', display: 'block' }}
      colorBack={colors.back}
      colorFront={colors.front}
      shape="sphere"
      type="4x4"
      size={2}
      scale={0.6}
      speed={reducedMotion ? 0 : 0.85}
      fit="cover"
    />
  );
}
