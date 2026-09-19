import type { HeroDialValues } from './heroDialDefaults';

interface FanCardMotionOptions {
  index: number;
  focusedIndex: number | null;
  position: { x: number; y: number; rotation: number };
  hover: HeroDialValues['stackedFan']['hover'];
}

/**
 * Make room within the deck instead of changing which card is on top.
 * Neighbors yield most; the rest of the fan follows with diminishing movement.
 * All poses are spring targets, so changing focus keeps the current velocity.
 */
export function fanCardMotion({ index, focusedIndex, position, hover }: FanCardMotionOptions) {
  const rest = { x: position.x, y: position.y, rotate: position.rotation, scale: 1 };
  if (focusedIndex === null) return rest;

  if (index === focusedIndex) {
    return {
      x: position.x + Math.sign(position.x) * hover.slideX,
      y: position.y - hover.liftY,
      rotate: position.rotation * 0.55,
      scale: hover.scale,
    };
  }

  const distance = index - focusedIndex;
  const influence = 1 / Math.abs(distance) ** 1.6;
  const direction = Math.sign(distance);
  return {
    ...rest,
    x: position.x + direction * hover.neighborShift * influence,
    y: position.y + 4 * influence,
    rotate: position.rotation + direction * 1.5 * influence,
  };
}
