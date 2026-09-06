/**
 * Paper Design shader artwork for /projects gallery tiles.
 * Colors derive from the active daily theme so tiles stay native to the palette.
 * @see https://shaders.paper.design
 */

import { useEffect, useState } from 'react';
import { Dithering, MeshGradient } from '@paper-design/shaders-react';
import type { ProjectShaderVariant } from '../data/projects';
import { adjustColorHue, blendColors, mixColorTowardWhite } from './hero/themeCardColors';

const MAX_PIXELS = 900 * 700;

interface Props {
  variant: ProjectShaderVariant;
}

export default function ProjectTileShader({ variant }: Props) {
  const [mounted, setMounted] = useState(false);
  const [eInk, setEInk] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [accent, setAccent] = useState('#0066cc');
  const [bg, setBg] = useState('#ffffff');

  useEffect(() => {
    setMounted(true);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(mq.matches);
    syncMotion();
    mq.addEventListener('change', syncMotion);

    const syncTheme = () => {
      const root = document.documentElement;
      setEInk(root.getAttribute('data-e-ink') === 'true');
      const styles = getComputedStyle(root);
      setAccent(styles.getPropertyValue('--color-link').trim() || '#0066cc');
      setBg(styles.getPropertyValue('--color-bg').trim() || '#ffffff');
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

  if (!mounted || eInk) {
    return null;
  }

  const base = {
    style: { width: '100%', height: '100%', display: 'block' },
    maxPixelCount: MAX_PIXELS,
    minPixelRatio: 1,
    fit: 'cover' as const,
  };
  const speed = reducedMotion ? 0 : 1;

  if (variant === 'weave') {
    return (
      <Dithering
        {...base}
        colorBack={blendColors(bg, accent, 0.08)}
        colorFront={accent}
        shape="wave"
        type="8x8"
        size={2.4}
        scale={1.15}
        speed={0.34 * speed}
      />
    );
  }

  return (
    <MeshGradient
      {...base}
      colors={[
        blendColors(accent, bg, 0.28),
        accent,
        adjustColorHue(accent, 132),
        mixColorTowardWhite(accent, 0.7),
        blendColors(bg, accent, 0.1),
      ]}
      distortion={1}
      swirl={0.62}
      grainMixer={0.26}
      grainOverlay={0.12}
      scale={1.05}
      speed={0.44 * speed}
    />
  );
}
