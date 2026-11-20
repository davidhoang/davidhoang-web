import { heroShaderTypeNeedsOverlay } from './heroShaderOverlay';
import { importEsm } from './esmImport';
import shaderMountEntryUrl from './shader-mount-entry.ts?url';

function shaderTypeNeedsBackground(shaderType: string | null | undefined): boolean {
  return Boolean(shaderType && shaderType !== 'none');
}

function shouldLoadShaderMountBundle(): boolean {
  if (typeof document === 'undefined') return false;
  const root = document.documentElement;
  if (root.getAttribute('data-e-ink') === 'true') return false;
  if (shaderTypeNeedsBackground(root.getAttribute('data-shader'))) return true;
  if (localStorage.getItem('daily-theme-mode') !== 'true') return false;
  if (!heroShaderTypeNeedsOverlay(root.getAttribute('data-shader'))) return false;
  return Boolean(document.querySelector('[data-hero-shader-mount]'));
}

let listenBound = false;

async function loadShaderMountModules(): Promise<void> {
  const {
    initShaderBackgroundMounting,
    initHeroImageShaderMounting,
  } = await importEsm<typeof import('./shader-mount-entry')>(shaderMountEntryUrl);
  initShaderBackgroundMounting();
  initHeroImageShaderMounting();
}

export function initShaderMountsWhenNeeded(): void {
  const run = () => {
    if (!shouldLoadShaderMountBundle()) return;
    void loadShaderMountModules();
  };

  run();

  if (listenBound) return;
  listenBound = true;

  document.addEventListener('theme-selected', run);
  document.addEventListener('astro:page-load', run);
  document.addEventListener('storage', run);

  new MutationObserver(run).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-shader', 'data-e-ink', 'data-daily-theme'],
  });
}