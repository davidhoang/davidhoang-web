import {
  adjustColorHue,
  blendColors,
  colorToHex,
  mixColorTowardBlack,
  mixColorTowardWhite,
} from './themeCardColors';

export type HeroDailyShaderContext = {
  link: string;
  linkHover: string;
  muted: string;
  bg: string;
  isDark: boolean;
  /** 0..1 from theme date — micro-variation of warp/positions */
  phase: number;
};

function hashPhase(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 997) / 997;
}

export function readHeroDailyShaderContext(): HeroDailyShaderContext | null {
  if (typeof document === 'undefined') return null;
  const root = document.documentElement;
  if (root.getAttribute('data-e-ink') === 'true') return null;
  if (!root.hasAttribute('data-daily-theme')) return null;

  const cs = getComputedStyle(root);
  const dateStr = root.getAttribute('data-daily-theme') || '';
  const isDark = root.getAttribute('data-theme') === 'dark';

  return {
    link: colorToHex(cs.getPropertyValue('--color-link'), '#3355cc'),
    linkHover: colorToHex(cs.getPropertyValue('--color-link-hover'), '#5577ee'),
    muted: colorToHex(cs.getPropertyValue('--color-muted'), '#777777'),
    bg: colorToHex(cs.getPropertyValue('--color-bg'), isDark ? '#121212' : '#fafafa'),
    isDark,
    phase: hashPhase(dateStr),
  };
}

/** Stable string for useSyncExternalStore — changes when any theme token changes */
export function getHeroShaderThemeSnapshot(): string {
  const ctx = readHeroDailyShaderContext();
  if (!ctx) return '';
  return JSON.stringify([
    ctx.link,
    ctx.linkHover,
    ctx.muted,
    ctx.bg,
    ctx.isDark ? 1 : 0,
    Math.round(ctx.phase * 10000),
  ]);
}

export function parseHeroDailyShaderContext(snap: string): HeroDailyShaderContext | null {
  if (!snap) return null;
  try {
    const a = JSON.parse(snap) as [string, string, string, string, number, number];
    return {
      link: a[0],
      linkHover: a[1],
      muted: a[2],
      bg: a[3],
      isDark: a[4] === 1,
      phase: a[5] / 10000,
    };
  } catch {
    return null;
  }
}

export function subscribeHeroShaderTheme(onStoreChange: () => void): () => void {
  if (typeof document === 'undefined') return () => {};
  const root = document.documentElement;
  const obs = new MutationObserver(() => onStoreChange());
  obs.observe(root, {
    attributes: true,
    attributeFilter: ['data-daily-theme', 'data-theme', 'data-e-ink', 'style'],
  });
  return () => obs.disconnect();
}

export function dailySpeedMultiplier(ctx: HeroDailyShaderContext | null, motion: boolean): number {
  if (!motion) return 0;
  if (!ctx) return 1;
  return ctx.isDark ? 0.86 : 1.12;
}

export function dailyGrainExtra(ctx: HeroDailyShaderContext | null): number {
  if (!ctx) return 0;
  return (ctx.isDark ? 0.075 : 0.038) + ctx.phase * 0.055;
}

export function dailyDistortionBoost(ctx: HeroDailyShaderContext | null): number {
  if (!ctx) return 0;
  return ctx.phase * 0.1 + (ctx.isDark ? 0.04 : 0);
}

/** Atlassian — mesh */
export function dailyMeshGradientColors(c: string, ctx: HeroDailyShaderContext): string[] {
  const hueNudge = ctx.phase * 14 - 7;
  return [
    blendColors(c, ctx.link, 0.12),
    adjustColorHue(c, -32 + hueNudge),
    blendColors(adjustColorHue(c, 118), ctx.link, 0.48),
    blendColors(mixColorTowardWhite(c, 0.62), ctx.linkHover, 0.32),
  ];
}

/** Dive Club — static mesh */
export function dailyStaticMeshColors(c: string, ctx: HeroDailyShaderContext): string[] {
  return [
    blendColors(mixColorTowardBlack(c, 0.45), ctx.bg, 0.26),
    blendColors(c, ctx.link, 0.22),
    blendColors(adjustColorHue(c, 92), ctx.muted, 0.18),
    blendColors(mixColorTowardWhite(c, 0.22), ctx.bg, 0.4),
  ];
}

/** Proof of Concept — dither */
export function dailyDitherPair(c: string, ctx: HeroDailyShaderContext): { back: string; front: string } {
  return {
    back: blendColors(mixColorTowardBlack(c, 0.62), blendColors(ctx.bg, ctx.muted, 0.5), 0.42),
    front: blendColors(mixColorTowardWhite(c, 0.88), ctx.linkHover, 0.26),
  };
}

/** Config — grain / truchet */
export function dailyGrainGradientBundle(
  c: string,
  ctx: HeroDailyShaderContext
): { colorBack: string; colors: string[] } {
  return {
    colorBack: blendColors(mixColorTowardBlack(c, 0.32), ctx.bg, 0.32),
    colors: [
      blendColors(c, ctx.link, 0.28),
      blendColors(adjustColorHue(c, 42), ctx.linkHover, 0.22),
      blendColors(mixColorTowardWhite(c, 0.4), ctx.bg, 0.15),
      adjustColorHue(c, -22),
    ],
  };
}

/** Career Odyssey — voronoi */
export function dailyVoronoiBundle(c: string, ctx: HeroDailyShaderContext): {
  colors: string[];
  colorGap: string;
  colorGlow: string;
} {
  return {
    colors: [
      blendColors(c, ctx.link, 0.24),
      blendColors(adjustColorHue(c, 58), ctx.linkHover, 0.12),
      blendColors(adjustColorHue(c, -38), ctx.muted, 0.28),
      blendColors(mixColorTowardWhite(c, 0.48), ctx.linkHover, 0.22),
    ],
    colorGap: blendColors(mixColorTowardBlack(c, 0.35), ctx.muted, 0.48),
    colorGlow: blendColors(mixColorTowardWhite(c, 0.72), ctx.linkHover, 0.38),
  };
}

/** Fallback: mesh */
export function dailyFallbackMeshColors(c: string, ctx: HeroDailyShaderContext): string[] {
  return [
    blendColors(c, ctx.link, 0.26),
    blendColors(adjustColorHue(c, 90), ctx.linkHover, 0.18),
    blendColors(mixColorTowardWhite(c, 0.52), ctx.bg, 0.14),
  ];
}

export function dailyFallbackDither(c: string, ctx: HeroDailyShaderContext): { back: string; front: string } {
  return {
    back: blendColors(mixColorTowardBlack(c, 0.5), blendColors(ctx.bg, ctx.muted, 0.48), 0.34),
    front: blendColors(mixColorTowardWhite(c, 0.52), ctx.linkHover, 0.2),
  };
}

export function dailyFallbackDotOrbitColors(
  c: string,
  hi: string,
  mid: string,
  ctx: HeroDailyShaderContext
): string[] {
  return [
    blendColors(hi, ctx.linkHover, 0.22),
    blendColors(mid, ctx.muted, 0.18),
    blendColors(adjustColorHue(c, 55), ctx.link, 0.28),
  ];
}

export function dailyFallbackVoronoiBundle(c: string, hi: string, mid: string, ctx: HeroDailyShaderContext): {
  colors: string[];
  colorGap: string;
  colorGlow: string;
} {
  return {
    colors: [
      blendColors(c, ctx.link, 0.18),
      blendColors(hi, ctx.linkHover, 0.15),
      blendColors(mid, ctx.muted, 0.2),
    ],
    colorGap: blendColors(mixColorTowardBlack(c, 0.4), ctx.muted, 0.42),
    colorGlow: blendColors(mixColorTowardWhite(c, 0.65), ctx.linkHover, 0.32),
  };
}

export function dailyNeuroTriplet(c: string, mid: string, hi: string, ctx: HeroDailyShaderContext) {
  return {
    colorBack: blendColors(c, ctx.bg, 0.08),
    colorMid: blendColors(mid, ctx.muted, 0.12),
    colorFront: blendColors(hi, ctx.linkHover, 0.15),
  };
}
