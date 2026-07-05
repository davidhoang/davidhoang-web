/** Viewport width band for iPad Pro portrait/landscape and similar tablets (769–1440px). */
export function isTabletClassViewport(width = typeof window !== 'undefined' ? window.innerWidth : 0): boolean {
  return width >= 769 && width <= 1440;
}

/**
 * Touch-capable device that also reports hover (iPad + Magic Keyboard trackpad).
 * iPadOS always matches (hover: none) at the media-query level even with a
 * trackpad attached — use maxTouchPoints as the reliable signal.
 */
export function isHybridPointerDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const hasTouchScreen = navigator.maxTouchPoints > 0;
  const hasHover = window.matchMedia('(hover: hover)').matches;
  const hasCoarse = window.matchMedia('(any-pointer: coarse)').matches;
  return hasHover && (hasCoarse || hasTouchScreen);
}

/** Sentient nav drift — desktop laptops only; disabled on tablet / hybrid devices. */
export function shouldEnableSentientNav(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.innerWidth <= 768) return false;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return false;
  if (isHybridPointerDevice()) return false;
  if (isTabletClassViewport()) return false;
  return true;
}

export function syncHybridPointerAttribute(root: HTMLElement = document.documentElement): void {
  root.setAttribute('data-hybrid-pointer', isHybridPointerDevice() ? 'true' : 'false');
}
