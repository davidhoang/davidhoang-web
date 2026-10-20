/**
 * Async boundary for daily-theme hero image shader overlays.
 */

import { Water as WaterRaw, PaperTexture as PaperTextureRaw } from '@paper-design/shaders-react';

const Water = WaterRaw as any;
const PaperTexture = PaperTextureRaw as any;

export type HeroImageShaderOverlaysProps = {
  src: string;
  alt: string;
  priority: boolean;
  currentShader: string;
};

export default function HeroImageShaderOverlays({
  src,
  alt,
  priority,
  currentShader,
}: HeroImageShaderOverlaysProps) {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  };

  const shaderStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  } as any;

  const HeroImage = ({ className = '' }: { className?: string }) => (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      className={className}
      suppressHydrationWarning
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
      }}
    />
  );

  switch (currentShader) {
    case 'waves':
      return (
        <div style={containerStyle}>
          <HeroImage />
          <Water
            style={shaderStyle}
            image={src}
            colorInfluence={0.3}
            ripple={0.15}
            speed={0.2}
            scale={1.5}
            fit="cover"
          />
        </div>
      );

    case 'paper':
    case 'grain':
      return (
        <div style={containerStyle}>
          <HeroImage />
          <PaperTexture
            style={shaderStyle}
            image={src}
            colorFront="#9fadbc"
            colorBack="#ffffff"
            contrast={0.3}
            roughness={0.3}
            fiber={0.2}
            scale={1}
            fit="cover"
          />
        </div>
      );

    default:
      return (
        <div className="hero-image-bg" style={containerStyle}>
          <HeroImage className="hero-responsive-image" />
        </div>
      );
  }
}
