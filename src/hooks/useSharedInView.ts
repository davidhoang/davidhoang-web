import { useCallback, useEffect, useState, type RefCallback } from 'react';
import {
  observerKey,
  observerPool,
  type SharedObserverOptions,
} from '../utils/observerPool';

export type UseSharedInViewOptions = SharedObserverOptions & {
  /**
   * When false, skip observing and use `fallbackInView`.
   * Useful for prefers-reduced-motion paths that should stay visible.
   */
  enabled?: boolean;
  fallbackInView?: boolean;
};

/**
 * Shared-pool replacement for Framer Motion `useInView`.
 * `margin` is accepted as an alias for `rootMargin` (Framer's option name).
 */
export function useSharedInView<T extends Element = HTMLElement>(
  options: UseSharedInViewOptions & { margin?: string } = {},
): { ref: RefCallback<T | null>; isInView: boolean } {
  const {
    enabled = true,
    fallbackInView = false,
    margin,
    rootMargin = margin,
    once = false,
    root,
    threshold,
  } = options;

  const ioOptions: SharedObserverOptions = {
    root,
    rootMargin,
    threshold,
    once,
  };
  const key = `${enabled}|${observerKey(ioOptions)}|${once}`;

  const [node, setNode] = useState<T | null>(null);
  const [isInView, setIsInView] = useState(enabled ? false : fallbackInView);

  const ref = useCallback<RefCallback<T | null>>((el) => {
    setNode(el);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsInView(fallbackInView);
      return;
    }
    if (!node) return;

    setIsInView(false);
    return observerPool.observe(
      node,
      (entry) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        } else if (!once) {
          setIsInView(false);
        }
      },
      ioOptions,
    );
    // ioOptions fields are captured in `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, fallbackInView, key, node, once]);

  return { ref, isInView };
}
