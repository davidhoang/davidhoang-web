/**
 * Async boundary for the Paper dithering shader (TextureCard, writing covers).
 */

import { Dithering as DitheringRaw } from '@paper-design/shaders-react';

const Dithering = DitheringRaw as any;

export type DitheringOverrides = Record<string, string | number>;

export type TextureCardDitheringLayerProps = {
  colors: { front: string; back: string };
  speed: number;
  /** Replaces the TextureCard defaults below (shape, sizing, colors, pixel budget) */
  shader?: DitheringOverrides;
};

export default function TextureCardDitheringLayer({
  colors,
  speed,
  shader,
}: TextureCardDitheringLayerProps) {
  return (
    <Dithering
      style={{ width: '100%', height: '100%', display: 'block' }}
      colorBack={colors.back}
      colorFront={colors.front}
      shape="sphere"
      type="4x4"
      size={2}
      scale={0.6}
      speed={speed}
      fit="cover"
      {...shader}
    />
  );
}
