/**
 * Palette distance and AI-attractor penalties for daily theme ranking.
 *
 * Categorical diversity alone misses cream/#F5xxxx clones. These helpers
 * compare light+dark key colors in HSL and flag warm-cream / lavender-white
 * clusters that the model over-produces.
 */

const PALETTE_KEYS = [
  '--color-bg',
  '--color-text',
  '--color-link',
  '--color-card-bg',
  '--color-border',
  '--color-muted',
];

/**
 * @param {string | undefined} hex
 * @returns {{ h: number, s: number, l: number } | null}
 */
export function hexToHsl(hex) {
  if (!hex || typeof hex !== 'string') return null;
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((char) => char + char).join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;

  const r = Number.parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = Number.parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = Number.parseInt(cleaned.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Normalized HSL distance in [0, 1].
 * @param {{ h: number, s: number, l: number }} left
 * @param {{ h: number, s: number, l: number }} right
 */
export function hslDistance(left, right) {
  const hueGap = Math.min(Math.abs(left.h - right.h), 360 - Math.abs(left.h - right.h)) / 180;
  const satGap = Math.abs(left.s - right.s) / 100;
  const lightGap = Math.abs(left.l - right.l) / 100;
  // Hue matters less when both colors are near-gray or near-white/black.
  const chroma = Math.min(left.s, right.s) / 100;
  const weightHue = 0.45 * chroma;
  const weightSat = 0.25;
  const weightLight = 0.3 + (0.45 - weightHue);
  return Math.min(1, hueGap * weightHue + satGap * weightSat + lightGap * weightLight);
}

/**
 * Average paired-key HSL distance across light and dark palettes.
 * @param {object} themeA
 * @param {object} themeB
 * @returns {number} 0 identical → 1 maximally different
 */
export function colorPaletteDistance(themeA, themeB) {
  const distances = [];
  for (const mode of ['light', 'dark']) {
    const left = themeA?.colors?.[mode];
    const right = themeB?.colors?.[mode];
    if (!left || !right) continue;
    for (const key of PALETTE_KEYS) {
      const leftHsl = hexToHsl(left[key]);
      const rightHsl = hexToHsl(right[key]);
      if (!leftHsl || !rightHsl) continue;
      distances.push(hslDistance(leftHsl, rightHsl));
    }
  }
  if (distances.length === 0) return 0;
  return distances.reduce((sum, value) => sum + value, 0) / distances.length;
}

/**
 * Minimum palette distance from a candidate to any recent theme.
 * @param {object} theme
 * @param {object[]} recentThemes
 */
export function nearestColorDistance(theme, recentThemes) {
  if (!recentThemes?.length) return 1;
  return Math.min(...recentThemes.map((recent) => colorPaletteDistance(theme, recent)));
}

/**
 * Warm cream paper: light warm hue, low-mid saturation, very high lightness.
 * @param {{ h: number, s: number, l: number }} hsl
 */
export function isWarmCream(hsl) {
  if (!hsl) return false;
  const warmHue = hsl.h <= 55 || hsl.h >= 350;
  return warmHue && hsl.s >= 3 && hsl.s <= 40 && hsl.l >= 90 && hsl.l <= 98.5;
}

/**
 * Soft lavender / purple-tinted white backgrounds.
 * Near-white HSL saturation is unreliable, so lightness + hue carry this check.
 * @param {{ h: number, s: number, l: number }} hsl
 */
export function isLavenderWash(hsl) {
  if (!hsl) return false;
  return hsl.h >= 245 && hsl.h <= 295 && hsl.l >= 92 && hsl.l <= 99.5;
}

/**
 * Penalty in [0, 1] for overused AI palette attractors.
 * High contrast + cream/lavender paper is the historical cluster.
 * @param {object} theme
 */
export function attractorPenalty(theme) {
  const lightBg = hexToHsl(theme?.colors?.light?.['--color-bg']);
  if (!lightBg) return 0;

  let penalty = 0;
  if (isWarmCream(lightBg)) penalty += 0.55;
  if (isLavenderWash(lightBg)) penalty += 0.45;

  if (theme?.colors?.contrastMode === 'high' && (isWarmCream(lightBg) || isLavenderWash(lightBg))) {
    penalty += 0.25;
  }

  // Near-identical cream family (#F5F3F0-ish) regardless of contrast label.
  if (lightBg.l >= 93 && lightBg.l <= 97 && lightBg.s >= 5 && lightBg.s <= 18 && (lightBg.h <= 45 || lightBg.h >= 355)) {
    penalty += 0.15;
  }

  return Math.min(1, penalty);
}
