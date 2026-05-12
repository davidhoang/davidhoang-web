/**
 * Device & input-method detection.
 *
 * The companion to the inline script in MainLayout.astro that sets
 * `data-device` and `data-input` on <html> before paint. Use these
 * helpers when JS needs to read the same state at runtime (e.g. inside
 * React components or for media-query change listeners).
 *
 * iPadOS 13+ reports as "Macintosh" in navigator.userAgent — we
 * disambiguate via maxTouchPoints.
 */

export type InputType = 'trackpad' | 'touch' | 'mouse';

export function isIpad(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const maxTouch = navigator.maxTouchPoints || 0;
  return /iPad/.test(ua) || (maxTouch > 1 && /Mac/.test(ua));
}

export function getInputType(): InputType {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'mouse';
  const hasTouch = (navigator.maxTouchPoints || 0) > 1;
  if (!hasTouch) return 'mouse';
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
    ? 'trackpad'
    : 'touch';
}

export function hasFinePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/**
 * Subscribe to input-type changes. Fires when a Magic Keyboard /
 * trackpad is attached or detached from an iPad. Returns an
 * unsubscribe function.
 */
export function watchInputType(callback: (input: InputType) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const query = window.matchMedia('(hover: hover) and (pointer: fine)');
  const handler = () => callback(getInputType());
  query.addEventListener('change', handler);
  return () => query.removeEventListener('change', handler);
}
