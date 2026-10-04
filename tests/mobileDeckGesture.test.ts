import { describe, expect, it } from 'vitest';
import { deckSwipeDirection, resolveDeckAxis, deckIndexForKey } from '../src/components/hero/mobileDeckGesture';

describe('mobile deck intent', () => {
  it('keeps taps and ambiguous diagonals uncommitted', () => {
    expect(resolveDeckAxis(null, 5, 3)).toBeNull();
    expect(resolveDeckAxis(null, 20, 20)).toBeNull();
  });
  it('does not turn vertical scrolling into a swipe later in the gesture', () => {
    const axis = resolveDeckAxis(null, 4, 20);
    expect(resolveDeckAxis(axis, 100, 30)).toBe('y');
    expect(deckSwipeDirection(axis, 100)).toBeNull();
  });
  it('requires deliberate travel and preserves the chosen horizontal axis', () => {
    const axis = resolveDeckAxis(null, -20, 4);
    expect(resolveDeckAxis(axis, -80, 100)).toBe('x');
    expect(deckSwipeDirection(axis, -47)).toBeNull();
    expect(deckSwipeDirection(axis, -48)).toBe(1);
    expect(deckSwipeDirection(axis, 48)).toBe(-1);
  });
});

describe('mobile deck keyboard navigation', () => {
  it('wraps in either direction without opening a card', () => {
    expect(deckIndexForKey('ArrowLeft', 0, 6)).toBe(5);
    expect(deckIndexForKey('ArrowRight', 5, 6)).toBe(0);
    expect(deckIndexForKey('Enter', 0, 6)).toBeNull();
  });
  it('supports Home and End and ignores empty decks', () => {
    expect(deckIndexForKey('Home', 3, 6)).toBe(0);
    expect(deckIndexForKey('End', 0, 6)).toBe(5);
    expect(deckIndexForKey('ArrowRight', 0, 0)).toBeNull();
  });
});
