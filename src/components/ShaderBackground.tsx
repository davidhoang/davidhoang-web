/**
 * Shader Background Component
 *
 * Uses Paper Design shaders for dynamic backgrounds.
 * Controlled by daily theme system via data-shader attribute.
 *
 * Shader layers load via dynamic import when a theme actually uses a shader;
 * the island mounts with client:idle so it stays off the LCP path.
 */

import { useEffect, useState, type ComponentType } from 'react';
import type { ShaderBackgroundLayersProps } from '../shaders/lazy/ShaderBackgroundLayers';

interface ShaderBackgroundProps {
  shader?: string;
  colors?: string[];
  speed?: number;
  opacity?: number;
}

export default function ShaderBackground({
  shader = 'none',
  colors = ['#5100ff', '#00ff80', '#ffcc00'],
  speed = 0.3,
  opacity = 0.15
}: ShaderBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  const [currentShader, setCurrentShader] = useState(shader);
  const [currentColors, setCurrentColors] = useState(colors);
  const [isEInkMode, setIsEInkMode] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [Layers, setLayers] = useState<ComponentType<ShaderBackgroundLayersProps> | null>(null);

  useEffect(() => {
    setMounted(true);

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotionPreference = () => setPrefersReducedMotion(motionQuery.matches);
    syncMotionPreference();
    motionQuery.addEventListener('change', syncMotionPreference);

    let observer: MutationObserver | null = null;

    const initObserver = () => {
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-shader') {
            const newShader = document.documentElement.getAttribute('data-shader') || 'none';
            setCurrentShader(newShader);
          }
          if (mutation.attributeName === 'data-shader-colors') {
            const colorsAttr = document.documentElement.getAttribute('data-shader-colors');
            if (colorsAttr) {
              try {
                setCurrentColors(JSON.parse(colorsAttr));
              } catch (e) {
                // Keep current colors
              }
            }
          }
          if (mutation.attributeName === 'data-e-ink') {
            const eInkMode = document.documentElement.getAttribute('data-e-ink') === 'true';
            setIsEInkMode(eInkMode);
          }
        });
      });

      observer.observe(document.documentElement, { attributes: true });
    };

    const initialShader = document.documentElement.getAttribute('data-shader');
    if (initialShader) setCurrentShader(initialShader);

    const initialColors = document.documentElement.getAttribute('data-shader-colors');
    if (initialColors) {
      try {
        setCurrentColors(JSON.parse(initialColors));
      } catch (e) {}
    }

    const initialEInk = document.documentElement.getAttribute('data-e-ink') === 'true';
    setIsEInkMode(initialEInk);

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(initObserver);
    } else {
      setTimeout(initObserver, 1);
    }

    return () => {
      motionQuery.removeEventListener('change', syncMotionPreference);
      observer?.disconnect();
    };
  }, []);

  const shouldRenderShader =
    mounted && currentShader !== 'none' && !isEInkMode && !prefersReducedMotion;

  useEffect(() => {
    if (!shouldRenderShader) {
      setLayers(null);
      return;
    }

    let cancelled = false;
    import('../shaders/lazy/ShaderBackgroundLayers').then((mod) => {
      if (!cancelled) setLayers(() => mod.default);
    });

    return () => {
      cancelled = true;
    };
  }, [shouldRenderShader, currentShader]);

  if (!shouldRenderShader || !Layers) {
    return null;
  }

  return (
    <Layers
      currentShader={currentShader}
      currentColors={currentColors}
      speed={speed}
      opacity={opacity}
    />
  );
}
