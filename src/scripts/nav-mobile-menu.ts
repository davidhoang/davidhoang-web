const MOBILE_BREAKPOINT = 768;

export function initMobileMenu(): (() => void) | undefined {
  const menuButtonEl = document.getElementById('menuButton');
  const mobileMenuEl = document.getElementById('mobileMenu');
  const nav = document.querySelector<HTMLElement>('.site-nav');

  if (!menuButtonEl || !mobileMenuEl) return;

  const menuButton = menuButtonEl;
  const mobileMenu = mobileMenuEl;

  const hamburger = menuButton.querySelector('.hamburger-icon');
  let scrollPosition = 0;
  let isOpen = false;
  let openFrame = 0;
  let inertElements: Array<{ element: HTMLElement; wasInert: boolean }> = [];

  function isMobile(): boolean {
    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  function open(): void {
    if (isOpen || !isMobile()) return;

    scrollPosition = window.scrollY;
    document.documentElement.style.setProperty('--scroll-position', `${scrollPosition}px`);
    document.body.classList.add('mobile-menu-open');
    nav?.classList.add('mobile-menu-active');

    mobileMenu.hidden = false;
    mobileMenu.inert = false;
    mobileMenu.setAttribute('aria-hidden', 'false');
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Close menu');
    hamburger?.classList.add('is-active');

    inertElements = Array.from(document.body.children)
      .filter((element): element is HTMLElement =>
        element instanceof HTMLElement && element !== nav && element !== mobileMenu &&
        !['SCRIPT', 'STYLE', 'LINK'].includes(element.tagName))
      .map((element) => ({ element, wasInert: element.inert }));
    inertElements.forEach(({ element }) => { element.inert = true; });

    openFrame = requestAnimationFrame(() => {
      mobileMenu.classList.add('is-open');
      mobileMenu.querySelector<HTMLAnchorElement>('a')?.focus({ preventScroll: true });
    });

    isOpen = true;
  }

  function close(restoreFocus = true): void {
    if (!isOpen) return;

    cancelAnimationFrame(openFrame);

    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    mobileMenu.inert = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open mobile menu');
    hamburger?.classList.remove('is-active');
    document.body.classList.remove('mobile-menu-open');
    nav?.classList.remove('mobile-menu-active');

    inertElements.forEach(({ element, wasInert }) => { element.inert = wasInert; });
    inertElements = [];
    // CSS visibility owns the exit transition; inert removes its links immediately,
    // including when reduced motion means no transitionend event will fire.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) mobileMenu.hidden = true;

    window.scrollTo(0, scrollPosition);

    if (restoreFocus) {
      menuButton.focus();
    }

    isOpen = false;
  }

  function toggle(): void {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }

  function handleMenuClick(event: MouseEvent): void {
    if (!isMobile()) return;
    event.preventDefault();
    event.stopPropagation();
    toggle();
  }

  function handleMenuLinkClick(): void {
    close(false);
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!isOpen) return;
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      close();
    }
    if (event.key === 'Tab') {
      const targets = [menuButton, ...mobileMenu.querySelectorAll<HTMLAnchorElement>('a[href]')];
      const current = targets.indexOf(document.activeElement as HTMLElement);
      const next = event.shiftKey ? current - 1 : current + 1;
      event.preventDefault();
      targets[(next + targets.length) % targets.length]?.focus();
    }
  }

  function handleResize(): void {
    if (!isMobile() && isOpen) {
      close(false);
    }
  }

  function handleTransitionEnd(event: TransitionEvent): void {
    if (event.target === mobileMenu && !isOpen) mobileMenu.hidden = true;
  }

  function handleBeforeSwap(): void {
    if (isOpen) {
      close(false);
    }
  }

  menuButton.addEventListener('click', handleMenuClick);
  mobileMenu.addEventListener('transitionend', handleTransitionEnd);
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', handleMenuLinkClick);
  });
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleResize);
  document.addEventListener('astro:before-swap', handleBeforeSwap);

  return () => {
    menuButton.removeEventListener('click', handleMenuClick);
    mobileMenu.removeEventListener('transitionend', handleTransitionEnd);
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.removeEventListener('click', handleMenuLinkClick);
    });
    document.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('astro:before-swap', handleBeforeSwap);
    close(false);
  };
}
