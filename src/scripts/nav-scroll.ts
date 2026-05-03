export function initScrollDetection(): void {
  const nav: HTMLElement | null = document.querySelector('nav');
  if (!nav) return;
  const navEl: HTMLElement = nav;

  let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
  const SCROLL_STOP_DELAY = 150; // milliseconds to wait after scrolling stops

  function handleScroll() {
    // Add scrolling class
    navEl.classList.add('is-scrolling');

    // Clear existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    // Set timeout to remove class when scrolling stops
    scrollTimeout = setTimeout(() => {
      navEl.classList.remove('is-scrolling');
      scrollTimeout = null;
    }, SCROLL_STOP_DELAY);
  }

  // Listen to scroll events
  window.addEventListener('scroll', handleScroll, { passive: true });
}
