/** Viewport width band for iPad Pro portrait/landscape and similar tablets (769–1440px). */
export function isTabletClassViewport(width = typeof window !== 'undefined' ? window.innerWidth : 0): boolean {
  return width >= 769 && width <= 1440;
}

function hasTouchCapability(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return navigator.maxTouchPoints > 0 || window.matchMedia('(any-pointer: coarse)').matches;
}

function hasHoverCapability(): boolean {
  if (typeof window === 'undefined') return false;
  // Primary (hover: hover) is unreliable on iPadOS with Magic Keyboard; any-hover
  // becomes true when a trackpad/mouse that can hover is attached.
  return (
    window.matchMedia('(hover: hover)').matches ||
    window.matchMedia('(any-hover: hover)').matches
  );
}

/**
 * Touch-capable device that also has a hover-capable pointer (iPad + Magic Keyboard,
 * Surface, etc.). Used to calm hover motion that flickers under hybrid input.
 */
export function isHybridPointerDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return hasHoverCapability() && hasTouchCapability();
}

/**
 * Whether JS-driven hover lift / media activate should run.
 *
 * False when:
 * - primary pointer cannot hover (`hover: none`, including iPadOS even with trackpad
 *   mouse events — CSS also strips `transform` on `:hover` in that media query)
 * - hybrid pointer (touch + hover) where trackpad hover thrash is common
 */
export function shouldEnablePointerHoverMotion(): boolean {
  if (typeof window === 'undefined') return false;
  if (!window.matchMedia('(hover: hover)').matches) return false;
  if (isHybridPointerDevice()) return false;
  return true;
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
  root.setAttribute('data-hover-motion', shouldEnablePointerHoverMotion() ? 'true' : 'false');
}
