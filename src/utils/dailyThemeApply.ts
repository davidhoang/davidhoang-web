import { getNestedValue } from './themePath';

export function clampMinContentPadding(raw: string | null) {
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

const THEME_PROPS: [string, string][] = [
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

const THEME_ATTRS: [string, string, string][] = [
  ['cards.style', 'data-card-style', 'elevated'],
  ['hero.layout', 'data-hero-layout', 'stacked-fan'],
  ['links.style', 'data-link-style', 'underline'],
  ['background.texture', 'data-bg-texture', 'none'],
  ['images.style', 'data-image-style', 'vivid'],
  ['images.hover', 'data-image-hover', 'zoom'],
  ['footer.style', 'data-footer-style', 'classic'],
];

export type ThemeApplyResult = {
  styles: Record<string, string>;
  lightColors: Record<string, string>;
  darkColors: Record<string, string>;
  attrs: Record<string, string>;
};

/** Build the styles + attrs needed to apply a theme without re-running heavy logic. */
export function buildThemeApply(theme: Record<string, unknown> | null | undefined): ThemeApplyResult {
  const styles: Record<string, string> = {};
  const lightColors: Record<string, string> =
    (theme?.colors as { light?: Record<string, string> } | undefined)?.light || {};
  const darkColors: Record<string, string> =
    (theme?.colors as { dark?: Record<string, string> } | undefined)?.dark || {};

  for (const [path, prop] of THEME_PROPS) {
    const val = getNestedValue(theme, path);
    if (val != null && val !== '') {
      const strVal = String(val);
      styles[prop] = prop === '--content-padding' ? clampMinContentPadding(strVal) : strVal;
    }
  }
  const fonts = theme?.fonts as
    | { heading?: { stack?: string }; body?: { stack?: string } }
    | undefined;
  if (fonts?.heading?.stack) styles['--font-heading'] = fonts.heading.stack;
  if (fonts?.body?.stack) {
    styles['--font-body'] = fonts.body.stack;
    styles['--font-primary'] = fonts.body.stack;
  }
  const cards = theme?.cards as { shadow?: string } | undefined;
  if (cards?.shadow && cards.shadow !== 'none') {
    styles['--card-shadow'] = cards.shadow;
  }
  const layout = theme?.layout as { borderRadius?: string; gridStyle?: string } | undefined;
  if (layout?.borderRadius) {
    const br = layout.borderRadius;
    styles['--radius-sm'] = br === '0px' ? '0px' : `calc(${br} * 0.5)`;
    styles['--radius-md'] = br;
    styles['--radius-lg'] = `calc(${br} * 1.5)`;
    styles['--radius-xl'] = `calc(${br} * 2)`;
  }
  const typography = theme?.typography as { fontVariationSettings?: string } | undefined;
  if (typography?.fontVariationSettings && typography.fontVariationSettings !== 'normal') {
    styles['--font-variation-settings'] = typography.fontVariationSettings;
  }

  const attrs: Record<string, string> = {};
  for (const [path, attr, defaultVal] of THEME_ATTRS) {
    attrs[attr] = String(getNestedValue(theme, path) ?? defaultVal);
  }
  attrs['data-daily-theme'] = String((theme as { date?: string } | undefined)?.date || '');
  const shader = theme?.shader as { type?: string; colors?: unknown } | undefined;
  attrs['data-shader'] = shader?.type || 'none';
  if (shader?.colors) attrs['data-shader-colors'] = JSON.stringify(shader.colors);
  if (layout?.gridStyle && layout.gridStyle !== 'standard') {
    attrs['data-grid-style'] = layout.gridStyle;
  }
  const contrastMode = (theme?.colors as { contrastMode?: string } | undefined)?.contrastMode;
  if (contrastMode && contrastMode !== 'standard') {
    attrs['data-contrast-mode'] = contrastMode;
  }

  return { styles, lightColors, darkColors, attrs };
}
