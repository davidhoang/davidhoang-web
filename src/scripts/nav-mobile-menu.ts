export function initMobileMenu(): void {
  const menuButton = document.getElementById('menuButton');
  const closeButton = document.getElementById('closeButton');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = mobileMenu?.querySelectorAll('a');
  const focusableSelectors = 'a[href], button:not([disabled]), textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select';

  function openMenu() {
    // Save scroll position before locking
    const scrollY = window.scrollY;
    document.documentElement.style.setProperty('--scroll-position', `${scrollY}px`);

    mobileMenu?.classList.add('active');
    document.body.classList.add('mobile-menu-open');

    // Update ARIA states
    menuButton?.setAttribute('aria-expanded', 'true');
    mobileMenu?.setAttribute('aria-hidden', 'false');

    // Focus management
    closeButton?.focus();
    // Trap focus inside the dialog
    document.addEventListener('keydown', trapFocus);
    // Hide background for assistive tech
    setSiblingsInert(mobileMenu, true);
  }

  function closeMenu() {
    // Read saved scroll position before unlocking
    const scrollY = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--scroll-position') || '0'
    );

    mobileMenu?.classList.remove('active');
    document.body.classList.remove('mobile-menu-open');
    document.documentElement.style.removeProperty('--scroll-position');

    // Restore scroll position
    window.scrollTo(0, scrollY);

    // Update ARIA states
    menuButton?.setAttribute('aria-expanded', 'false');
    mobileMenu?.setAttribute('aria-hidden', 'true');

    // Return focus to menu button
    menuButton?.focus();
    document.removeEventListener('keydown', trapFocus);
    setSiblingsInert(mobileMenu, false);
  }

  // Handle escape key to close menu
  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape' && mobileMenu?.classList.contains('active')) {
      closeMenu();
    }
  }

  // Handle click outside menu to close
  function handleClickOutside(event: MouseEvent) {
    if (mobileMenu?.classList.contains('active') &&
        !mobileMenu.contains(event.target as Node) &&
        !menuButton?.contains(event.target as Node)) {
      closeMenu();
    }
  }

  menuButton?.addEventListener('click', openMenu);
  closeButton?.addEventListener('click', closeMenu);
  document.addEventListener('keydown', handleEscape);
  document.addEventListener('click', handleClickOutside);

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
