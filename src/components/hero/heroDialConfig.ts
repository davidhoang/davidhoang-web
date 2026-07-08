import type { DialConfig, EasingConfig } from 'dialkit';
import { HERO_HOVER_EASE } from './cardHover';
import type { HeroDialValues } from './heroDialDefaults';

const hoverTween: EasingConfig = {
  type: 'easing',
  duration: 0.32,
  ease: [...HERO_HOVER_EASE],
};

/** DialKit panel config for home hero cards across all layouts. */
export const heroDialConfig: DialConfig = {
  card: {
    width: [240, 180, 360],
    height: [320, 240, 440],
    borderRadius: [20, 8, 32],
  },
  hoverTween,
  tilt: {
    _collapsed: true,
    enabled: false,
    amplitude: [9, 0, 24],
    stiffness: [220, 50, 500],
    damping: [22, 5, 50],
    mass: [0.6, 0.1, 2],
  },
  stackedFan: {
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
    dimmedOpacity: [0.3, 0, 1],
  },
  editorial: {
    _collapsed: true,
    initialX: [40, 0, 120],
    initialScale: [0.96, 0.8, 1],
    selectedScale: [1.02, 1, 1.15],
    hoverX: [8, 0, 32],
    tapScale: [0.98, 0.9, 1],
    staggerDelay: [0.06, 0, 0.2],
    stiffness: [120, 20, 400],
    damping: [14, 5, 50],
    settleStiffness: [300, 50, 600],
    settleDamping: [20, 5, 50],
    dimmedOpacity: [0.3, 0, 1],
    perspective: [1000, 400, 2000],
  },
  scattered: {
    _collapsed: true,
    spreadX: [800, 400, 1200],
    spreadY: [240, 80, 400],
    maxRotation: [15, 0, 30],
    initialScale: [0.92, 0.8, 1],
    selectedLiftY: [-40, -120, 0],
    selectedScale: [1.15, 1, 1.4],
    hoverScale: [1.06, 1, 1.2],
    tapScale: [0.95, 0.85, 1],
    staggerDelay: [0.1, 0, 0.25],
    stiffness: [80, 20, 300],
    damping: [12, 5, 50],
    settleStiffness: [200, 50, 500],
    settleDamping: [20, 5, 50],
    dimmedOpacity: [0.2, 0, 1],
    perspective: [1000, 400, 2000],
  },
  rolodex: {
    _collapsed: true,
    radius: [320, 160, 520],
    translateXFactor: [0.6, 0, 1.2],
    rotateYFactor: [0.3, 0, 1],
    selectedLiftY: [-60, -160, 0],
    selectedScale: [1.1, 1, 1.3],
    frontScale: [1, 0.8, 1.2],
    adjacentScale: [0.85, 0.6, 1],
    backScale: [0.7, 0.4, 1],
    frontOpacity: [1, 0.4, 1],
    adjacentOpacity: [0.7, 0.2, 1],
    backOpacity: [0.4, 0.1, 1],
    hoverScale: [1.03, 1, 1.15],
    hoverLiftY: [-8, -32, 0],
    tapScale: [0.98, 0.9, 1],
    initialScale: [0.92, 0.8, 1],
    staggerDelay: [0.08, 0, 0.2],
    stiffness: [100, 20, 400],
    damping: [15, 5, 50],
    settleStiffness: [200, 50, 500],
    settleDamping: [25, 5, 50],
    dimmedOpacity: [0.2, 0, 1],
  },
  cinematic: {
    _collapsed: true,
    featuredInitialScale: [0.96, 0.8, 1],
    layoutStiffness: [220, 50, 500],
    layoutDamping: [26, 5, 50],
    featuredScaleStiffness: [180, 50, 500],
    featuredScaleDamping: [24, 5, 50],
    filmstripInitialX: [24, 0, 80],
    filmstripInitialScale: [0.96, 0.8, 1],
    filmstripHoverScale: [1.04, 1, 1.2],
    filmstripHoverX: [-4, -24, 8],
    filmstripTapScale: [0.97, 0.9, 1],
    staggerDelay: [0.06, 0, 0.2],
    stiffness: [100, 20, 400],
    damping: [14, 5, 50],
    settleStiffness: [260, 50, 600],
    settleDamping: [22, 5, 50],
    dimmedOpacity: [0.3, 0, 1],
    featuredPerspective: [1200, 400, 2400],
    filmstripPerspective: [800, 300, 1600],
  },
  replayEntrance: { type: 'action', label: 'Replay entrance' },
};

export interface HeroDialParams {
  card: { width: number; height: number; borderRadius: number };
  hoverTween: EasingConfig;
  tilt: {
    enabled: boolean;
    amplitude: number;
    stiffness: number;
    damping: number;
    mass: number;
  };
  stackedFan: {
    fan: { spread: number; yOffset: number; rotation: number };
    wrapper: { width: number; height: number; marginTop: number };
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
    dimmedOpacity: number;
  };
  editorial: HeroDialValues['editorial'];
  scattered: HeroDialValues['scattered'];
  rolodex: HeroDialValues['rolodex'];
  cinematic: HeroDialValues['cinematic'];
}
