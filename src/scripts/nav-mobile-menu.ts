export function initMobileMenu(): void {
  const menuButton = document.getElementById('menuButton');
  if (!menuButton) return;

  function handleMenuClick() {
    const nav = document.querySelector('nav');
    if (nav?.classList.contains('cmd-palette-active')) {
      const closePalette = (window as any).__cmdPaletteClose;
      if (typeof closePalette === 'function') closePalette();
    } else {
      const openPalette = (window as any).__cmdPaletteOpen;
      if (typeof openPalette === 'function') openPalette();
    }
  }

  menuButton.addEventListener('click', handleMenuClick);
}
