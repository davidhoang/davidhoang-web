import type { DialConfig, EasingConfig } from 'dialkit';
import { HERO_HOVER_EASE } from './cardHover';

const hoverTween: EasingConfig = {
  type: 'easing',
  duration: 0.32,
  ease: [...HERO_HOVER_EASE],
};

/** DialKit panel config for home hero cards (stacked-fan). */
export const heroDialConfig: DialConfig = {
  fan: {
    spread: [400, 200, 600],
    yOffset: [28, 0, 60],
    rotation: [9, 0, 15],
  },
  wrapper: {
    _collapsed: true,
    width: [240, 180, 360],
    height: [340, 260, 480],
    marginTop: [20, 0, 80],
  },
  card: {
    width: [240, 180, 360],
    height: [320, 240, 440],
    borderRadius: [20, 8, 32],
  },
  hover: {
    liftY: [8, 0, 32],
    scale: [1.02, 1, 1.12],
    tapScale: [0.99, 0.9, 1],
  },
  entrance: {
    _collapsed: true,
    initialScale: [0.94, 0.8, 1],
    staggerDelay: [0.08, 0, 0.2],
    stiffness: [80, 20, 300],
    damping: [16, 5, 50],
    settleStiffness: [200, 50, 500],
    settleDamping: [28, 5, 50],
  },
  expand: {
    _collapsed: true,
    spring: {
      type: 'spring',
      stiffness: 155,
      damping: 30,
      mass: 0.88,
    },
  },
  hoverTween,
  dimmedOpacity: [0.3, 0, 1],
  tilt: {
    _collapsed: true,
    enabled: false,
    amplitude: [9, 0, 24],
    stiffness: [220, 50, 500],
    damping: [22, 5, 50],
    mass: [0.6, 0.1, 2],
  },
  replayEntrance: { type: 'action', label: 'Replay entrance' },
};

export interface HeroDialParams {
  fan: { spread: number; yOffset: number; rotation: number };
  wrapper: { width: number; height: number; marginTop: number };
  card: { width: number; height: number; borderRadius: number };
  hover: { liftY: number; scale: number; tapScale: number };
  entrance: {
    initialScale: number;
    staggerDelay: number;
    stiffness: number;
    damping: number;
    settleStiffness: number;
    settleDamping: number;
  };
  expand: { spring: { stiffness?: number; damping?: number; mass?: number } };
  hoverTween: EasingConfig;
  dimmedOpacity: number;
  tilt: {
    enabled: boolean;
    amplitude: number;
    stiffness: number;
    damping: number;
    mass: number;
  };
}
