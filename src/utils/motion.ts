import type { Transition } from 'framer-motion';

/** JS counterparts to variables.css: seconds, with the same named easing curves. */
export const motionTiming = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  slower: 0.4,
  emphasized: [0.22, 1, 0.36, 1] as const,
};

export const motionPresets = {
  reveal: { duration: motionTiming.slow, ease: motionTiming.emphasized },
  interaction: { type: 'spring', stiffness: 340, damping: 34, mass: 0.9 },
  press: { type: 'spring', stiffness: 500, damping: 38, mass: 0.75 },
} satisfies Record<string, Transition>;

/** Keep long grids from making their last item wait for a long entrance cascade. */
export function revealStagger(itemCount: number): number {
  return Math.min(0.06, 0.18 / Math.max(1, itemCount - 1));
}
