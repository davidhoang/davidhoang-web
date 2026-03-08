export function initMobileMenu(): void {
  const menuButton = document.getElementById('menuButton');
  const closeButton = document.getElementById('closeButton');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = mobileMenu?.querySelectorAll('a');
  const hamburgerIcon = menuButton?.querySelector('.hamburger-icon');
  const focusableSelectors = 'a[href], button:not([disabled]), textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select';

  // Swipe-to-close state
  let touchStartX = 0;
  let touchCurrentX = 0;
  let isSwiping = false;
  const SWIPE_THRESHOLD = 80;

  function openMenu() {
    const scrollY = window.scrollY;
    document.documentElement.style.setProperty('--scroll-position', `${scrollY}px`);

    mobileMenu?.classList.add('active');
    document.body.classList.add('mobile-menu-open');
    hamburgerIcon?.classList.add('is-active');

    menuButton?.setAttribute('aria-expanded', 'true');
    mobileMenu?.setAttribute('aria-hidden', 'false');

    closeButton?.focus();
    document.addEventListener('keydown', trapFocus);
    setSiblingsInert(mobileMenu, true);
  }

  function closeMenu() {
    const scrollY = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--scroll-position') || '0'
    );

    mobileMenu?.classList.remove('active');
    document.body.classList.remove('mobile-menu-open');
    document.documentElement.style.removeProperty('--scroll-position');
    hamburgerIcon?.classList.remove('is-active');

    // Reset any swipe transform
    if (mobileMenu) {
      mobileMenu.style.transform = '';
    }

    window.scrollTo(0, scrollY);

    menuButton?.setAttribute('aria-expanded', 'false');
    mobileMenu?.setAttribute('aria-hidden', 'true');

    menuButton?.focus();
    document.removeEventListener('keydown', trapFocus);
    setSiblingsInert(mobileMenu, false);
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape' && mobileMenu?.classList.contains('active')) {
      closeMenu();
    }
  }

  function handleClickOutside(event: MouseEvent) {
    if (mobileMenu?.classList.contains('active') &&
        !mobileMenu.contains(event.target as Node) &&
        !menuButton?.contains(event.target as Node)) {
      closeMenu();
    }
  }

  // Swipe-to-close: detect right swipe to dismiss menu
  function handleTouchStart(event: TouchEvent) {
    if (!mobileMenu?.classList.contains('active')) return;
    touchStartX = event.touches[0].clientX;
    touchCurrentX = touchStartX;
    isSwiping = false;
  }

  function handleTouchMove(event: TouchEvent) {
    if (!mobileMenu?.classList.contains('active')) return;
    touchCurrentX = event.touches[0].clientX;
    const deltaX = touchCurrentX - touchStartX;

    // Only track rightward swipes
    if (deltaX > 10) {
      isSwiping = true;
      // Move menu with finger, clamped to positive values only
      const translateX = Math.max(0, deltaX);
      mobileMenu.style.transform = `translateX(${translateX}px)`;
      mobileMenu.style.transition = 'none';
    }
  }

  function handleTouchEnd() {
    if (!mobileMenu?.classList.contains('active') || !isSwiping) return;
    const deltaX = touchCurrentX - touchStartX;

    // Restore transition
    mobileMenu!.style.transition = '';

    if (deltaX > SWIPE_THRESHOLD) {
      closeMenu();
    } else {
      // Snap back
      mobileMenu!.style.transform = '';
    }

    isSwiping = false;
  }

  menuButton?.addEventListener('click', openMenu);
  closeButton?.addEventListener('click', closeMenu);
  document.addEventListener('keydown', handleEscape);
  document.addEventListener('click', handleClickOutside);

  // Swipe gesture listeners
  mobileMenu?.addEventListener('touchstart', handleTouchStart, { passive: true });
  mobileMenu?.addEventListener('touchmove', handleTouchMove, { passive: true });
  mobileMenu?.addEventListener('touchend', handleTouchEnd, { passive: true });

  mobileLinks?.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  function trapFocus(event: KeyboardEvent) {
    if (event.key !== 'Tab' || !mobileMenu?.classList.contains('active')) return;
    const focusable = mobileMenu.querySelectorAll(focusableSelectors);
    if (!focusable.length) return;
    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;
    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function setSiblingsInert(element: HTMLElement | null, inert: boolean) {
    if (!element) return;
    const siblings = Array.from(document.body.children).filter(el => el !== element);
    siblings.forEach(el => {
      if (inert) {
        el.setAttribute('aria-hidden', 'true');
      } else {
        el.removeAttribute('aria-hidden');
      }
    });
  }
}
