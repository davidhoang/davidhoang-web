import { describe, expect, it } from 'vitest';
import {
  MOBILE_STACK_MAX_SIDE_PEEK,
  mobileStackOffsetFromActive,
  mobileStackZIndex,
  readMobileHeroCardDimensions,
} from '../src/components/hero/mobileHeroStack';

describe('mobileHeroStack', () => {
  it('insets cards for gutters and deck peek on a typical phone', () => {
    const dims = readMobileHeroCardDimensions(390);
    // 390 - 2*(20 gutter + 20 peek) = 310
    expect(dims.width).toBe(310);
    expect(dims.height).toBe(Math.round(310 * (4 / 3)));
    expect(dims.wrapperWidth).toBe(dims.width + MOBILE_STACK_MAX_SIDE_PEEK * 2);
    expect(dims.wrapperHeight).toBeGreaterThan(dims.height);
    // Keep breathing room so overflow-x:clip doesn't shave the peek
    expect(dims.wrapperWidth).toBeLessThanOrEqual(390 - 40);
  });

  it('caps card width on large phones so the stack stays inset', () => {
    const dims = readMobileHeroCardDimensions(430);
    expect(dims.width).toBe(312);
    expect(dims.wrapperWidth).toBeLessThan(430);
  });

  it('keeps a usable floor width on very narrow viewports', () => {
    const dims = readMobileHeroCardDimensions(320);
    expect(dims.width).toBe(252);
  });

  it('orders stack offsets from the active card', () => {
    const front = mobileStackOffsetFromActive(2, 2, 6);
    expect(front.offset).toBe(0);
    expect(front.position.scale).toBe(1);

    const behind = mobileStackOffsetFromActive(3, 2, 6);
    expect(behind.offset).toBe(1);
    expect(behind.position.x).toBeGreaterThan(0);
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
