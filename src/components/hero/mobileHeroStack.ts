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
  { x: 12, y: 16, rotation: 2.5, scale: 0.965 },
  { x: -10, y: 30, rotation: -2, scale: 0.93 },
  { x: 8, y: 42, rotation: 1.5, scale: 0.9 },
  { x: -6, y: 52, rotation: -1, scale: 0.88 },
  { x: 4, y: 60, rotation: 0.5, scale: 0.86 },
] as const;

const MOBILE_STACK_TAIL = MOBILE_STACK_OFFSETS[MOBILE_STACK_OFFSETS.length - 1];

export interface MobileHeroCardDimensions {
  width: number;
  height: number;
  wrapperWidth: number;
  wrapperHeight: number;
}

/** Card footprint for mobile stack — uses most of the viewport width (3:4 ratio). */
export function readMobileHeroCardDimensions(viewportWidth: number): MobileHeroCardDimensions {
  const gutter = 32;
  const width = Math.min(Math.max(280, Math.round(viewportWidth - gutter)), 360);
  const height = Math.round(width * (4 / 3));
  const peek = MOBILE_STACK_TAIL.y + 24;
  return {
    width,
    height,
    wrapperWidth: width,
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
