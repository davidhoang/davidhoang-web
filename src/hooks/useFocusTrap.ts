import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Traps keyboard focus within a container while a modal is open.
 *
 * - Moves focus into the container on mount
 * - Cycles Tab / Shift+Tab within focusable children
 * - Restores focus to the previously focused element on unmount
 */
export function useFocusTrap(isOpen: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Capture the element that had focus before the modal opened
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Move focus into the container on next frame (after DOM paint)
      requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;
        const first = container.querySelector<HTMLElement>(FOCUSABLE);
        if (first) {
          first.focus();
        } else {
          // If no focusable children, focus the container itself
          container.setAttribute('tabindex', '-1');
          container.focus();
        }
      });
    }

    return () => {
      if (isOpen && previousFocusRef.current) {
        // Restore focus when modal closes
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    };
  }, [isOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const container = containerRef.current;
    if (!container) return;

    const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  return { containerRef, handleKeyDown };
}
