/**
 * Async boundary for site background shaders — named imports stay tree-shakeable.
 */

import {
  GrainGradient as GrainGradientRaw,
  MeshGradient as MeshGradientRaw,
  NeuroNoise as NeuroNoiseRaw,
  Waves as WavesRaw,
  DotGrid as DotGridRaw,
  Swirl as SwirlRaw,
  PerlinNoise as PerlinNoiseRaw,
  SimplexNoise as SimplexNoiseRaw,
  PaperTexture as PaperTextureRaw,
} from '@paper-design/shaders-react';
import MouseGlow from '../../components/MouseGlow';

const GrainGradient = GrainGradientRaw as any;
const MeshGradient = MeshGradientRaw as any;
const NeuroNoise = NeuroNoiseRaw as any;
const Waves = WavesRaw as any;
const DotGrid = DotGridRaw as any;
const Swirl = SwirlRaw as any;
const PerlinNoise = PerlinNoiseRaw as any;
const SimplexNoise = SimplexNoiseRaw as any;
const PaperTexture = PaperTextureRaw as any;

export type ShaderBackgroundLayersProps = {
  currentShader: string;
  currentColors: string[];
  speed: number;
  opacity: number;
};

export default function ShaderBackgroundLayers({
  currentShader,
  currentColors,
  speed,
  opacity,
}: ShaderBackgroundLayersProps) {
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100dvh',
    pointerEvents: 'none',
    zIndex: -1,
    opacity,
  };

  const shaderStyle = {
    width: '100%',
    height: '100%',
  } as any;

  const glowColor = currentColors[0] || '#ffffff';

  switch (currentShader) {
    case 'grain':
      return (
        <div style={containerStyle}>
          <GrainGradient
            style={shaderStyle}
            color1={currentColors[0]}
            color2={currentColors[1] || currentColors[0]}
            speed={speed}
          />
          <MouseGlow color={glowColor} />
        </div>
      );

    case 'paper':
      return (
        <div style={containerStyle}>
          <PaperTexture style={shaderStyle} color={currentColors[0]} />
          <MouseGlow color={glowColor} />
        </div>
      );

    case 'mesh-gradient':
      return (
        <div style={containerStyle}>
          <MeshGradient
            style={shaderStyle}
            color1={currentColors[0]}
            color2={currentColors[1]}
            color3={currentColors[2] || currentColors[0]}
            color4={currentColors[3] || currentColors[1]}
            speed={speed}
          />
          <MouseGlow color={glowColor} />
        </div>
      );

    case 'neuro':
      return (
        <div style={containerStyle}>
          <NeuroNoise
            style={shaderStyle}
            colorFront={currentColors[0]}
            colorBack={currentColors[1] || 'transparent'}
            speed={speed}
            scale={1.5}
          />
          <MouseGlow color={glowColor} />
        </div>
      );

    case 'waves':
      return (
        <div style={containerStyle}>
          <Waves
            style={shaderStyle}
            color1={currentColors[0]}
            color2={currentColors[1]}
            color3={currentColors[2] || currentColors[0]}
            speed={speed}
          />
          <MouseGlow color={glowColor} />
        </div>
      );

    case 'dot-grid':
      return (
        <div style={containerStyle}>
          <DotGrid
            style={shaderStyle}
            colorDot={currentColors[0]}
            colorBack={currentColors[1] || 'transparent'}
            dotSize={0.015}
            gridSpacingX={0.03}
            gridSpacingY={0.03}
          />
          <MouseGlow color={glowColor} />
        </div>
      );

    case 'swirl':
      return (
        <div style={containerStyle}>
          <Swirl
            style={shaderStyle}
            colorBack={currentColors[0]}
            colorInner={currentColors[1]}
            colorOuter={currentColors[2] || currentColors[0]}
            speed={speed}
          />
          <MouseGlow color={glowColor} />
        </div>
      );

    case 'perlin':
      return (
        <div style={containerStyle}>
          <PerlinNoise
            style={shaderStyle}
            color1={currentColors[0]}
            color2={currentColors[1]}
            speed={speed}
            scale={2}
          />
          <MouseGlow color={glowColor} />
        </div>
      );

    case 'simplex':
      return (
        <div style={containerStyle}>
          <SimplexNoise
            style={shaderStyle}
            color1={currentColors[0]}
            color2={currentColors[1]}
            speed={speed}
            scale={2}
          />
          <MouseGlow color={glowColor} />
        </div>
      );

    default:
      return null;
  }
}
