/** Mobile stacked-fan: one prominent card with a few peeking behind (≤768px). */

export interface MobileStackOffset {
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

/** Peek offsets by distance from the active (front) card — index 0 is front. */
export const MOBILE_STACK_OFFSETS: readonly MobileStackOffset[] = [
  { x: 0, y: 0, rotation: 0, scale: 1 },
  { x: 20, y: 12, rotation: 2.5, scale: 0.97 },
  { x: -14, y: 24, rotation: -2, scale: 0.94 },
  { x: 10, y: 34, rotation: 1.5, scale: 0.91 },
  { x: -8, y: 42, rotation: -1, scale: 0.89 },
  { x: 6, y: 48, rotation: 0.5, scale: 0.87 },
] as const;

const MOBILE_STACK_TAIL = MOBILE_STACK_OFFSETS[MOBILE_STACK_OFFSETS.length - 1];

/** Largest absolute horizontal peek — reserved so deck edges aren't clipped. */
export const MOBILE_STACK_MAX_SIDE_PEEK = Math.max(
  ...MOBILE_STACK_OFFSETS.map((offset) => Math.abs(offset.x))
);

/** Breathing room outside the peeking deck on each side of the viewport. */
const MOBILE_STACK_EDGE_GUTTER = 20;

/** Soft cap so large phones keep a readable, non-fullscreen card. */
const MOBILE_STACK_MAX_CARD_WIDTH = 312;

/** Floor so very narrow viewports still get a usable card. */
const MOBILE_STACK_MIN_CARD_WIDTH = 252;

export interface MobileHeroCardDimensions {
  width: number;
  height: number;
  wrapperWidth: number;
  wrapperHeight: number;
}

/**
 * Card footprint for mobile stack — inset for gutters + deck peek so cards
 * don't kiss the viewport edge or get clipped by overflow-x: clip.
 */
export function readMobileHeroCardDimensions(viewportWidth: number): MobileHeroCardDimensions {
  const reserved = (MOBILE_STACK_EDGE_GUTTER + MOBILE_STACK_MAX_SIDE_PEEK) * 2;
  const width = Math.min(
    Math.max(MOBILE_STACK_MIN_CARD_WIDTH, Math.round(viewportWidth - reserved)),
    MOBILE_STACK_MAX_CARD_WIDTH
  );
  const height = Math.round(width * (4 / 3));
  const peek = MOBILE_STACK_TAIL.y + 20;
  return {
    width,
    height,
    wrapperWidth: width + MOBILE_STACK_MAX_SIDE_PEEK * 2,
    wrapperHeight: height + peek,
  };
}

export function mobileStackOffsetFromActive(
  cardIndex: number,
  activeIndex: number,
  totalCards: number
): { offset: number; position: MobileStackOffset } {
  const offset = (cardIndex - activeIndex + totalCards) % totalCards;
  const position = MOBILE_STACK_OFFSETS[offset] ?? MOBILE_STACK_TAIL;
  return { offset, position };
}

export function mobileStackZIndex(offset: number, cardCount: number, isHovered: boolean): number {
  if (isHovered && offset === 0) return cardCount + 3;
  return cardCount + 1 - offset;
}
