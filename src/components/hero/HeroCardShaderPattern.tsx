import { useMemo, useSyncExternalStore, type CSSProperties } from 'react';
import {
  MeshGradient,
  StaticMeshGradient,
  GrainGradient,
  Voronoi,
  Dithering,
  DotOrbit,
  NeuroNoise,
} from '@paper-design/shaders-react';
import {
  adjustColorHue,
  blendColors,
  mixColorTowardBlack,
  mixColorTowardWhite,
} from './themeCardColors';
import {
  dailyDistortionBoost,
  dailyDitherPair,
  dailyFallbackDither,
  dailyFallbackDotOrbitColors,
  dailyFallbackMeshColors,
  dailyFallbackVoronoiBundle,
  dailyGrainExtra,
  dailyGrainGradientBundle,
  dailyMeshGradientColors,
  dailyNeuroTriplet,
  dailySpeedMultiplier,
  dailyStaticMeshColors,
  dailyVoronoiBundle,
  getHeroShaderThemeSnapshot,
  parseHeroDailyShaderContext,
  subscribeHeroShaderTheme,
  type HeroDailyShaderContext,
} from './heroShaderDailyTheme';
import type { Card } from './types';

const HERO_SHADER_MAX_PIXELS = 960 * 720;

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const shell = {
  className: 'hero-card-shader-mount',
  style: {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    borderRadius: 'inherit',
    pointerEvents: 'none' as const,
  },
  'aria-hidden': true as const,
};

interface HeroCardShaderPatternProps {
  cardId: string;
  pattern: Card['pattern'];
  color: string;
}

/** Per-card art direction; daily theme injects link/bg/muted accents + phase-based variation */
export function HeroCardShaderPattern({ cardId, pattern, color }: HeroCardShaderPatternProps) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    () => false
  );
  const motion = !reducedMotion;
  const s = motion ? 1 : 0;

  const themeSnap = useSyncExternalStore(
    subscribeHeroShaderTheme,
    getHeroShaderThemeSnapshot,
    () => ''
  );
  const dailyCtx = useMemo(() => parseHeroDailyShaderContext(themeSnap), [themeSnap]);

  if (pattern === 'none') return null;

  const sm = dailySpeedMultiplier(dailyCtx, motion);
  const gx = dailyGrainExtra(dailyCtx);
  const db = dailyDistortionBoost(dailyCtx);

  const base = {
    ...shell,
    maxPixelCount: HERO_SHADER_MAX_PIXELS,
    minPixelRatio: 1,
    fit: 'cover' as const,
  };

  switch (cardId) {
    case 'atlassian': {
      const c = color;
      const colors = dailyCtx ? dailyMeshGradientColors(c, dailyCtx) : meshDefault(c);
      return (
        <MeshGradient
          {...base}
          colors={colors}
          distortion={0.9 + db}
          swirl={0.48 + (dailyCtx ? dailyCtx.phase * 0.09 : 0)}
          grainMixer={0.28 + (dailyCtx ? 0.06 : 0)}
          grainOverlay={0.14 + gx}
          scale={1.08}
          speed={0.52 * s * sm}
        />
      );
    }
    case 'diveclub': {
      const c = color;
      const colors = dailyCtx ? dailyStaticMeshColors(c, dailyCtx) : staticMeshDefault(c);
      return (
        <StaticMeshGradient
          {...base}
          colors={colors}
          positions={dailyCtx ? 14 + Math.round(dailyCtx.phase * 14) : 19}
          waveX={0.58 + (dailyCtx ? dailyCtx.phase * 0.08 : 0)}
          waveY={0.9}
          waveXShift={dailyCtx ? 0.18 + dailyCtx.phase * 0.14 : 0.24}
          waveYShift={dailyCtx ? 0.52 + dailyCtx.phase * 0.1 : 0.58}
          mixing={0.46}
          grainMixer={0.24 + (dailyCtx ? 0.05 : 0)}
          grainOverlay={0.16 + gx}
          rotation={12 + (dailyCtx ? Math.round(dailyCtx.phase * 18) : 0)}
          scale={1.02}
          speed={0}
        />
      );
    }
    case 'poc': {
      const c = color;
      const pair = dailyCtx ? dailyDitherPair(c, dailyCtx) : ditherDefault(c);
      return (
        <Dithering
          {...base}
          colorBack={pair.back}
          colorFront={pair.front}
          shape="wave"
          type={dailyCtx && dailyCtx.phase > 0.52 ? '8x8' : '4x4'}
          /* Coarser cells = less high-frequency noise behind the title overlap */
          size={dailyCtx ? 3.05 + dailyCtx.phase * 0.55 : 3.35}
          scale={1.18}
          speed={0.42 * s * sm}
        />
      );
    }
    case 'config': {
      const c = color;
      const grain = dailyCtx ? dailyGrainGradientBundle(c, dailyCtx) : grainDefault(c);
      return (
        <GrainGradient
          {...base}
          colorBack={grain.colorBack}
          colors={grain.colors}
          shape="truchet"
          softness={0.32}
          intensity={dailyCtx ? 0.76 + dailyCtx.phase * 0.14 : 0.78}
          noise={dailyCtx ? 0.56 + (dailyCtx.isDark ? 0.1 : 0.05) : 0.58}
          scale={1.22}
          rotation={8 + (dailyCtx ? Math.round(dailyCtx.phase * 26) : 0)}
          speed={0.45 * s * sm}
        />
      );
    }
    case 'odyssey': {
      const c = color;
      const v = dailyCtx ? dailyVoronoiBundle(c, dailyCtx) : voronoiDefault(c);
      return (
        <Voronoi
          {...base}
          colors={v.colors}
          stepsPerColor={2}
          colorGap={v.colorGap}
          colorGlow={v.colorGlow}
          distortion={0.44 + db * 0.55}
          gap={dailyCtx ? 0.022 + dailyCtx.phase * 0.014 : 0.026}
          glow={dailyCtx ? 0.58 + dailyCtx.phase * 0.12 : 0.62}
          scale={0.68}
          speed={0.42 * s * sm}
        />
      );
    }
    default:
      return patternFallback(pattern, color, base, motion, dailyCtx, sm, gx, db);
  }
}

function meshDefault(c: string): string[] {
  return [c, adjustColorHue(c, -32), adjustColorHue(c, 118), mixColorTowardWhite(c, 0.62)];
}

function staticMeshDefault(c: string): string[] {
  return [mixColorTowardBlack(c, 0.45), c, adjustColorHue(c, 92), mixColorTowardWhite(c, 0.22)];
}

function ditherDefault(c: string): { back: string; front: string } {
  return { back: mixColorTowardBlack(c, 0.62), front: mixColorTowardWhite(c, 0.88) };
}

function grainDefault(c: string): { colorBack: string; colors: string[] } {
  return {
    colorBack: mixColorTowardBlack(c, 0.32),
    colors: [c, adjustColorHue(c, 42), mixColorTowardWhite(c, 0.4), adjustColorHue(c, -22)],
  };
}

function voronoiDefault(c: string): {
  colors: string[];
  colorGap: string;
  colorGlow: string;
} {
  return {
    colors: [c, adjustColorHue(c, 58), adjustColorHue(c, -38), mixColorTowardWhite(c, 0.48)],
    colorGap: mixColorTowardBlack(c, 0.35),
    colorGlow: mixColorTowardWhite(c, 0.72),
  };
}

function patternFallback(
  pattern: Card['pattern'],
  color: string,
  base: {
    className: string;
    style: CSSProperties;
    'aria-hidden': boolean;
    maxPixelCount: number;
    minPixelRatio: number;
    fit: 'cover';
  },
  motion: boolean,
  dailyCtx: HeroDailyShaderContext | null,
  sm: number,
  gx: number,
  db: number
) {
  const hi = mixColorTowardWhite(color, 0.52);
  const mid = mixColorTowardWhite(color, 0.3);
  const s = motion ? 1 : 0;

  switch (pattern) {
    case 'waves':
      return (
        <MeshGradient
          {...base}
          colors={dailyCtx ? dailyFallbackMeshColors(color, dailyCtx) : [color, adjustColorHue(color, 90), hi]}
          distortion={0.82 + db}
          swirl={0.36 + (dailyCtx ? dailyCtx.phase * 0.07 : 0)}
          grainMixer={0.2 + (dailyCtx ? 0.05 : 0)}
          grainOverlay={0.1 + gx}
          scale={1.05}
          speed={0.48 * s * sm}
        />
      );
    case 'lines': {
      const pair = dailyCtx ? dailyFallbackDither(color, dailyCtx) : { back: mixColorTowardBlack(color, 0.5), front: hi };
      return (
        <Dithering
          {...base}
          colorBack={pair.back}
          colorFront={pair.front}
          shape="warp"
          type="8x8"
          size={dailyCtx ? 2.05 + dailyCtx.phase * 0.35 : 2.2}
          scale={1.1}
          speed={0.38 * s * sm}
        />
      );
    }
    case 'dots':
      return (
        <DotOrbit
          {...base}
          colorBack={dailyCtx ? blendColors(color, dailyCtx.bg, 0.12) : color}
          colors={
            dailyCtx ? dailyFallbackDotOrbitColors(color, hi, mid, dailyCtx) : [hi, mid, adjustColorHue(color, 55)]
          }
          size={0.38}
          spreading={0.22 + (dailyCtx ? dailyCtx.phase * 0.06 : 0)}
          stepsPerColor={2}
          scale={1.1}
          speed={0.55 * s * sm}
        />
      );
    case 'grid': {
      const v = dailyCtx
        ? dailyFallbackVoronoiBundle(color, hi, mid, dailyCtx)
        : {
            colors: [color, hi, mid] as string[],
            colorGap: mixColorTowardBlack(color, 0.4),
            colorGlow: mixColorTowardWhite(color, 0.65),
          };
      return (
        <Voronoi
          {...base}
          colors={v.colors}
          stepsPerColor={2}
          colorGap={v.colorGap}
          colorGlow={v.colorGlow}
          distortion={0.36 + db * 0.5}
          gap={dailyCtx ? 0.026 + dailyCtx.phase * 0.012 : 0.03}
          glow={dailyCtx ? 0.42 + dailyCtx.phase * 0.1 : 0.45}
          scale={0.75}
          speed={0.35 * s * sm}
        />
      );
    }
    case 'circuits': {
      const neuro = dailyCtx
        ? dailyNeuroTriplet(color, mid, hi, dailyCtx)
        : { colorBack: color, colorMid: mid, colorFront: hi };
      return (
        <NeuroNoise
          {...base}
          colorBack={neuro.colorBack}
          colorMid={neuro.colorMid}
          colorFront={neuro.colorFront}
          brightness={0.22 + (dailyCtx ? dailyCtx.phase * 0.06 : 0)}
          contrast={0.28 + (dailyCtx ? (dailyCtx.isDark ? 0.06 : 0.03) : 0)}
          scale={1.1}
          speed={0.45 * s * sm}
        />
      );
    }
    case 'none':
      return null;
    default:
      return null;
  }
}
