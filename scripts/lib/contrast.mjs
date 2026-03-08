/**
 * WCAG AA Contrast Validation
 *
 * Validates and fixes color contrast ratios in generated themes
 * to ensure accessibility compliance (WCAG AA: 4.5:1 for normal text,
 * 3:1 for large text and UI components).
 */

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
 * Validate and fix contrast issues in a theme's color mode (light or dark)
 *
 * Returns an object with { colors, fixes } where fixes lists any changes made
 */
function validateMode(colors, modeName) {
  const fixes = [];
  const bg = colors['--color-bg'];
  const cardBg = colors['--color-card-bg'];
  const navBg = colors['--color-nav-bg'];

  // Pairs to check: [foreground var, background var, min ratio, label]
  const checks = [
    ['--color-text', '--color-bg', 4.5, 'body text on background'],
    ['--color-link', '--color-bg', 4.5, 'link on background'],
    ['--color-muted', '--color-bg', 3.0, 'muted text on background'],
    ['--color-text', '--color-card-bg', 4.5, 'text on card background'],
    ['--color-link', '--color-card-bg', 4.5, 'link on card background'],
    ['--color-nav-text', '--color-nav-bg', 4.5, 'nav text on nav background'],
  ];

  const fixed = { ...colors };

  for (const [fgVar, bgVar, minRatio, label] of checks) {
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

  return { colors: fixed, fixes };
}

/**
 * Validate and fix contrast for an entire theme
 *
 * Modifies colors in-place and returns a list of fixes applied
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
