import { useCallback, useEffect, useState, type FocusEvent, type MouseEvent, type PointerEvent } from 'react';
import type { Transition } from 'framer-motion';
import { handleCardHoverLeave } from './cardHover';

/**
 * Visual phases for home hero cards. All transform/opacity motion is driven from
 * `animate` targets derived from this phase — never from whileHover/whileTap.
 *
 * Priority (highest wins): selected → dimmed → pressed → focused → rest → entering
 */
export type HeroCardPhase =
  | 'entering'
  | 'rest'
  | 'focused'
  | 'pressed'
  | 'selected'
  | 'dimmed';

/** Soft, well-damped spring for rest ↔ focus ↔ dim ↔ selected. Minimal overshoot. */
export const HERO_INTERACTION_SPRING = {
  type: 'spring' as const,
  stiffness: 340,
  damping: 34,
  mass: 0.9,
};

/** Snappier spring for press-in so click feedback feels immediate without bouncing. */
export const HERO_PRESS_SPRING = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 38,
  mass: 0.75,
};

export function resolveHeroCardPhase(options: {
  isLoaded: boolean;
  isSelected: boolean;
  isOtherSelected: boolean;
  isFocused: boolean;
  isPressed: boolean;
}): HeroCardPhase {
  const { isLoaded, isSelected, isOtherSelected, isFocused, isPressed } = options;
  if (!isLoaded) return 'entering';
  if (isSelected) return 'selected';
  if (isOtherSelected) return 'dimmed';
  if (isPressed) return 'pressed';
  if (isFocused) return 'focused';
  return 'rest';
}

/**
 * Merge rest pose with phase modifiers. Press builds on the focused pose when focused,
 * so click never snaps through an idle rest frame.
 */
export function applyHeroCardPhaseMotion<T extends Record<string, number>>(
  phase: HeroCardPhase,
  rest: T,
  mods: {
    focused?: Partial<T>;
    pressed?: Partial<T>;
    selected?: Partial<T>;
    dimmed?: Partial<T>;
  } = {}
): T {
  switch (phase) {
    case 'selected':
      return { ...rest, ...mods.selected };
    case 'dimmed':
      return { ...rest, ...mods.dimmed };
    case 'pressed':
      return { ...rest, ...mods.focused, ...mods.pressed };
    case 'focused':
      return { ...rest, ...mods.focused };
    case 'entering':
    case 'rest':
    default:
      return rest;
  }
}

export function heroCardInteractionTransition(options: {
  hasAnimatedIn: boolean;
  phase: HeroCardPhase;
  index: number;
  isLoaded: boolean;
  entrance: {
    stiffness: number;
    damping: number;
    staggerDelay: number;
  };
}): Transition {
  const { hasAnimatedIn, phase, index, isLoaded, entrance } = options;

  if (!hasAnimatedIn) {
    return {
      type: 'spring',
      stiffness: entrance.stiffness,
      damping: entrance.damping,
      delay: isLoaded ? index * entrance.staggerDelay : 0,
    };
  }

  if (phase === 'pressed') {
    return HERO_PRESS_SPRING;
  }

  return HERO_INTERACTION_SPRING;
}

interface UseHeroCardInteractionOptions {
  cardId: string;
  selectedCard: string | null;
  hoveredCard: string | null;
  isLoaded: boolean;
  /**
   * Suppress all focus/hover lift including keyboard (e.g. mobile stack, reduced motion).
   * Do **not** fold hybrid/pointer gating into this — use `pointerHoverDisabled` instead
   * so Tab focus still lifts/activates media on iPad + Magic Keyboard.
   */
  hoverDisabled?: boolean;
  /**
   * Suppress pointer hover (`mouseenter` / `hoveredCard`) only — hybrid devices,
   * `(hover: none)`. Keyboard focus lift remains enabled unless `hoverDisabled`.
   */
  pointerHoverDisabled?: boolean;
  onCardHover: (cardId: string | null) => void;
  onTiltReset?: () => void;
}

/** Pure focus resolver — pointer hover and keyboard focus are independently gated. */
export function resolveHeroCardFocus(options: {
  hoverDisabled: boolean;
  pointerHoverDisabled: boolean;
  isOtherSelected: boolean;
  isHovered: boolean;
  isKeyboardFocused: boolean;
}): boolean {
  const {
    hoverDisabled,
    pointerHoverDisabled,
    isOtherSelected,
    isHovered,
    isKeyboardFocused,
  } = options;
  if (hoverDisabled || isOtherSelected) return false;
  if (isKeyboardFocused) return true;
  if (!pointerHoverDisabled && isHovered) return true;
  return false;
}

/**
 * Local press + keyboard focus state, combined with shared hover/selection props
 * into a single motion phase. Pointer-up does not release press until leave/cancel
 * or selection so click never animates through a rest frame mid-gesture.
 */
export function useHeroCardInteraction({
  cardId,
  selectedCard,
  hoveredCard,
  isLoaded,
  hoverDisabled = false,
  pointerHoverDisabled = false,
  onCardHover,
  onTiltReset,
}: UseHeroCardInteractionOptions) {
  const [isPressed, setIsPressed] = useState(false);
  const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);

  const isSelected = selectedCard === cardId;
  const isOtherSelected = selectedCard !== null && !isSelected;
  const isFocused = resolveHeroCardFocus({
    hoverDisabled,
    pointerHoverDisabled,
    isOtherSelected,
    isHovered: hoveredCard === cardId,
    isKeyboardFocused,
  });

  useEffect(() => {
    if (isSelected || hoverDisabled) {
      setIsPressed(false);
    }
  }, [isSelected, hoverDisabled]);

  const phase = resolveHeroCardPhase({
    isLoaded,
    isSelected,
    isOtherSelected,
    isFocused,
    isPressed: isPressed && !isSelected && !isOtherSelected,
  });

  const onMouseEnter = useCallback(() => {
    if (!selectedCard && !hoverDisabled && !pointerHoverDisabled) {
      onCardHover(cardId);
    }
  }, [selectedCard, hoverDisabled, pointerHoverDisabled, onCardHover, cardId]);

  const onMouseLeave = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      setIsPressed(false);
      handleCardHoverLeave(e, onCardHover, onTiltReset);
    },
    [onCardHover, onTiltReset]
  );

  const onPointerDown = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (e.button !== 0 || isSelected || isOtherSelected) return;
      setIsPressed(true);
    },
    [isSelected, isOtherSelected]
  );

  const onPointerCancel = useCallback(() => {
    setIsPressed(false);
  }, []);

  const onFocus = useCallback(() => {
    // Keyboard focus is independent of pointer-hover gating (iPad + Magic Keyboard).
    if (!hoverDisabled && !isOtherSelected) {
      setIsKeyboardFocused(true);
    }
  }, [hoverDisabled, isOtherSelected]);

  const onBlur = useCallback((_e: FocusEvent<HTMLElement>) => {
    setIsKeyboardFocused(false);
  }, []);

  const clearPress = useCallback(() => {
    setIsPressed(false);
  }, []);

  return {
    phase,
    isPressed,
    isFocused,
    isSelected,
    isOtherSelected,
    clearPress,
    pointerHandlers: {
      onMouseEnter,
      onMouseLeave,
      onPointerDown,
      onPointerCancel,
      onFocus,
      onBlur,
    },
  };
}
