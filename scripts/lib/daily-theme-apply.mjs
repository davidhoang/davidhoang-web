/** @typedef {{ styles: Record<string, string>, lightColors: Record<string, string>, darkColors: Record<string, string>, attrs: Record<string, string> }} ThemeApplyResult */

/** @param {unknown} obj @param {string} path */
export function getNestedValue(obj, path) {
  return path.split('.').reduce((o, k) => {
    if (o && typeof o === 'object' && k in /** @type {Record<string, unknown>} */ (o)) {
      return /** @type {Record<string, unknown>} */ (o)[k];
    }
    return undefined;
  }, obj);
}

/** @param {string | null | undefined} raw */
export function clampMinContentPadding(raw) {
  if (!raw) return '1rem';
  const s = String(raw).trim();
  const m = s.match(/^([\d.]+)\s*(rem|px|em)?$/i);
  if (!m) return '1rem';
  let n = parseFloat(m[1]);
  const unit = (m[2] || 'rem').toLowerCase();
  if (Number.isNaN(n) || n <= 0) return '1rem';
  if (unit === 'px') n /= 16;
  return `${Math.max(1, n)}rem`;
}

const THEME_PROPS = [
  ['typography.headingWeight', '--heading-weight'],
  ['typography.bodyWeight', '--body-weight'],
  ['typography.bodyLineHeight', '--body-line-height'],
  ['typography.letterSpacing', '--letter-spacing-body'],
  ['typography.headingLetterSpacing', '--heading-letter-spacing'],
  ['typography.headingTransform', '--heading-transform'],
  ['typography.scaleRatio', '--scale-ratio'],
  ['cards.borderWidth', '--card-border-width'],
  ['cards.padding', '--card-padding'],
  ['layout.containerMaxWidth', '--container-max-width'],
  ['layout.sectionSpacing', '--section-spacing'],
  ['layout.contentPadding', '--content-padding'],
  ['images.opacity', '--image-opacity'],
  ['images.borderRadius', '--image-border-radius'],
];

const THEME_ATTRS = [
  ['cards.style', 'data-card-style', 'elevated'],
  ['hero.layout', 'data-hero-layout', 'stacked-fan'],
  ['links.style', 'data-link-style', 'underline'],
  ['background.texture', 'data-bg-texture', 'none'],
  ['images.style', 'data-image-style', 'vivid'],
  ['images.hover', 'data-image-hover', 'zoom'],
  ['footer.style', 'data-footer-style', 'classic'],
];

/** @param {Record<string, unknown> | null | undefined} theme @returns {ThemeApplyResult} */
export function buildThemeApply(theme) {
  /** @type {Record<string, string>} */
  const styles = {};
  const lightColors =
    /** @type {{ light?: Record<string, string> }} */ (theme?.colors)?.light || {};
  const darkColors =
    /** @type {{ dark?: Record<string, string> }} */ (theme?.colors)?.dark || {};

  for (const [path, prop] of THEME_PROPS) {
    const val = getNestedValue(theme, path);
    if (val != null && val !== '') {
      const strVal = String(val);
      styles[prop] = prop === '--content-padding' ? clampMinContentPadding(strVal) : strVal;
    }
  }
  const fonts = /** @type {{ heading?: { stack?: string }, body?: { stack?: string } } | undefined} */ (
    theme?.fonts
  );
  if (fonts?.heading?.stack) styles['--font-heading'] = fonts.heading.stack;
  if (fonts?.body?.stack) {
    styles['--font-body'] = fonts.body.stack;
    styles['--font-primary'] = fonts.body.stack;
  }
  const cards = /** @type {{ shadow?: string } | undefined} */ (theme?.cards);
  if (cards?.shadow && cards.shadow !== 'none') {
    styles['--card-shadow'] = cards.shadow;
  }
  const layout = /** @type {{ borderRadius?: string, gridStyle?: string } | undefined} */ (theme?.layout);
  if (layout?.borderRadius) {
    const br = layout.borderRadius;
    styles['--radius-sm'] = br === '0px' ? '0px' : `calc(${br} * 0.5)`;
    styles['--radius-md'] = br;
    styles['--radius-lg'] = `calc(${br} * 1.5)`;
    styles['--radius-xl'] = `calc(${br} * 2)`;
  }
  const typography = /** @type {{ fontVariationSettings?: string } | undefined} */ (theme?.typography);
  if (typography?.fontVariationSettings && typography.fontVariationSettings !== 'normal') {
    styles['--font-variation-settings'] = typography.fontVariationSettings;
  }

  /** @type {Record<string, string>} */
  const attrs = {};
  for (const [path, attr, defaultVal] of THEME_ATTRS) {
    attrs[attr] = String(getNestedValue(theme, path) ?? defaultVal);
  }
  attrs['data-daily-theme'] = String(/** @type {{ date?: string } | undefined} */ (theme)?.date || '');
  const shader = /** @type {{ type?: string, colors?: unknown } | undefined} */ (theme?.shader);
  attrs['data-shader'] = shader?.type || 'none';
  if (shader?.colors) attrs['data-shader-colors'] = JSON.stringify(shader.colors);
  if (layout?.gridStyle && layout.gridStyle !== 'standard') {
    attrs['data-grid-style'] = layout.gridStyle;
  }
  const contrastMode = /** @type {{ contrastMode?: string } | undefined} */ (theme?.colors)?.contrastMode;
  if (contrastMode && contrastMode !== 'standard') {
    attrs['data-contrast-mode'] = contrastMode;
  }

  return { styles, lightColors, darkColors, attrs };
}
