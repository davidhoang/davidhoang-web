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

  const reset = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return {
    rotateX: isFlat ? 0 : tiltX,
    rotateY: isFlat ? 0 : tiltY,
    isFlat,
    reset,
    onMouseMove: (e) => {
      if (isFlat) return;
      const rect = e.currentTarget.getBoundingClientRect();
      pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
      pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    onMouseLeave: reset,
  };
}
