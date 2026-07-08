import type { Transition } from 'framer-motion';
import { HERO_HOVER_EASE } from './cardHover';

export interface HeroDialValues {
  fan: {
    spread: number;
    yOffset: number;
    rotation: number;
  };
  wrapper: {
    width: number;
    height: number;
    marginTop: number;
  };
  card: {
    width: number;
    height: number;
    borderRadius: number;
  };
  hover: {
    liftY: number;
    scale: number;
    tapScale: number;
  };
  entrance: {
    initialScale: number;
    staggerDelay: number;
    stiffness: number;
    damping: number;
    settleStiffness: number;
    settleDamping: number;
  };
  expand: {
    stiffness: number;
    damping: number;
    mass: number;
  };
  hoverTween: Transition;
  dimmedOpacity: number;
  tilt: {
    enabled: boolean;
    amplitude: number;
    stiffness: number;
    damping: number;
    mass: number;
  };
}

export const heroDialDefaults: HeroDialValues = {
  fan: {
    spread: 400,
    yOffset: 28,
    rotation: 9,
  },
  wrapper: {
    width: 240,
    height: 340,
    marginTop: 20,
  },
  card: {
    width: 240,
    height: 320,
    borderRadius: 20,
  },
  hover: {
    liftY: 8,
    scale: 1.02,
    tapScale: 0.99,
  },
  entrance: {
    initialScale: 0.94,
    staggerDelay: 0.08,
    stiffness: 80,
    damping: 16,
    settleStiffness: 200,
    settleDamping: 28,
  },
  expand: {
    stiffness: 155,
    damping: 30,
    mass: 0.88,
  },
  hoverTween: {
    type: 'tween',
    duration: 0.32,
    ease: HERO_HOVER_EASE,
  },
  dimmedOpacity: 0.3,
  tilt: {
    enabled: false,
    amplitude: 9,
    stiffness: 220,
    damping: 22,
    mass: 0.6,
  },
};
