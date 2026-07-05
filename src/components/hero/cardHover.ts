import type { MouseEvent } from 'react';

/** Ease-out curve aligned with design.md `--ease-emphasized`. */
export const HERO_HOVER_EASE = [0.22, 1, 0.36, 1] as const;

export const HERO_HOVER_TWEEN = {
  type: 'tween' as const,
  duration: 0.32,
  ease: HERO_HOVER_EASE,
};

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
  const related = e.relatedTarget as Node | null;
  if (wrapper && related && wrapper.contains(related)) return;
  onCardHover(null);
}
