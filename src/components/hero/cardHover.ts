import type { MouseEvent } from 'react';

/**
 * Ease-out curve aligned with design.md `--ease-emphasized`.
 * Kept for DialKit / non-transform fades. Hero card transforms use
 * `HERO_INTERACTION_SPRING` in `heroCardInteraction.ts` instead.
 */
export const HERO_HOVER_EASE = [0.22, 1, 0.36, 1] as const;

export const HERO_HOVER_TWEEN = {
  type: 'tween' as const,
  duration: 0.32,
  ease: HERO_HOVER_EASE,
};

/** Absorbs Safari/iPad null `relatedTarget` and edge thrash before clearing hover. */
export const HERO_HOVER_CLEAR_DELAY_MS = 120;

/**
 * True when the pointer is still inside the card fan after a leave event.
 * Safari/iPadOS often nulls `relatedTarget` when moving between overlapping cards.
 */
export function isPointerInsideCardsWrapper(
  wrapper: Element,
  related: EventTarget | null,
  clientX: number,
  clientY: number
): boolean {
  if (related instanceof Node && wrapper.contains(related)) return true;

  // relatedTarget is frequently null on iPad + Magic Keyboard trackpad.
  if (!related && typeof document !== 'undefined') {
    const under = document.elementFromPoint(clientX, clientY);
    if (under && wrapper.contains(under)) return true;
  }

  return false;
}

/**
 * Only clear hover when the pointer leaves the card fan — not when moving between cards.
 * Prevents hero media and lift motion from flickering through an idle frame on iPad/trackpad.
 */
export function handleCardHoverLeave(
  e: MouseEvent<HTMLElement>,
  onCardHover: (cardId: string | null) => void,
  onReset?: () => void
) {
  onReset?.();
  const wrapper = e.currentTarget.closest('.cards-wrapper');
  if (!wrapper) {
    onCardHover(null);
    return;
  }
  if (isPointerInsideCardsWrapper(wrapper, e.relatedTarget, e.clientX, e.clientY)) return;
  onCardHover(null);
}

/**
 * Stable hover setter: immediate assign on enter, delayed clear on leave.
 * Pair with `handleCardHoverLeave` so sibling hops never flash an idle frame.
 */
export function createStableCardHoverSetter(
  setHoveredCard: (cardId: string | null) => void,
  clearDelayMs: number = HERO_HOVER_CLEAR_DELAY_MS
): {
  onCardHover: (cardId: string | null) => void;
  cancelPendingClear: () => void;
} {
  let clearTimer: ReturnType<typeof setTimeout> | null = null;

  const cancelPendingClear = () => {
    if (clearTimer !== null) {
      clearTimeout(clearTimer);
      clearTimer = null;
    }
  };

  const onCardHover = (cardId: string | null) => {
    cancelPendingClear();
    if (cardId === null) {
      clearTimer = setTimeout(() => {
        clearTimer = null;
        setHoveredCard(null);
      }, clearDelayMs);
      return;
    }
    setHoveredCard(cardId);
  };

  return { onCardHover, cancelPendingClear };
}
