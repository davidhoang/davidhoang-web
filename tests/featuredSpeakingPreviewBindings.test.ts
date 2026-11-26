import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getFeaturedSpeakingPreview,
  setFeaturedSpeakingPreview,
} from '../src/stores/featuredSpeakingPreview';
import { bindFeaturedSpeakingPreview } from '../src/utils/featuredSpeakingPreviewBindings';

function stubPreviewWindow() {
  const listeners = new Map<string, Set<EventListener>>();
  const addEventListener = vi.fn((type: string, listener: EventListener) => {
    const bucket = listeners.get(type) ?? new Set();
    bucket.add(listener);
    listeners.set(type, bucket);
  });
  const removeEventListener = vi.fn((type: string, listener: EventListener) => {
    listeners.get(type)?.delete(listener);
  });

  vi.stubGlobal('window', {
    addEventListener,
    removeEventListener,
    clearTimeout: vi.fn(),
    setTimeout: vi.fn((fn: () => void) => {
      fn();
      return 1;
    }),
    matchMedia: vi.fn(() => ({ matches: true })),
    __featuredSpeakingPreviewStore: {
      activeState: null,
      listeners: new Set(),
    },
  });
  return { addEventListener, removeEventListener };
}

function makeChronicleDom() {
  const chronicleListeners = new Map<string, EventListener>();
  const chronicle = {
    addEventListener(type: string, listener: EventListener) {
      chronicleListeners.set(type, listener);
    },
    removeEventListener(type: string, listener: EventListener) {
      if (chronicleListeners.get(type) === listener) chronicleListeners.delete(type);
    },
    contains() {
      return true;
    },
    querySelector() {
      return null;
    },
  };

  const root = {
    querySelector(selector: string) {
      return selector === '.speaking-chronicle' ? chronicle : null;
    },
  };

  return { root: root as unknown as ParentNode, chronicleListeners };
}

describe('bindFeaturedSpeakingPreview disconnect', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('clears the shared preview store when bindings tear down after a hover preview', () => {
    stubPreviewWindow();
    const { root } = makeChronicleDom();

    setFeaturedSpeakingPreview('hatch-amsterdam', {
      top: 10,
      left: 20,
      right: 120,
      bottom: 40,
      width: 100,
      height: 30,
    });
    expect(getFeaturedSpeakingPreview()?.key).toBe('hatch-amsterdam');

    const bindings = bindFeaturedSpeakingPreview(root);
    expect(bindings).not.toBeNull();

    bindings!.disconnect();
    expect(getFeaturedSpeakingPreview()).toBeNull();
  });
});