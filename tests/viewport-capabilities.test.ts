import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isHybridPointerDevice,
  shouldEnablePointerHoverMotion,
} from '../src/utils/viewport-capabilities';

type MediaQueryMap = Record<string, boolean>;

function mockMatchMedia(map: MediaQueryMap) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: Boolean(map[query]),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}

describe('viewport pointer capabilities', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('treats iPad + Magic Keyboard style input as hybrid', () => {
    vi.stubGlobal('navigator', { maxTouchPoints: 5 });
    mockMatchMedia({
      '(hover: hover)': true,
      '(any-hover: hover)': true,
      '(any-pointer: coarse)': true,
    });

    expect(isHybridPointerDevice()).toBe(true);
    expect(shouldEnablePointerHoverMotion()).toBe(false);
  });

  it('disables hover motion when primary hover is none (classic iPadOS)', () => {
    vi.stubGlobal('navigator', { maxTouchPoints: 5 });
    mockMatchMedia({
      '(hover: hover)': false,
      '(any-hover: hover)': false,
      '(any-pointer: coarse)': true,
    });

    expect(isHybridPointerDevice()).toBe(false);
    expect(shouldEnablePointerHoverMotion()).toBe(false);
  });

  it('enables hover motion on a mouse-only desktop', () => {
    vi.stubGlobal('navigator', { maxTouchPoints: 0 });
    mockMatchMedia({
      '(hover: hover)': true,
      '(any-hover: hover)': true,
      '(any-pointer: coarse)': false,
    });

    expect(isHybridPointerDevice()).toBe(false);
    expect(shouldEnablePointerHoverMotion()).toBe(true);
  });

  it('detects hybrid via any-hover when primary hover is none', () => {
    vi.stubGlobal('navigator', { maxTouchPoints: 5 });
    mockMatchMedia({
      '(hover: hover)': false,
      '(any-hover: hover)': true,
      '(any-pointer: coarse)': true,
    });

    expect(isHybridPointerDevice()).toBe(true);
    // Primary hover:none still blocks JS lift — CSS strips transform on :hover here.
    expect(shouldEnablePointerHoverMotion()).toBe(false);
  });
});
