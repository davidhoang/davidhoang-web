export function initMobileMenu(): void {
  const menuButton = document.getElementById('menuButton');
  if (!menuButton) return;

  function handleMenuClick() {
    // On mobile, open the command palette directly
    const openPalette = (window as any).__cmdPaletteOpen;
    if (typeof openPalette === 'function') {
      openPalette();
    }
  }

  menuButton.addEventListener('click', handleMenuClick);
}
