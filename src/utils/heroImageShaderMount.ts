/**
 * Mount HeroImageShader only when a daily theme applies hero overlay shaders.
 * Avoids hydrating the island on PageHeader pages that only need the SSR image.
 */
import { afterLcpOrTimeout } from './deferUntilAfterLcp';
import { heroShaderTypeNeedsOverlay } from './heroShaderOverlay';

const MOUNTED_ATTR = 'data-hero-shader-root';

export { heroShaderTypeNeedsOverlay } from './heroShaderOverlay';

export function shouldMountHeroImageShader(): boolean {
  if (typeof document === 'undefined') return false;
  const root = document.documentElement;
  if (root.getAttribute('data-e-ink') === 'true') return false;
  if (localStorage.getItem('daily-theme-mode') !== 'true') return false;
  return heroShaderTypeNeedsOverlay(root.getAttribute('data-shader'));
}

function hostHasMount(host: Element): boolean {
  return Boolean(host.querySelector(`[${MOUNTED_ATTR}]`));
}

let mountScheduled = false;
let mountInFlight: Promise<void> | null = null;

async function mountHeroShadersForPage(): Promise<void> {
  if (!shouldMountHeroImageShader()) return;

  const hosts = document.querySelectorAll<HTMLElement>('[data-hero-shader-mount]');
  const pending = [...hosts].filter((host) => !hostHasMount(host));
  if (pending.length === 0) return;

  const [{ default: React }, { createRoot }, { default: HeroImageShader }] = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('../components/HeroImageShader'),
  ]);

  if (!shouldMountHeroImageShader()) return;

  for (const host of pending) {
    if (hostHasMount(host)) continue;
    if (!shouldMountHeroImageShader()) break;

    const src = host.getAttribute('data-hero-src');
    if (!src) continue;
    const alt = host.getAttribute('data-hero-alt') ?? '';
    const priority = host.hasAttribute('data-hero-priority');

    const mountEl = document.createElement('div');
    mountEl.setAttribute(MOUNTED_ATTR, '');
    host.appendChild(mountEl);
    createRoot(mountEl).render(
      React.createElement(HeroImageShader, {
        src,
        alt,
        priority,
        withStaticHeroImage: true,
      }),
    );
  }
}

export async function mountHeroImageShaders(): Promise<void> {
  if (!shouldMountHeroImageShader()) return;
  if (mountInFlight) {
    await mountInFlight;
    return;
  }

  mountInFlight = mountHeroShadersForPage();
  try {
    await mountInFlight;
  } finally {
    mountInFlight = null;
  }
}

export function scheduleHeroImageShaderMount(): void {
  if (!shouldMountHeroImageShader()) return;
  if (mountScheduled || mountInFlight) return;
  mountScheduled = true;

  afterLcpOrTimeout(() => {
    void mountHeroImageShaders().finally(() => {
      mountScheduled = false;
    });
  });
}

export function initHeroImageShaderMounting(): void {
  scheduleHeroImageShaderMount();

  document.addEventListener('theme-selected', () => {
    scheduleHeroImageShaderMount();
  });
  document.addEventListener('astro:page-load', () => {
    if (!mountInFlight) mountScheduled = false;
    scheduleHeroImageShaderMount();
  });

  const obs = new MutationObserver(() => scheduleHeroImageShaderMount());
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-shader', 'data-e-ink', 'data-daily-theme'],
  });

  window.addEventListener('storage', () => scheduleHeroImageShaderMount());
}
