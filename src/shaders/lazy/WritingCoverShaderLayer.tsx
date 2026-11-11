/**
 * Async boundary for the generated writing cover (Paper dithering shader).
 * @see https://shaders.paper.design/dithering
 */

import { useEffect, useRef } from 'react';
import { Dithering as DitheringRaw } from '@paper-design/shaders-react';
import type { WritingCoverArt } from '../../utils/writingCoverArt';

const Dithering = DitheringRaw as any;

const COVER_SHADER_MAX_PIXELS = 960 * 720;

export type WritingCoverShaderLayerProps = {
  art: WritingCoverArt;
  colors: { front: string; back: string };
  speed: number;
};

export default function WritingCoverShaderLayer({ art, colors, speed }: WritingCoverShaderLayerProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    return () => {
      // Paper's dispose() drops the canvas but leaves the GL context for GC. An
      // index page mounts and unmounts many covers while scrolling, so release
      // each context now to stay under the browser's live-context limit.
      host
        ?.querySelector('canvas')
        ?.getContext('webgl2')
        ?.getExtension('WEBGL_lose_context')
        ?.loseContext();
    };
  }, []);

  return (
    <div ref={hostRef} className="writing-cover-shader__layer">
      <Dithering
        style={{ width: '100%', height: '100%', display: 'block' }}
        colorBack={colors.back}
        colorFront={colors.front}
        shape={art.shape}
        type={art.type}
        size={art.size}
        scale={art.scale}
        rotation={art.rotation}
        offsetX={art.offsetX}
        offsetY={art.offsetY}
        frame={art.frame}
        speed={speed}
        fit="cover"
        maxPixelCount={COVER_SHADER_MAX_PIXELS}
        minPixelRatio={1}
      />
    </div>
  );
}
