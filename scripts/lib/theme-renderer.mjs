import { createServer } from 'node:net';
import { dev as startAstroDevServer } from 'astro';
import sharp from 'sharp';
import { chromium } from 'playwright';

export const THEME_RENDER_VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'wide', width: 1920, height: 1080 },
];
export const THEME_MOBILE_BREAKPOINT = 768;

/**
 * Render candidates and recent themes against the real home page. Screenshots
 * are reduced to grayscale edge signatures in memory. Callers may persist
 * signatures via `theme-signature-cache.mjs` so later runs skip cache hits.
 */
export async function renderThemeSet({ rootDir, entries, viewports = THEME_RENDER_VIEWPORTS }) {
  const server = await startAstroServer(rootDir);
  let browser = null;
  const results = Object.fromEntries(entries.map(({ id }) => [id, { viewports: {} }]));

  try {
    browser = await chromium.launch({ headless: true });
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        reducedMotion: 'no-preference',
        colorScheme: 'light',
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      await page.route('**/*', async (route) => {
        const requestUrl = new URL(route.request().url());
        // Stub Google Fonts locally — live fetches flake in CI and can stall
        // Playwright's screenshot font wait past the 30s default timeout.
        if (requestUrl.hostname === 'fonts.googleapis.com') {
          await route.fulfill({
            status: 200,
            contentType: 'text/css; charset=utf-8',
            body: stubGoogleFontsCss(requestUrl),
          });
          return;
        }
        if (requestUrl.hostname === 'fonts.gstatic.com') {
          await route.abort();
          return;
        }
        const allowedHost =
          requestUrl.hostname === '127.0.0.1'
          || requestUrl.hostname === 'localhost';
        if (allowedHost || requestUrl.protocol === 'data:' || requestUrl.protocol === 'blob:') {
          await route.continue();
        } else {
          await route.abort();
        }
      });

      await page.addInitScript(() => {
        localStorage.setItem('daily-theme-mode', 'false');
        localStorage.setItem('e-ink-mode', 'false');
      });
      await page.goto(server.url, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.card-stack-hero', { timeout: 15000 });
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-delay: 0s !important;
            animation-duration: 0.001ms !important;
            transition-delay: 0s !important;
            transition-duration: 0.001ms !important;
            caret-color: transparent !important;
          }
        `,
      });

      for (const entry of entries) {
        await applyTheme(page, entry.theme);
        const expectedHero = viewport.width <= THEME_MOBILE_BREAKPOINT
          ? 'stacked-fan'
          : entry.theme.hero?.layout;
        if (expectedHero) {
          await page.waitForFunction(
            (layout) => document.querySelector('.card-stack-hero')?.classList.contains(`card-stack-hero--${layout}`),
            expectedHero,
            { timeout: 5000 },
          ).catch(() => {});
        }

        await page.evaluate(async () => {
          await Promise.race([
            document.fonts?.ready || Promise.resolve(),
            new Promise((resolve) => window.setTimeout(resolve, 300)),
          ]);
          document.querySelectorAll('img[loading="lazy"]').forEach((image) => image.classList.add('loaded'));
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(80);

        const metrics = await collectMetrics(page, viewport.width, expectedHero);
        const screenshot = await page.screenshot({
          fullPage: true,
          type: 'png',
          animations: 'disabled',
          timeout: 60_000,
        });
        const signature = await createEdgeSignature(screenshot);
        results[entry.id].viewports[viewport.name] = { metrics, signature };
      }

      await context.close();
    }
  } finally {
    try {
      if (browser) await browser.close();
    } finally {
      await server.stop();
    }
  }

  return { results, viewports };
}

async function applyTheme(page, theme) {
  await page.evaluate((candidate) => {
    const root = document.documentElement;
    const styleProperties = [
      '--heading-weight', '--body-weight', '--body-line-height', '--letter-spacing-body',
      '--heading-letter-spacing', '--heading-transform', '--scale-ratio',
      '--card-border-width', '--card-padding', '--card-shadow',
      '--container-max-width', '--section-spacing', '--content-padding',
      '--image-opacity', '--image-border-radius', '--font-variation-settings',
      '--font-primary', '--font-heading', '--font-body',
      '--radius-sm', '--radius-md', '--radius-lg', '--radius-xl',
      '--color-text', '--color-bg', '--color-link', '--color-link-hover',
      '--color-border', '--color-muted', '--color-sidebar-bg',
      '--color-nav-bg', '--color-nav-text', '--color-card-bg',
    ];
    const attributes = [
      'data-card-style', 'data-hero-layout', 'data-link-style', 'data-bg-texture',
      'data-image-style', 'data-image-hover', 'data-footer-style', 'data-grid-style',
      'data-contrast-mode', 'data-shader', 'data-shader-colors',
    ];

    styleProperties.forEach((property) => root.style.removeProperty(property));
    attributes.forEach((attribute) => root.removeAttribute(attribute));
    root.removeAttribute('data-e-ink');
    root.setAttribute('data-theme', 'light');

    for (const [property, value] of Object.entries(candidate.colors?.light || {})) {
      root.style.setProperty(property, String(value));
    }

    const propertyMap = [
      [candidate.typography?.headingWeight, '--heading-weight'],
      [candidate.typography?.bodyWeight, '--body-weight'],
      [candidate.typography?.bodyLineHeight, '--body-line-height'],
      [candidate.typography?.letterSpacing, '--letter-spacing-body'],
      [candidate.typography?.headingLetterSpacing, '--heading-letter-spacing'],
      [candidate.typography?.headingTransform, '--heading-transform'],
      [candidate.typography?.scaleRatio, '--scale-ratio'],
      [candidate.cards?.borderWidth, '--card-border-width'],
      [candidate.cards?.padding, '--card-padding'],
      [candidate.layout?.containerMaxWidth, '--container-max-width'],
      [candidate.layout?.sectionSpacing, '--section-spacing'],
      [candidate.layout?.contentPadding, '--content-padding'],
      [candidate.images?.opacity, '--image-opacity'],
      [candidate.images?.borderRadius, '--image-border-radius'],
      [candidate.typography?.fontVariationSettings, '--font-variation-settings'],
    ];
    for (const [value, property] of propertyMap) {
      if (value != null && value !== '' && value !== 'normal') {
        root.style.setProperty(property, String(value));
      }
    }

    if (candidate.fonts?.heading?.stack) {
      root.style.setProperty('--font-heading', candidate.fonts.heading.stack);
    }
    if (candidate.fonts?.body?.stack) {
      root.style.setProperty('--font-body', candidate.fonts.body.stack);
      root.style.setProperty('--font-primary', candidate.fonts.body.stack);
    }
    if (candidate.cards?.shadow && candidate.cards.shadow !== 'none') {
      root.style.setProperty('--card-shadow', candidate.cards.shadow);
    }
    if (candidate.layout?.borderRadius) {
      const radius = candidate.layout.borderRadius;
      root.style.setProperty('--radius-sm', radius === '0px' ? '0px' : `calc(${radius} * 0.5)`);
      root.style.setProperty('--radius-md', radius);
      root.style.setProperty('--radius-lg', `calc(${radius} * 1.5)`);
      root.style.setProperty('--radius-xl', `calc(${radius} * 2)`);
    }

    const attributeMap = [
      ['data-card-style', candidate.cards?.style || 'elevated'],
      ['data-hero-layout', candidate.hero?.layout || 'stacked-fan'],
      ['data-link-style', candidate.links?.style || 'underline'],
      ['data-bg-texture', candidate.background?.texture || 'none'],
      ['data-image-style', candidate.images?.style || 'vivid'],
      ['data-image-hover', candidate.images?.hover || 'none'],
      ['data-footer-style', candidate.footer?.style || 'classic'],
      ['data-shader', candidate.shader?.type || 'none'],
    ];
    for (const [attribute, value] of attributeMap) {
      root.setAttribute(attribute, String(value));
    }
    if (candidate.layout?.gridStyle && candidate.layout.gridStyle !== 'standard') {
      root.setAttribute('data-grid-style', candidate.layout.gridStyle);
    }
    if (candidate.colors?.contrastMode && candidate.colors.contrastMode !== 'standard') {
      root.setAttribute('data-contrast-mode', candidate.colors.contrastMode);
    }
    if (candidate.shader?.colors) {
      root.setAttribute('data-shader-colors', JSON.stringify(candidate.shader.colors));
    }

    document.querySelectorAll('link[data-theme-render-font]').forEach((link) => link.remove());
    const fontUrls = [candidate.fonts?.heading?.url, candidate.fonts?.body?.url].filter(Boolean);
    [...new Set(fontUrls)].forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.dataset.themeRenderFont = 'true';
      document.head.appendChild(link);
    });

    root.setAttribute('data-daily-theme', candidate.date || 'theme-render');
    document.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: candidate } }));
  }, theme);
}

async function collectMetrics(page, viewportWidth, expectedHero) {
  return page.evaluate(({ width, heroLayout, mobileBreakpoint }) => {
    const root = document.documentElement;
    const body = document.body;
    const nav = document.querySelector('.site-nav');
    const grids = [...document.querySelectorAll('.philosophy-grid, .portfolio-grid')];
    const cards = [...document.querySelectorAll('.philosophy-item.card, .portfolio-content.card')];
    const hero = document.querySelector('.card-stack-hero');
    const documentOverflowPx = Math.max(root.scrollWidth, body.scrollWidth) - width;
    const boundedContent = [
      ...document.querySelectorAll('.design-philosophy, .portfolio-section, .newsletter-section, .site-footer'),
    ];
    const overflowDetails = boundedContent.map((element) => {
      const rect = element.getBoundingClientRect();
      const boundsOverflow = Math.max(0, rect.right - width, -rect.left);
      const internalOverflow = Math.max(0, element.scrollWidth - element.clientWidth);
      return {
        element: element.className,
        overflowPx: Math.max(boundsOverflow, internalOverflow),
        boundsOverflow,
        internalOverflow,
        children: [...element.children].map((child) => {
          const childRect = child.getBoundingClientRect();
          return {
            element: child.className || child.tagName.toLowerCase(),
            left: Math.round(childRect.left),
            right: Math.round(childRect.right),
            width: Math.round(childRect.width),
            scrollWidth: child.scrollWidth,
          };
        }),
      };
    }).filter((detail) => detail.overflowPx > 1);
    const overflowPx = overflowDetails.reduce((largest, detail) => Math.max(largest, detail.overflowPx), 0);

    const cardOpacityIssues = cards.filter((card) => {
      const color = getComputedStyle(card).backgroundColor;
      if (color === 'transparent') return true;

      const legacyAlpha = color.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\s*\)$/);
      if (legacyAlpha) return Number(legacyAlpha[1]) < 0.99;

      const modernAlpha = color.match(/\/\s*([\d.]+)(%)?\s*\)$/);
      if (modernAlpha) {
        const alpha = Number(modernAlpha[1]) / (modernAlpha[2] ? 100 : 1);
        return alpha < 0.99;
      }

      return false;
    }).length;

    const mobileGridIssues = width <= mobileBreakpoint
      ? grids.filter((grid) => getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length !== 1).length
      : 0;

    const issues = [];
    if (overflowPx > 1) issues.push(`horizontal-overflow:${Math.round(overflowPx)}px`);
    if (nav && getComputedStyle(nav).position !== 'fixed') issues.push('nav-not-fixed');
    if (cardOpacityIssues > 0) issues.push(`transparent-cards:${cardOpacityIssues}`);
    if (mobileGridIssues > 0) issues.push(`mobile-multicolumn-grids:${mobileGridIssues}`);
    if (heroLayout && !hero?.classList.contains(`card-stack-hero--${heroLayout}`)) {
      issues.push(`hero-layout-mismatch:${heroLayout}`);
    }

    return {
      issues,
      overflowPx,
      documentOverflowPx,
      overflowDetails,
      navFixed: nav ? getComputedStyle(nav).position === 'fixed' : false,
      cardOpacityIssues,
      mobileGridIssues,
      heroLayout: [...(hero?.classList || [])].find((name) => name.startsWith('card-stack-hero--') && name !== 'card-stack-hero--layout-ready') || null,
      sectionHeadingSizes: [...document.querySelectorAll('.home-section-heading')]
        .map((heading) => Number.parseFloat(getComputedStyle(heading).fontSize)),
    };
  }, {
    width: viewportWidth,
    heroLayout: expectedHero,
    mobileBreakpoint: THEME_MOBILE_BREAKPOINT,
  });
}

async function createEdgeSignature(buffer) {
  const { data } = await sharp(buffer)
    .flatten({ background: '#ffffff' })
    .grayscale()
    .resize(64, 128, { fit: 'fill' })
    .convolve({
      width: 3,
      height: 3,
      kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
      scale: 1,
      offset: 128,
    })
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return Array.from(data);
}

async function startAstroServer(rootDir) {
  const port = await findOpenPort();
  process.env.ASTRO_TELEMETRY_DISABLED = '1';
  // AstroInlineConfig only honors host/port under `server` — top-level keys are
  // ignored and the default ::1:4321 bind makes 127.0.0.1 fetches fail in CI.
  const server = await startAstroDevServer({
    root: rootDir,
    server: {
      host: '127.0.0.1',
      port,
    },
    logLevel: 'silent',
  });

  const boundPort = server.address?.port ?? port;
  return {
    url: `http://127.0.0.1:${boundPort}/?layout=default`,
    async stop() {
      await server.stop();
    },
  };
}

function findOpenPort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : null;
      server.close(() => port ? resolve(port) : reject(new Error('Unable to allocate preview port')));
    });
  });
}

/**
 * Map Google Fonts CSS URLs to instant local() faces so theme stacks keep their
 * family names without network I/O during render checks.
 */
function stubGoogleFontsCss(requestUrl) {
  const families = requestUrl.searchParams.getAll('family');
  if (families.length === 0) return '/* stub: no families */';

  return families.map((raw) => {
    const familyName = decodeURIComponent(raw.split(':')[0]).replace(/\+/g, ' ').replace(/'/g, '\\\'');
    return `
@font-face {
  font-family: '${familyName}';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: local('Arial'), local('Helvetica Neue'), local('Helvetica');
}
@font-face {
  font-family: '${familyName}';
  font-style: italic;
  font-weight: 100 900;
  font-display: swap;
  src: local('Arial Italic'), local('Helvetica Neue Italic'), local('Helvetica Oblique');
}
`.trim();
  }).join('\n');
}
