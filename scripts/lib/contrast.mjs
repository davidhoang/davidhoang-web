/**
 * WCAG AA Contrast Validation
 *
 * Validates and fixes color contrast ratios in generated themes
 * to ensure accessibility compliance (WCAG AA: 4.5:1 for normal text,
 * 3:1 for large text and UI components).
 */

/** @typedef {{ mode: string, pair: string, foreground: string, background: string, ratio: number, target: number }} ContrastFailure */
/** @typedef {{ mode: string, pair: string, original: string, fixed: string, originalRatio: string, fixedRatio: string, target: number }} ContrastFix */

/**
 * Pairs checked for WCAG AA body-text contrast (4.5:1).
 * Exported so evals and audits stay in sync with the generator gate.
 * @type {ReadonlyArray<[string, string, number, string]>}
 */
export const CONTRAST_PAIRS = [
  ['--color-text', '--color-bg', 4.5, 'body text on background'],
  ['--color-link', '--color-bg', 4.5, 'link on background'],
  ['--color-muted', '--color-bg', 4.5, 'muted text on background'],
  ['--color-text', '--color-card-bg', 4.5, 'text on card background'],
  ['--color-link', '--color-card-bg', 4.5, 'link on card background'],
  ['--color-nav-text', '--color-nav-bg', 4.5, 'nav text on nav background'],
];

/** Hero marker highlight (large display text over .link-highlighter) — 3:1 UI/large-text gate */
export const MARKER_CONTRAST_PAIRS = [
  ['--color-text', '--color-highlighter', 3, 'display text on hero marker highlight'],
];

const DEFAULT_MARKER = '#F4E76E';

/**
 * Ensure --color-highlighter meets contrast for display text (hero role links).
 * @param {Record<string, string>} colors
 */
export function ensureMarkerHighlight(colors) {
  const text = colors['--color-text'];
  if (!text) return;
  if (!Object.prototype.hasOwnProperty.call(colors, '--color-highlighter')) return;

  const seed = colors['--color-highlighter'] || DEFAULT_MARKER;
  const ratio = contrastRatio(text, seed);
  colors['--color-highlighter'] =
    ratio >= 3 ? seed.toUpperCase() : adjustColorForContrast(seed, text, 3);
}

/** Seed hero marker from link accent when themes omit the token (generation pipeline). */
export function seedMarkerHighlight(colors) {
  if (!colors['--color-text']) return;
  if (!colors['--color-highlighter']) {
    colors['--color-highlighter'] = colors['--color-link'] || DEFAULT_MARKER;
  }
  ensureMarkerHighlight(colors);
}

/**
 * Parse a hex color string to RGB values
 */
function hexToRgb(hex) {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return { r, g, b };
}

/**
 * Convert RGB to hex
 */
function rgbToHex({ r, g, b }) {
  const toHex = (c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Calculate relative luminance per WCAG 2.0
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function relativeLuminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
export function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Darken or lighten a color to meet a target contrast ratio against a background
 */
function adjustColorForContrast(fgHex, bgHex, targetRatio) {
  const bgLum = relativeLuminance(hexToRgb(bgHex));
  const fgRgb = hexToRgb(fgHex);
  const fgLum = relativeLuminance(fgRgb);

  // Determine if we need to lighten or darken
  const fgIsLighter = fgLum > bgLum;

  let bestColor = fgHex;
  let bestRatio = contrastRatio(fgHex, bgHex);

  // Adjust in small steps
  for (let step = 0.05; step <= 1.0; step += 0.05) {
    let adjusted;
    if (fgIsLighter) {
      // Make lighter
      adjusted = {
        r: fgRgb.r + (255 - fgRgb.r) * step,
        g: fgRgb.g + (255 - fgRgb.g) * step,
        b: fgRgb.b + (255 - fgRgb.b) * step,
      };
    } else {
      // Make darker
      adjusted = {
        r: fgRgb.r * (1 - step),
        g: fgRgb.g * (1 - step),
        b: fgRgb.b * (1 - step),
      };
    }

    const adjustedHex = rgbToHex(adjusted);
    const ratio = contrastRatio(adjustedHex, bgHex);

    if (ratio >= targetRatio) {
      return adjustedHex;
    }

    if (ratio > bestRatio) {
      bestColor = adjustedHex;
      bestRatio = ratio;
    }
  }

  // If we can't reach the target by going in one direction, try the other
  for (let step = 0.05; step <= 1.0; step += 0.05) {
    let adjusted;
    if (fgIsLighter) {
      adjusted = {
        r: fgRgb.r * (1 - step),
        g: fgRgb.g * (1 - step),
        b: fgRgb.b * (1 - step),
      };
    } else {
      adjusted = {
        r: fgRgb.r + (255 - fgRgb.r) * step,
        g: fgRgb.g + (255 - fgRgb.g) * step,
        b: fgRgb.b + (255 - fgRgb.b) * step,
      };
    }

    const adjustedHex = rgbToHex(adjusted);
    const ratio = contrastRatio(adjustedHex, bgHex);

    if (ratio >= targetRatio) {
      return adjustedHex;
    }
  }

  return bestColor;
}

/**
 * Non-mutating audit of one color mode.
 * @returns {ContrastFailure[]}
 */
function auditMode(colors, modeName) {
  /** @type {ContrastFailure[]} */
  const failures = [];
  if (!colors) return failures;

  for (const [fgVar, bgVar, minRatio, label] of [...CONTRAST_PAIRS, ...MARKER_CONTRAST_PAIRS]) {
    const fg = colors[fgVar];
    const bgColor = colors[bgVar];
    if (!fg || !bgColor) continue;

    const ratio = contrastRatio(fg, bgColor);
    if (ratio < minRatio) {
      failures.push({
        mode: modeName,
        pair: label,
        foreground: fg,
        background: bgColor,
        ratio,
        target: minRatio,
      });
    }
  }

  return failures;
}

/**
 * Validate and fix contrast issues in a theme's color mode (light or dark)
 *
 * Returns an object with { colors, fixes } where fixes lists any changes made
 */
function validateMode(colors, modeName) {
  /** @type {ContrastFix[]} */
  const fixes = [];

  const fixed = { ...colors };

  for (const [fgVar, bgVar, minRatio, label] of CONTRAST_PAIRS) {
    const fg = fixed[fgVar];
    const bgColor = fixed[bgVar];
    if (!fg || !bgColor) continue;

    const ratio = contrastRatio(fg, bgColor);
    if (ratio < minRatio) {
      const newFg = adjustColorForContrast(fg, bgColor, minRatio);
      const newRatio = contrastRatio(newFg, bgColor);
      fixes.push({
        mode: modeName,
        pair: label,
        original: fg,
        fixed: newFg,
        originalRatio: ratio.toFixed(2),
        fixedRatio: newRatio.toFixed(2),
        target: minRatio,
      });
      fixed[fgVar] = newFg;
    }
  }

  if (Object.prototype.hasOwnProperty.call(fixed, '--color-highlighter')) {
    const text = fixed['--color-text'];
    const markerPrior = fixed['--color-highlighter'] || DEFAULT_MARKER;
    const markerRatioPrior = text ? contrastRatio(text, markerPrior) : 99;
    ensureMarkerHighlight(fixed);
    const markerNext = fixed['--color-highlighter'];
    if (text && markerNext && markerRatioPrior < 3 && markerPrior !== markerNext) {
      fixes.push({
        mode: modeName,
        pair: 'display text on hero marker highlight',
        original: markerPrior,
        fixed: markerNext,
        originalRatio: markerRatioPrior.toFixed(2),
        fixedRatio: contrastRatio(text, markerNext).toFixed(2),
        target: 3,
      });
    }
  }

  return { colors: fixed, fixes };
}

/**
 * Non-mutating WCAG AA audit for a theme.
 * Does not change theme colors — safe for regression checks and --check mode.
 *
 * @param {object} themeData
 * @returns {ContrastFailure[]}
 */
export function auditThemeContrast(themeData) {
  /** @type {ContrastFailure[]} */
  const failures = [];

  if (themeData?.colors?.light) {
    failures.push(...auditMode(themeData.colors.light, 'light'));
  }

  if (themeData?.colors?.dark) {
    failures.push(...auditMode(themeData.colors.dark, 'dark'));
  }

  return failures;
}

/**
 * Validate and fix contrast for an entire theme.
 *
 * Modifies colors in-place and returns a list of fixes applied.
 * Prefer {@link enforceThemeContrast} at generation time so unfixable
 * palettes cannot ship.
 *
 * @param {object} themeData
 * @returns {ContrastFix[]}
 */
export function validateThemeContrast(themeData) {
  const allFixes = [];

  if (themeData.colors?.light) {
    const { colors, fixes } = validateMode(themeData.colors.light, 'light');
    themeData.colors.light = colors;
    allFixes.push(...fixes);
  }

  if (themeData.colors?.dark) {
    const { colors, fixes } = validateMode(themeData.colors.dark, 'dark');
    themeData.colors.dark = colors;
    allFixes.push(...fixes);
  }

  return allFixes;
}

/**
 * Format contrast failures for logs and error messages.
 * @param {ContrastFailure[]} failures
 */
export function formatContrastFailures(failures) {
  return failures
    .map(
      (f) =>
        `[${f.mode}] ${f.pair}: ${f.foreground} on ${f.background} ` +
        `(${f.ratio.toFixed(2)}:1 < ${f.target}:1)`,
    )
    .join('; ');
}

/**
 * Fix contrast issues, then hard-fail if any pair still misses WCAG AA.
 * Mutates theme colors in place when fixes are applied.
 *
 * @param {object} themeData
 * @returns {{ fixes: ContrastFix[], failures: ContrastFailure[] }}
 * @throws {Error} when contrast still fails after auto-fix
 */
export function enforceThemeContrast(themeData) {
  const fixes = validateThemeContrast(themeData);
  const failures = auditThemeContrast(themeData);

  if (failures.length > 0) {
    throw new Error(
      `Theme failed WCAG AA contrast checks after auto-fix (${failures.length}): ` +
        formatContrastFailures(failures),
    );
  }

  return { fixes, failures };
}
