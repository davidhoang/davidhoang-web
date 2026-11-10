/**
 * Mount ShaderBackground only when a theme actually uses a site-wide shader.
 * Avoids pulling react-vendor onto long-form writing/notes pages on no-shader days.
 */
import { afterLcpOrTimeout } from './deferUntilAfterLcp';

const MOUNTED_ATTR = 'data-shader-background-root';

export function shaderTypeNeedsBackground(shaderType: string | null | undefined): boolean {
  return Boolean(shaderType && shaderType !== 'none');
}

function shouldMountShaderBackground(): boolean {
  if (typeof document === 'undefined') return false;
  const root = document.documentElement;
  if (root.getAttribute('data-e-ink') === 'true') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return shaderTypeNeedsBackground(root.getAttribute('data-shader'));
}

function shellHasMount(): boolean {
  const shell = document.querySelector('.shader-background-shell');
  return Boolean(shell?.querySelector(`[${MOUNTED_ATTR}]`) || shell?.querySelector('astro-island'));
}

let mountScheduled = false;

export async function mountShaderBackground(): Promise<void> {
  if (!shouldMountShaderBackground() || shellHasMount()) return;

  const shell = document.querySelector('.shader-background-shell');
  if (!shell) return;

  const [{ default: React }, { createRoot }, { default: ShaderBackground }] = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('../components/ShaderBackground'),
  ]);

  const host = document.createElement('div');
  host.setAttribute(MOUNTED_ATTR, '');
  shell.appendChild(host);
  createRoot(host).render(React.createElement(ShaderBackground));
}

export function scheduleShaderBackgroundMount(): void {
  if (!shouldMountShaderBackground() || shellHasMount()) return;
  if (mountScheduled) return;
  mountScheduled = true;

  afterLcpOrTimeout(() => {
    mountScheduled = false;
    void mountShaderBackground();
  });
}

export function initShaderBackgroundMounting(): void {
  scheduleShaderBackgroundMount();

  document.addEventListener('theme-selected', () => {
    scheduleShaderBackgroundMount();
  });
  document.addEventListener('astro:page-load', () => {
    mountScheduled = false;
    scheduleShaderBackgroundMount();
  });

  const obs = new MutationObserver(() => scheduleShaderBackgroundMount());
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-shader', 'data-e-ink'],
  });
}
