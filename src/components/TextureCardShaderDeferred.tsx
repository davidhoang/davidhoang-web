/**
 * Loads TextureCardShader (and paper-shaders) only after hover or keyboard focus
 * on the parent `.texture-card`. Resting cards keep CSS-only presentation — no CLS.
 */
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { shouldLoadTextureCardShaders } from '../utils/viewport-capabilities';

export default function TextureCardShaderDeferred() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [Shader, setShader] = useState<ComponentType | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const card = host.closest('.texture-card');
    if (!card) return;

    let cancelled = false;
    let loaded = false;

    const loadShader = () => {
      if (loaded || cancelled || !shouldLoadTextureCardShaders()) return;
      loaded = true;
      void import('./TextureCardShader').then((mod) => {
        if (!cancelled) setShader(() => mod.default);
      });
    };

    const onPointerEnter = () => {
      if (window.matchMedia('(hover: hover)').matches) {
        loadShader();
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      if (card.contains(event.target as Node)) {
        loadShader();
      }
    };

    card.addEventListener('pointerenter', onPointerEnter);
    card.addEventListener('focusin', onFocusIn);

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onPolicyChange = () => {
      if (!shouldLoadTextureCardShaders()) {
        cancelled = true;
        setShader(null);
      }
    };
    motionQuery.addEventListener('change', onPolicyChange);
    const themeObs = new MutationObserver(onPolicyChange);
    themeObs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-e-ink'],
    });

    return () => {
      cancelled = true;
      card.removeEventListener('pointerenter', onPointerEnter);
      card.removeEventListener('focusin', onFocusIn);
      motionQuery.removeEventListener('change', onPolicyChange);
      themeObs.disconnect();
    };
  }, []);

  return (
    <div ref={hostRef} aria-hidden="true" style={{ width: '100%', height: '100%' }}>
      {Shader ? <Shader /> : null}
    </div>
  );
}
