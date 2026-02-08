/**
 * Shader Background Component
 *
 * Uses Paper Design shaders for dynamic backgrounds.
 * Controlled by daily theme system via data-shader attribute.
 */

import { useEffect, useState } from 'react';
import {
  GrainGradient,
  MeshGradient,
  NeuroNoise,
  Waves,
  DotGrid,
  Swirl,
  PerlinNoise,
  SimplexNoise,
  PaperTexture,
} from '@paper-design/shaders-react';
import MouseGlow from './MouseGlow';

interface ShaderBackgroundProps {
  shader?: string;
  colors?: string[];
  speed?: number;
  opacity?: number;
}

export default function ShaderBackground({
  shader = 'none',
  colors = ['#5100ff', '#00ff80', '#ffcc00'],
  speed = 0.3,
  opacity = 0.15
}: ShaderBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  const [currentShader, setCurrentShader] = useState(shader);
  const [currentColors, setCurrentColors] = useState(colors);
  const [isEInkMode, setIsEInkMode] = useState(false);

  useEffect(() => {
    setMounted(true);

    let observer: MutationObserver | null = null;

    // Defer observer setup to idle time to reduce main thread blocking
    const initObserver = () => {
      // Listen for theme changes
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'data-shader') {
            const newShader = document.documentElement.getAttribute('data-shader') || 'none';
            setCurrentShader(newShader);
          }
          if (mutation.attributeName === 'data-shader-colors') {
            const colorsAttr = document.documentElement.getAttribute('data-shader-colors');
            if (colorsAttr) {
              try {
                setCurrentColors(JSON.parse(colorsAttr));
              } catch (e) {
                // Keep current colors
              }
            }
          }
          // Watch for e-ink mode changes
          if (mutation.attributeName === 'data-e-ink') {
            const eInkMode = document.documentElement.getAttribute('data-e-ink') === 'true';
            setIsEInkMode(eInkMode);
          }
        });
      });

      observer.observe(document.documentElement, { attributes: true });
    };

    // Check initial values immediately (sync read is fast)
    const initialShader = document.documentElement.getAttribute('data-shader');
    if (initialShader) setCurrentShader(initialShader);

    const initialColors = document.documentElement.getAttribute('data-shader-colors');
    if (initialColors) {
      try {
        setCurrentColors(JSON.parse(initialColors));
      } catch (e) {}
    }

    // Check initial e-ink mode
    const initialEInk = document.documentElement.getAttribute('data-e-ink') === 'true';
    setIsEInkMode(initialEInk);

    // Defer MutationObserver setup to idle time
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(initObserver);
    } else {
      setTimeout(initObserver, 1);
    }

    return () => observer?.disconnect();
  }, []);

  // Don't render shaders in e-ink mode or if shader is none
  if (!mounted || currentShader === 'none' || isEInkMode) {
    return null;
  }

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: -1,
    opacity: opacity,
  };

  const shaderStyle = {
    width: '100%',
    height: '100%',
  };

  // Get the link color for mouse glow (falls back to first shader color)
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
          <PaperTexture
            style={shaderStyle}
            color={currentColors[0]}
          />
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
