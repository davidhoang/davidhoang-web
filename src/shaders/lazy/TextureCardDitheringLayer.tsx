/**
 * Async boundary for TextureCard dithering shader.
 */

import { Dithering as DitheringRaw } from '@paper-design/shaders-react';

const Dithering = DitheringRaw as any;

export type TextureCardDitheringLayerProps = {
  colors: { front: string; back: string };
  reducedMotion: boolean;
};

export default function TextureCardDitheringLayer({
  colors,
  reducedMotion,
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
      speed={reducedMotion ? 0 : 0.85}
      fit="cover"
    />
  );
}
