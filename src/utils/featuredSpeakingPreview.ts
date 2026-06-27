type Listener = (state: FeaturedSpeakingPreviewState) => void;

export type SpeakingPreviewAnchor = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export type FeaturedSpeakingPreviewState = {
  key: string;
  anchor: SpeakingPreviewAnchor;
} | null;

type PreviewStore = {
  activeState: FeaturedSpeakingPreviewState;
  listeners: Set<Listener>;
};

declare global {
  interface Window {
    __featuredSpeakingPreviewStore?: PreviewStore;
  }
}

function getStore(): PreviewStore {
  if (typeof window === 'undefined') {
    return { activeState: null, listeners: new Set() };
  }

  if (!window.__featuredSpeakingPreviewStore) {
    window.__featuredSpeakingPreviewStore = {
      activeState: null,
      listeners: new Set(),
    };
  }

  return window.__featuredSpeakingPreviewStore;
}

function normalizeAnchor(anchor: SpeakingPreviewAnchor | DOMRect): SpeakingPreviewAnchor {
  return {
    top: anchor.top,
    left: anchor.left,
    right: anchor.right,
    bottom: anchor.bottom,
    width: anchor.width,
    height: anchor.height,
  };
}

function anchorsEqual(a: SpeakingPreviewAnchor, b: SpeakingPreviewAnchor) {
  return (
    a.top === b.top &&
    a.left === b.left &&
    a.right === b.right &&
    a.bottom === b.bottom
  );
}

export function setFeaturedSpeakingPreview(
  key: string | null,
  anchor?: SpeakingPreviewAnchor | DOMRect,
) {
  const store = getStore();

  if (key === null) {
    if (store.activeState === null) return;
    store.activeState = null;
    store.listeners.forEach((listener) => listener(store.activeState));
    return;
  }

  if (!anchor) return;

  const next: FeaturedSpeakingPreviewState = {
    key,
    anchor: normalizeAnchor(anchor),
  };

  if (
    store.activeState?.key === next.key &&
    anchorsEqual(store.activeState.anchor, next.anchor)
  ) {
    return;
  }

  store.activeState = next;
  store.listeners.forEach((listener) => listener(store.activeState));
}

export function getFeaturedSpeakingPreview() {
  return getStore().activeState;
}

export function subscribeFeaturedSpeakingPreview(listener: Listener) {
  const store = getStore();
  store.listeners.add(listener);
  listener(store.activeState);
  return () => {
    store.listeners.delete(listener);
  };
}

export function isFeaturedSpeakingPreviewEnabled() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: hover) and (min-width: 901px)').matches;
}
