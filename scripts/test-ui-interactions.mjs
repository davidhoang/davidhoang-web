import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Run against an already-started local or preview server.
const base = process.env.UI_TEST_URL || 'http://127.0.0.1:4321';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
const visible = async (selector) => page.locator(`${selector}:visible`).count();
const focused = (selector) => page.locator(selector).evaluate(el => el === document.activeElement);
const check = (message) => console.log(`PASS ${message}`);

try {
  await page.goto(`${base}/notes`);
  await page.locator('#notes-grid[data-initialized=true]').waitFor();
  const totalNotes = await visible('.note-card');
  await page.getByRole('searchbox', { name: 'Search notes' }).fill('zzzz-no-match');
  assert.equal(await visible('.note-card'), 0);
  assert.equal(await page.locator('#notes-results-count').textContent(), '0 notes');
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  assert.equal(await visible('.note-card'), totalNotes);
  assert.ok(await focused('#notes-search'));
  await page.locator('#topic-chips [data-tag=ai]').click();
  assert.equal(await page.locator('#topic-chips [aria-pressed=true]').count(), 1);
  assert.ok(await visible('.note-card') < totalNotes);
  await page.getByRole('searchbox', { name: 'Search notes' }).fill('interface');
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  assert.ok(await focused('#notes-search'));
  check('Notes search, combined filters, counts, clear button, and empty-state recovery');

  await page.getByRole('button', { name: 'Search site', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.locator('#cmdPaletteResults .cmd-palette-item').first().waitFor();
  assert.ok(await focused('#cmdPaletteInput'));
  await page.locator('#cmdPaletteInput').fill('design');
  assert.ok(await visible('.cmd-palette-item') > 0);
  await page.keyboard.press('ArrowDown');
  assert.ok(await page.locator('#cmdPaletteInput').getAttribute('aria-activedescendant'));
  await page.keyboard.press('Escape');
  assert.ok(await focused('.cmd-k-hint'));
  assert.equal(await page.locator('.cmd-k-hint').getAttribute('aria-expanded'), 'false');
  check('Search keyboard entry, results, navigation, Escape, and focus restoration');

  await page.locator('.desktop-nav a[href="/writing"]').click();
  await page.waitForURL('**/writing');
  await page.locator('.writing-view-tabs[data-initialized=true]').waitFor();
  assert.equal(await page.locator('.desktop-nav a[href="/writing"]').getAttribute('aria-current'), 'page');
  await page.getByRole('tab', { name: 'Editorial', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.getByRole('tab', { name: 'List', exact: true }).getAttribute('aria-selected'), 'true');
  assert.equal(await visible('[data-view-panel]'), 1);
  const featuredTags = (await page.locator('.writing-spotlight__link').getAttribute('data-tags')).split(',');
  const nonFeaturedChip = await page.locator('.writing-chip').evaluateAll(
    (els, tags) => els.find(el => el.dataset.tag !== 'all' && !tags.includes(el.dataset.tag))?.dataset.tag,
    featuredTags,
  );
  assert.ok(nonFeaturedChip);
  await page.locator('.writing-toolbar').getByRole('button', { name: nonFeaturedChip, exact: true }).click();
  assert.equal(await page.locator('.writing-chip[aria-pressed=true]').count(), 1);
  assert.ok(await visible('.writing-feed__item') > 0);
  assert.equal(await visible('.writing-feed__item[hidden]'), 0);
  await page.getByRole('tab', { name: 'List', exact: true }).focus();
  await page.keyboard.press('Home');
  assert.equal(await visible('.writing-spotlight'), 0);
  assert.equal(await page.getByRole('tab', { name: 'Editorial' }).getAttribute('tabindex'), '0');
  await page.keyboard.press('End');
  assert.equal(await visible('.writing-toolbar'), 0);
  await page.keyboard.press('Home');
  assert.equal(await visible('.writing-toolbar'), 1);
  check('Writing tabs, arrow/Home/End keys, semantic panels, filtering, and hidden spotlight');

  await page.locator('.writing-chip[data-tag=all]').click();
  await page.locator('.writing-spotlight__link').click();
  await page.waitForURL(/\/writing\/.+/);
  await page.waitForFunction(() => document.querySelector('.desktop-nav a[href="/writing"]')?.getAttribute('aria-current') === 'location');
  assert.equal(await visible('[data-share-native]'), 0);
  check('Persistent navigation updates on article routes; unsupported native sharing stays hidden');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#menuButton').click();
  await page.locator('#mobileMenu.is-open').waitFor();
  assert.ok(await page.locator('.content-filter-wrapper').evaluate(el => el.inert));
  assert.ok(await focused('#mobileMenu .mobile-menu__links > li:first-child > a'));
  await page.keyboard.press('Shift+Tab');
  assert.ok(await focused('#menuButton'));
  await page.keyboard.press('Shift+Tab');
  assert.ok(await page.locator('#mobileMenu a').last().evaluate(el => el === document.activeElement));
  await page.keyboard.press('Tab');
  assert.ok(await focused('#menuButton'));
  await page.keyboard.press('Escape');
  assert.ok(await focused('#menuButton'));
  assert.equal(await visible('#mobileMenu'), 0);
  assert.equal(await page.locator('.content-filter-wrapper').evaluate(el => el.inert), false);
  await page.locator('#menuButton').click();
  await page.locator('#mobileMenu.is-open').waitFor();
  await page.locator('#mobileMenu a[href="/subscribe"]').click();
  await page.waitForURL('**/subscribe');
  assert.equal(await page.locator('body').evaluate(el => el.classList.contains('mobile-menu-open')), false);
  check('Mobile menu focus loop, inert background, Escape, reduced motion, and route cleanup');

  await page.locator('form[data-substack-signup][data-initialized=true]').waitFor();
  const signup = page.locator('form[data-substack-signup]');
  assert.equal(await signup.locator('input').getAttribute('placeholder'), 'you@example.com');
  assert.equal(await signup.locator('input').evaluate(el => el.checkValidity()), false);
  // Exercise the actual submit handler while canceling only the external navigation.
  await signup.evaluate(form => form.addEventListener('submit', event => event.preventDefault()));
  await signup.locator('input').fill('ui-check@example.com');
  await signup.getByRole('button', { name: 'Subscribe' }).click();
  assert.equal(await signup.getAttribute('aria-busy'), 'true');
  assert.ok(await signup.getByRole('button').isDisabled());
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  assert.equal(await signup.getByRole('button').isDisabled(), false);
  assert.equal(await signup.getAttribute('aria-busy'), null);
  check('Newsletter validation, loading feedback, and back/forward-cache recovery without external submission');

  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 769 ? 844 : 1000 });
    for (const route of ['/', '/about', '/featured', '/writing', '/notes', '/subscribe']) {
      const response = await page.goto(`${base}${route}`);
      assert.equal(response.status(), 200, `${route} HTTP status`);
      await page.locator('main').waitFor();
      // Measure the hydrated hero, not its Suspense placeholder.
      if (route === '/') await page.locator('.card-stack-hero--layout-ready').waitFor();
      const metrics = await page.evaluate(() => {
        const nav = document.querySelector('.site-nav');
        const hero = document.querySelector('.page-header--image');
        const heroRect = hero?.getBoundingClientRect();
        return {
          width: document.documentElement.clientWidth,
          scroll: document.documentElement.scrollWidth,
          navPosition: getComputedStyle(nav).position,
          navHeight: nav.getBoundingClientRect().height,
          hero: heroRect && { left: heroRect.left, top: heroRect.top, width: heroRect.width },
        };
      });
      assert.ok(metrics.scroll <= metrics.width + 1, `${route} overflows at ${width}px`);
      assert.equal(metrics.navPosition, 'fixed');
      assert.equal(Math.round(metrics.navHeight), width <= 768 ? 56 : 48);
      if (metrics.hero) {
        assert.ok(Math.abs(metrics.hero.left) <= 1 && Math.abs(metrics.hero.top) <= 1, `${route} hero alignment at ${width}`);
        assert.ok(metrics.hero.width >= metrics.width, `${route} hero width at ${width}`);
      }
    }
    check(`Six main routes: viewport safety, fixed nav, and flush heroes at ${width}px`);
  }
  const touchContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const touchPage = await touchContext.newPage();
  touchPage.on('pageerror', (error) => errors.push(error.message));
  await touchPage.goto(`${base}/notes`);
  await touchPage.locator('#notes-grid[data-initialized=true]').waitFor();
  const targets = await touchPage.locator('.chip').evaluateAll(els =>
    els.map(el => el.getBoundingClientRect().height));
  assert.ok(targets.every(height => height >= 44));
  await touchPage.locator('#menuButton').tap();
  await touchPage.locator('#mobileMenu.is-open').waitFor();
  await touchPage.locator('#menuButton').tap();
  await touchPage.locator('#mobileMenu').waitFor({ state: 'hidden' });
  assert.equal(await touchPage.locator('.content-filter-wrapper').evaluate(el => el.inert), false);
  await touchContext.close();
  check('Touch targets and animated mobile-menu dismissal');

  assert.deepEqual(errors, []);
  check('No uncaught browser errors');
} finally {
  await browser.close();
}
