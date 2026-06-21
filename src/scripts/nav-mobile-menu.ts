const MOBILE_BREAKPOINT = 768;

export function initMobileMenu(): (() => void) | undefined {
  const menuButton = document.getElementById('menuButton');
  const mobileMenu = document.getElementById('mobileMenu');
  const nav = document.querySelector('.site-nav');

  if (!menuButton || !mobileMenu) return;

  const hamburger = menuButton.querySelector('.hamburger-icon');
  let scrollPosition = 0;
  let isOpen = false;

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
    mobileMenu.setAttribute('aria-hidden', 'false');
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Close menu');
    hamburger?.classList.add('is-active');

    requestAnimationFrame(() => {
      mobileMenu.classList.add('is-open');
    });

    isOpen = true;
  }

  function close(restoreFocus = true): void {
    if (!isOpen) return;

    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open mobile menu');
    hamburger?.classList.remove('is-active');
    document.body.classList.remove('mobile-menu-open');
    nav?.classList.remove('mobile-menu-active');

    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== mobileMenu) return;
      if (!mobileMenu.classList.contains('is-open')) {
        mobileMenu.hidden = true;
      }
    };

    mobileMenu.addEventListener('transitionend', onTransitionEnd, { once: true });

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
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      close();
    }
  }

  function handleResize(): void {
    if (!isMobile() && isOpen) {
      close(false);
    }
  }

  function handleBeforeSwap(): void {
    if (isOpen) {
      close(false);
    }
  }

  menuButton.addEventListener('click', handleMenuClick);
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', handleMenuLinkClick);
  });
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleResize);
  document.addEventListener('astro:before-swap', handleBeforeSwap);

  return () => {
    menuButton.removeEventListener('click', handleMenuClick);
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.removeEventListener('click', handleMenuLinkClick);
    });
    document.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('astro:before-swap', handleBeforeSwap);
    close(false);
  };
}
