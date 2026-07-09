import { describe, expect, it } from 'vitest';
import {
  mobileStackOffsetFromActive,
  mobileStackZIndex,
  readMobileHeroCardDimensions,
} from '../src/components/hero/mobileHeroStack';

describe('mobileHeroStack', () => {
  it('sizes cards to use most of the viewport width', () => {
    const dims = readMobileHeroCardDimensions(390);
    expect(dims.width).toBe(358);
    expect(dims.height).toBe(Math.round(358 * (4 / 3)));
    expect(dims.wrapperHeight).toBeGreaterThan(dims.height);
  });

  it('caps card width at 360px on large phones', () => {
    const dims = readMobileHeroCardDimensions(430);
    expect(dims.width).toBe(360);
  });

  it('orders stack offsets from the active card', () => {
    const front = mobileStackOffsetFromActive(2, 2, 6);
    expect(front.offset).toBe(0);
    expect(front.position.scale).toBe(1);

    const behind = mobileStackOffsetFromActive(3, 2, 6);
    expect(behind.offset).toBe(1);
    expect(behind.position.y).toBeGreaterThan(0);
    expect(behind.position.scale).toBeLessThan(1);
  });

  it('wraps stack order for cards behind the active index', () => {
    const wrapped = mobileStackOffsetFromActive(0, 2, 6);
    expect(wrapped.offset).toBe(4);
  });

  it('ranks front card above peeking cards in z-index', () => {
    expect(mobileStackZIndex(0, 6, false)).toBeGreaterThan(mobileStackZIndex(2, 6, false));
  });
});
