export function initMobileMenu(): void {
  const menuButton = document.getElementById('menuButton');
  const closeButton = document.getElementById('closeButton');
  const mobileMenu = document.getElementById('mobileMenu');
  const backdrop = document.getElementById('mobileMenuBackdrop');
  const searchInput = document.getElementById('mobileMenuSearch') as HTMLInputElement | null;
  const mobileLinks = mobileMenu?.querySelectorAll('.mobile-nav-links li');
  const hamburgerIcon = menuButton?.querySelector('.hamburger-icon');
  const focusableSelectors = 'a[href], button:not([disabled]), input[type="text"]';

  function openMenu() {
    const scrollY = window.scrollY;
    document.documentElement.style.setProperty('--scroll-position', `${scrollY}px`);

    mobileMenu?.classList.add('active');
    backdrop?.classList.add('active');
    document.body.classList.add('mobile-menu-open');
    hamburgerIcon?.classList.add('is-active');

    menuButton?.setAttribute('aria-expanded', 'true');
    mobileMenu?.setAttribute('aria-hidden', 'false');

    // Focus the search input
    setTimeout(() => searchInput?.focus(), 100);
    document.addEventListener('keydown', trapFocus);
    setSiblingsInert(mobileMenu, true);
  }

  function closeMenu() {
    const scrollY = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--scroll-position') || '0'
    );

    mobileMenu?.classList.remove('active');
    backdrop?.classList.remove('active');
    document.body.classList.remove('mobile-menu-open');
    document.documentElement.style.removeProperty('--scroll-position');
    hamburgerIcon?.classList.remove('is-active');

    // Reset search
    if (searchInput) {
      searchInput.value = '';
      filterLinks('');
    }

    window.scrollTo(0, scrollY);

    menuButton?.setAttribute('aria-expanded', 'false');
    mobileMenu?.setAttribute('aria-hidden', 'true');

    menuButton?.focus();
    document.removeEventListener('keydown', trapFocus);
    setSiblingsInert(mobileMenu, false);
  }

  // Filter nav links based on search input
  function filterLinks(query: string) {
    if (!mobileLinks) return;
    const q = query.toLowerCase().trim();
    mobileLinks.forEach((li) => {
      const label = li.querySelector('.mobile-nav-label')?.textContent?.toLowerCase() || '';
      const path = li.querySelector('.mobile-nav-path')?.textContent?.toLowerCase() || '';
      const match = !q || label.includes(q) || path.includes(q);
      (li as HTMLElement).style.display = match ? '' : 'none';
    });
  }

  searchInput?.addEventListener('input', () => {
    filterLinks(searchInput.value);
  });

  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape' && mobileMenu?.classList.contains('active')) {
      closeMenu();
    }
  }

  menuButton?.addEventListener('click', openMenu);
  closeButton?.addEventListener('click', closeMenu);
  backdrop?.addEventListener('click', closeMenu);
  document.addEventListener('keydown', handleEscape);

  const navLinks = mobileMenu?.querySelectorAll('.mobile-nav-links a');
  navLinks?.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Footer links also close
  const footerLinks = mobileMenu?.querySelectorAll('.mobile-menu-footer a');
  footerLinks?.forEach(link => {
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
    const siblings = Array.from(document.body.children).filter(
      el => el !== element && el !== backdrop
    );
    siblings.forEach(el => {
      if (inert) {
        el.setAttribute('aria-hidden', 'true');
      } else {
        el.removeAttribute('aria-hidden');
      }
    });
  }
}
