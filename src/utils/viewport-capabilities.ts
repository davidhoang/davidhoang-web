/** Viewport width band for iPad Pro portrait/landscape and similar tablets (769–1366px). */
export function isTabletClassViewport(width = typeof window !== 'undefined' ? window.innerWidth : 0): boolean {
  return width >= 769 && width <= 1366;
}

/**
 * Touch-capable device that also reports hover (iPad + Magic Keyboard trackpad,
 * Surface, etc.). Safari mis-handles fixed nav centering in this mode.
 */
export function isHybridPointerDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(any-pointer: coarse) and (hover: hover)').matches;
}

/** Sentient nav drift — desktop laptops only; disabled on tablet-class viewports. */
export function shouldEnableSentientNav(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.innerWidth <= 768) return false;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return false;
  if (isTabletClassViewport()) return false;
  return true;
}

export function syncHybridPointerAttribute(root: HTMLElement = document.documentElement): void {
  root.setAttribute('data-hybrid-pointer', isHybridPointerDevice() ? 'true' : 'false');
}
