import { useEffect, useState } from 'react';
import { shouldEnablePointerHoverMotion } from '../../utils/viewport-capabilities';

function readHoverMotionAttribute(): boolean | null {
  if (typeof document === 'undefined') return null;
  const value = document.documentElement.getAttribute('data-hover-motion');
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

/**
 * Whether hero cards should run JS hover lift / media activate.
 * Reads the pre-hydration `data-hover-motion` attribute when present, then
 * stays in sync with pointer capability media-query changes.
 */
export function usePointerHoverMotionEnabled(): boolean {
  const [enabled, setEnabled] = useState(() => {
    const fromDom = readHoverMotionAttribute();
    if (fromDom !== null) return fromDom;
    return shouldEnablePointerHoverMotion();
  });

  useEffect(() => {
    const sync = () => setEnabled(shouldEnablePointerHoverMotion());
    sync();

    const queries = [
      window.matchMedia('(hover: hover)'),
      window.matchMedia('(any-hover: hover)'),
      window.matchMedia('(any-pointer: coarse)'),
    ];
    for (const mql of queries) {
      mql.addEventListener('change', sync);
    }
    return () => {
      for (const mql of queries) {
        mql.removeEventListener('change', sync);
      }
    };
  }, []);

  return enabled;
}
