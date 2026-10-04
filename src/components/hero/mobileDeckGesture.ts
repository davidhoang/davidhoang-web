export type GestureAxis = 'x' | 'y' | null;

/** Commit once intent is clear; a vertical scroll cannot turn into a deck swipe. */
export function resolveDeckAxis(axis: GestureAxis, dx: number, dy: number): GestureAxis {
  if (axis) return axis;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 10) return null;
  if (Math.abs(dx) > Math.abs(dy) * 1.25) return 'x';
  if (Math.abs(dy) > Math.abs(dx) * 1.25) return 'y';
  return null;
}

export function deckSwipeDirection(axis: GestureAxis, dx: number): 1 | -1 | null {
  if (axis !== 'x' || Math.abs(dx) < 48) return null;
  return dx < 0 ? 1 : -1;
}

/** Arrow keys wrap; Home/End select the ends without activating a destination. */
export function deckIndexForKey(key: string, current: number, count: number): number | null {
  if (count < 1) return null;
  switch (key) {
    case 'ArrowRight': return (current + 1) % count;
    case 'ArrowLeft': return (current - 1 + count) % count;
    case 'Home': return 0;
    case 'End': return count - 1;
    default: return null;
  }
}
