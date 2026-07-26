import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isHybridPointerDevice,
  shouldEnablePointerHoverMotion,
} from '../src/utils/viewport-capabilities';

type MediaQueryMap = Record<string, boolean>;

function mockWindow(options: { maxTouchPoints: number; media: MediaQueryMap }) {
  const matchMedia = vi.fn((query: string) => ({
    matches: Boolean(options.media[query]),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  vi.stubGlobal('window', { matchMedia });
  vi.stubGlobal('navigator', { maxTouchPoints: options.maxTouchPoints });
  vi.stubGlobal('matchMedia', matchMedia);
}

describe('viewport pointer capabilities', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('treats iPad + Magic Keyboard style input as hybrid', () => {
    mockWindow({
      maxTouchPoints: 5,
      media: {
        '(hover: hover)': true,
        '(any-hover: hover)': true,
        '(any-pointer: coarse)': true,
      },
    });

    expect(isHybridPointerDevice()).toBe(true);
    expect(shouldEnablePointerHoverMotion()).toBe(false);
  });

  it('disables hover motion when primary hover is none (classic iPadOS)', () => {
    mockWindow({
      maxTouchPoints: 5,
      media: {
        '(hover: hover)': false,
        '(any-hover: hover)': false,
        '(any-pointer: coarse)': true,
      },
    });

    expect(isHybridPointerDevice()).toBe(false);
    expect(shouldEnablePointerHoverMotion()).toBe(false);
  });

  it('enables hover motion on a mouse-only desktop', () => {
    mockWindow({
      maxTouchPoints: 0,
      media: {
        '(hover: hover)': true,
        '(any-hover: hover)': true,
        '(any-pointer: coarse)': false,
      },
    });

    expect(isHybridPointerDevice()).toBe(false);
    expect(shouldEnablePointerHoverMotion()).toBe(true);
  });

  it('detects hybrid via any-hover when primary hover is none', () => {
    mockWindow({
      maxTouchPoints: 5,
      media: {
        '(hover: hover)': false,
        '(any-hover: hover)': true,
        '(any-pointer: coarse)': true,
      },
    });

    expect(isHybridPointerDevice()).toBe(true);
    // Primary hover:none still blocks JS lift — CSS strips transform on :hover here.
    expect(shouldEnablePointerHoverMotion()).toBe(false);
  });
});
