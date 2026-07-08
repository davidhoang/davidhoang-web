import type { Transition } from 'framer-motion';
import { HERO_HOVER_EASE } from './cardHover';

export interface HeroDialValues {
  card: {
    width: number;
    height: number;
    borderRadius: number;
  };
  hoverTween: Transition;
  tilt: {
    enabled: boolean;
    amplitude: number;
    stiffness: number;
    damping: number;
    mass: number;
  };
  stackedFan: {
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
    dimmedOpacity: number;
  };
  editorial: {
    initialX: number;
    initialScale: number;
    selectedScale: number;
    hoverX: number;
    tapScale: number;
    staggerDelay: number;
    stiffness: number;
    damping: number;
    settleStiffness: number;
    settleDamping: number;
    dimmedOpacity: number;
    perspective: number;
  };
  scattered: {
    spreadX: number;
    spreadY: number;
    maxRotation: number;
    initialScale: number;
    selectedLiftY: number;
    selectedScale: number;
    hoverScale: number;
    tapScale: number;
    staggerDelay: number;
    stiffness: number;
    damping: number;
    settleStiffness: number;
    settleDamping: number;
    dimmedOpacity: number;
    perspective: number;
  };
  rolodex: {
    radius: number;
    translateXFactor: number;
    rotateYFactor: number;
    selectedLiftY: number;
    selectedScale: number;
    frontScale: number;
    adjacentScale: number;
    backScale: number;
    frontOpacity: number;
    adjacentOpacity: number;
    backOpacity: number;
    hoverScale: number;
    hoverLiftY: number;
    tapScale: number;
    initialScale: number;
    staggerDelay: number;
    stiffness: number;
    damping: number;
    settleStiffness: number;
    settleDamping: number;
    dimmedOpacity: number;
  };
  cinematic: {
    featuredInitialScale: number;
    layoutStiffness: number;
    layoutDamping: number;
    featuredScaleStiffness: number;
    featuredScaleDamping: number;
    filmstripInitialX: number;
    filmstripInitialScale: number;
    filmstripHoverScale: number;
    filmstripHoverX: number;
    filmstripTapScale: number;
    staggerDelay: number;
    stiffness: number;
    damping: number;
    settleStiffness: number;
    settleDamping: number;
    dimmedOpacity: number;
    featuredPerspective: number;
    filmstripPerspective: number;
  };
}

export const heroDialDefaults: HeroDialValues = {
  card: {
    width: 240,
    height: 320,
    borderRadius: 20,
  },
  hoverTween: {
    type: 'tween',
    duration: 0.32,
    ease: HERO_HOVER_EASE,
  },
  tilt: {
    enabled: false,
    amplitude: 9,
    stiffness: 220,
    damping: 22,
    mass: 0.6,
  },
  stackedFan: {
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
    dimmedOpacity: 0.3,
  },
  editorial: {
    initialX: 40,
    initialScale: 0.96,
    selectedScale: 1.02,
    hoverX: 8,
    tapScale: 0.98,
    staggerDelay: 0.06,
    stiffness: 120,
    damping: 14,
    settleStiffness: 300,
    settleDamping: 20,
    dimmedOpacity: 0.3,
    perspective: 1000,
  },
  scattered: {
    spreadX: 800,
    spreadY: 240,
    maxRotation: 15,
    initialScale: 0.92,
    selectedLiftY: -40,
    selectedScale: 1.15,
    hoverScale: 1.06,
    tapScale: 0.95,
    staggerDelay: 0.1,
    stiffness: 80,
    damping: 12,
    settleStiffness: 200,
    settleDamping: 20,
    dimmedOpacity: 0.2,
    perspective: 1000,
  },
  rolodex: {
    radius: 320,
    translateXFactor: 0.6,
    rotateYFactor: 0.3,
    selectedLiftY: -60,
    selectedScale: 1.1,
    frontScale: 1,
    adjacentScale: 0.85,
    backScale: 0.7,
    frontOpacity: 1,
    adjacentOpacity: 0.7,
    backOpacity: 0.4,
    hoverScale: 1.03,
    hoverLiftY: -8,
    tapScale: 0.98,
    initialScale: 0.92,
    staggerDelay: 0.08,
    stiffness: 100,
    damping: 15,
    settleStiffness: 200,
    settleDamping: 25,
    dimmedOpacity: 0.2,
  },
  cinematic: {
    featuredInitialScale: 0.96,
    layoutStiffness: 220,
    layoutDamping: 26,
    featuredScaleStiffness: 180,
    featuredScaleDamping: 24,
    filmstripInitialX: 24,
    filmstripInitialScale: 0.96,
    filmstripHoverScale: 1.04,
    filmstripHoverX: -4,
    filmstripTapScale: 0.97,
    staggerDelay: 0.06,
    stiffness: 100,
    damping: 14,
    settleStiffness: 260,
    settleDamping: 22,
    dimmedOpacity: 0.3,
    featuredPerspective: 1200,
    filmstripPerspective: 800,
  },
};
