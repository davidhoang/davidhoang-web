import { useCallback, useRef } from 'react';
import { useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'framer-motion';

interface MagneticTiltOptions {
  /** Max tilt amplitude in degrees. Default 9. */
  amplitude?: number;
  /** Spring config for the tilt motion. */
  spring?: { stiffness?: number; damping?: number; mass?: number };
  /** When true, the tilt is suppressed (e.g. card is in expanded state). */
  disabled?: boolean;
}

interface MagneticTiltApi {
  rotateX: MotionValue<number> | number;
  rotateY: MotionValue<number> | number;
  onMouseMove: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave: () => void;
  /** Manually reset the tilt to flat (e.g. before a layout transition). */
  reset: () => void;
  /** True when tilt is suppressed (reduced motion or disabled). */
  isFlat: boolean;
}

/**
 * Cursor-driven 3D tilt on hover, smoothed by springs. Honors prefers-reduced-motion.
 * Wire returned `rotateX`/`rotateY` into a motion element's `style`, and the handlers onto the element.
 *
 * Performance: caches getBoundingClientRect per mouseEnter (not per mouseMove)
 * and throttles updates to one per animation frame to prevent layout thrashing
 * on high-frequency input devices (iPad trackpad reports at ~240Hz).
 */
export function useMagneticTilt({
  amplitude = 9,
  spring = {},
  disabled = false,
}: MagneticTiltOptions = {}): MagneticTiltApi {
  const prefersReducedMotion = useReducedMotion();
  const { stiffness = 220, damping = 22, mass = 0.6 } = spring;

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness, damping, mass });
  const springY = useSpring(pointerY, { stiffness, damping, mass });
  const tiltX = useTransform(springY, [-0.5, 0.5], [amplitude, -amplitude]);
  const tiltY = useTransform(springX, [-0.5, 0.5], [-amplitude, amplitude]);

  const isFlat = Boolean(prefersReducedMotion || disabled);

  // Cache rect on enter — avoids getBoundingClientRect() on every mouseMove
  const rectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef(0);

  const reset = useCallback(() => {
    pointerX.set(0);
    pointerY.set(0);
    rectRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, [pointerX, pointerY]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (isFlat) return;
    // Cache rect on first move (mouseEnter may not fire before mouseMove on some devices)
    if (!rectRef.current) {
      rectRef.current = e.currentTarget.getBoundingClientRect();
    }
    const clientX = e.clientX;
    const clientY = e.clientY;
    // Throttle to one update per frame
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        const rect = rectRef.current!;
        pointerX.set((clientX - rect.left) / rect.width - 0.5);
        pointerY.set((clientY - rect.top) / rect.height - 0.5);
        rafRef.current = 0;
      });
    }
  }, [isFlat, pointerX, pointerY]);

  return {
    rotateX: isFlat ? 0 : tiltX,
    rotateY: isFlat ? 0 : tiltY,
    isFlat,
    reset,
    onMouseMove,
    onMouseLeave: reset,
  };
}
