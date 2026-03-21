/**
 * Hero stack card colors: when a daily theme is active, derive a harmonious
 * palette from theme tokens so cards feel native to the palette. Default /
 * non-daily themes keep the static colors in types.ts.
 */

const HUE_OFFSETS_DEG = [0, 42, 86, 148, 208, 288];

export function parseCssColorToRgb(input: string): { r: number; g: number; b: number } | null {
  const s = input.trim();
  if (!s) return null;

  if (s.startsWith('#')) {
    let h = s.slice(1);
    if (h.length === 3) {
      h = h
        .split('')
        .map((c) => c + c)
        .join('');
    }
    if (h.length !== 6) return null;
    const n = parseInt(h, 16);
    if (Number.isNaN(n)) return null;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  const rgb = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (rgb) {
    return {
      r: Math.round(Number(rgb[1])),
      g: Math.round(Number(rgb[2])),
      b: Math.round(Number(rgb[3])),
    };
  }

  return null;
}

/** Mix toward white (0–1) for shader highlights on saturated card bases */
export function mixColorTowardWhite(input: string, amount: number): string {
  const rgb = parseCssColorToRgb(input);
  if (!rgb) return 'rgba(255,255,255,0.55)';
  const r = Math.round(rgb.r + (255 - rgb.r) * amount);
  const g = Math.round(rgb.g + (255 - rgb.g) * amount);
  const b = Math.round(rgb.b + (255 - rgb.b) * amount);
  return rgbToHex({ r, g, b });
}

/** Mix toward black (0–1) for depth / ink */
export function mixColorTowardBlack(input: string, amount: number): string {
  const rgb = parseCssColorToRgb(input);
  if (!rgb) return '#1a1a1a';
  const r = Math.round(rgb.r * (1 - amount));
  const g = Math.round(rgb.g * (1 - amount));
  const b = Math.round(rgb.b * (1 - amount));
  return rgbToHex({ r, g, b });
}

/** Rotate hue in degrees (hex or rgb() input) */
export function adjustColorHue(input: string, deltaDegrees: number): string {
  const rgb = parseCssColorToRgb(input);
  if (!rgb) return input;
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const nh = (h + deltaDegrees + 360) % 360;
  return rgbToHex(hslToRgb(nh, s, l));
}

/** Linear blend between two parseable colors (0 = a, 1 = b) */
export function blendColors(a: string, b: string, t: number): string {
  const ra = parseCssColorToRgb(a);
  const rb = parseCssColorToRgb(b);
  if (!ra) return b;
  if (!rb) return a;
  const u = Math.max(0, Math.min(1, t));
  return rgbToHex({
    r: Math.round(ra.r + (rb.r - ra.r) * u),
    g: Math.round(ra.g + (rb.g - ra.g) * u),
    b: Math.round(ra.b + (rb.b - ra.b) * u),
  });
}

/** Normalize CSS color string to #rrggbb, or fallback if unparsable */
export function colorToHex(input: string, fallback: string): string {
  const rgb = parseCssColorToRgb(input);
  return rgb ? rgbToHex(rgb) : fallback;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const l = (max + min) / 2;
  let s = 0;

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const hh = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = l - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hh < 60) {
    rp = c;
    gp = x;
  } else if (hh < 120) {
    rp = x;
    gp = c;
  } else if (hh < 180) {
    gp = c;
    bp = x;
  } else if (hh < 240) {
    gp = x;
    bp = c;
  } else if (hh < 300) {
    rp = x;
    bp = c;
  } else {
    rp = c;
    bp = x;
  }
  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const h = (n: number) =>
    Math.max(0, Math.min(255, n))
      .toString(16)
      .padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const lin = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const R = lin(r);
  const G = lin(g);
  const B = lin(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** Contrast ratio of #fff over background (WCAG). */
function contrastWhiteOn(bg: { r: number; g: number; b: number }): number {
  const L2 = relativeLuminance(bg);
  return 1.05 / (L2 + 0.05);
}

function darkenForWhiteText(rgb: { r: number; g: number; b: number }, minRatio = 4.25): string {
  let { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  s = Math.min(0.92, Math.max(0.45, s));
  let guard = 0;
  while (guard < 14) {
    const out = hslToRgb(h, s, l);
    if (contrastWhiteOn(out) >= minRatio) return rgbToHex(out);
    l = Math.max(0.12, l * 0.92);
    guard += 1;
  }
  return rgbToHex(hslToRgb(h, s, 0.14));
}

/**
 * Returns hex colors for each hero card, or null to use static `card.color` values.
 */
export function deriveHeroCardPalette(count: number): string[] | null {
  if (typeof document === 'undefined') return null;

  const root = document.documentElement;
  if (root.getAttribute('data-e-ink') === 'true') return null;
  if (!root.hasAttribute('data-daily-theme')) return null;

  const cs = getComputedStyle(root);
  const link = cs.getPropertyValue('--color-link').trim();
  const hover = cs.getPropertyValue('--color-link-hover').trim();

  let baseRgb = parseCssColorToRgb(link);
  if (!baseRgb) baseRgb = parseCssColorToRgb(hover);
  if (!baseRgb) return null;

  const { h: baseH, s: linkS } = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);
  const isDarkPage = root.getAttribute('data-theme') === 'dark';
  const baseL = isDarkPage ? 0.5 : 0.38;
  const saturation = Math.min(0.88, Math.max(0.52, linkS || 0.65));

  const offsets = HUE_OFFSETS_DEG.slice(0, count);
  return offsets.map((off, i) => {
    const hue = (baseH + off) % 360;
    const l = Math.max(0.14, Math.min(0.58, baseL - i * 0.028));
    const raw = hslToRgb(hue, saturation, l);
    return darkenForWhiteText(raw, 4.2);
  });
}
