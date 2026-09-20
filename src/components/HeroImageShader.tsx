/**
 * Hero Image with Shader Effects
 *
 * Applies Paper Design shader filters to hero images.
 * Default theme shows plain image, daily themes use shader filters.
 * Supports responsive srcset for optimized loading across devices.
 */

import { useEffect, useState } from 'react';
import * as Shaders from '@paper-design/shaders-react';

// Cast: the library types omit `style` but accept it at runtime.
const Water = Shaders.Water as any;
const PaperTexture = Shaders.PaperTexture as any;
const ImageDithering = Shaders.ImageDithering as any;

const HERO_DITHER_MAX_PIXELS = 1280 * 720;

interface HeroImageShaderProps {
  src: string;
  alt: string;
  priority?: boolean; // For preloading critical hero images
  /** Opt-in Paper image dither — used by Work. Other heroes stay theme-driven. */
  shader?: 'dither';
}

export default function HeroImageShader({
  src,
  alt,
  priority = false,
  shader,
}: HeroImageShaderProps) {
  const [mounted, setMounted] = useState(false);
  const [isDefaultTheme, setIsDefaultTheme] = useState(true);
  const [currentShader, setCurrentShader] = useState<string>('halftone');
  const [eInk, setEInk] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(mq.matches);
    syncMotion();
    mq.addEventListener('change', syncMotion);

    const checkTheme = () => {
      const mode = localStorage.getItem('daily-theme-mode');
      const isDefault = mode !== 'daily';
      setIsDefaultTheme(isDefault);
      setEInk(document.documentElement.getAttribute('data-e-ink') === 'true');

      if (!isDefault) {
        // Get shader type from theme
        const shaderAttr = document.documentElement.getAttribute('data-shader');
        setCurrentShader(shaderAttr || 'none');
      } else {
        setCurrentShader('halftone');
      }
    };

    checkTheme();

    const observer = new MutationObserver(() => checkTheme());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-daily-theme', 'data-shader', 'data-e-ink']
    });

    window.addEventListener('storage', checkTheme);

    return () => {
      mq.removeEventListener('change', syncMotion);
      observer.disconnect();
      window.removeEventListener('storage', checkTheme);
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  };

  // Cast: @paper-design shader components accept `style` at runtime but
  // their TS types omit it.
  const shaderStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  } as any;

  // Hero image for shader overlay cases (SSR img already handles base display)
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

  if (shader === 'dither') {
    if (!mounted || eInk) {
      return null;
    }

    return (
      <div
        className="hero-image-shader hero-image-shader--dither"
        style={{ ...containerStyle, pointerEvents: 'none', zIndex: 1 }}
        aria-hidden
      >
        <ImageDithering
          image={src}
          type="8x8"
          size={reducedMotion ? 2.2 : 1.8}
          colorSteps={7}
          originalColors
          fit="cover"
          maxPixelCount={HERO_DITHER_MAX_PIXELS}
          style={shaderStyle}
        />
      </div>
    );
  }

  if (!mounted) {
    return (
      <div style={containerStyle}>
        <HeroImage />
      </div>
    );
  }

  // Default theme: plain image, no shader
  if (isDefaultTheme) {
    return (
      <div style={containerStyle}>
        <HeroImage />
      </div>
    );
  }

  // Daily themes: use theme-specific shader with responsive image fallback
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
      // Fallback to responsive image with CSS filters applied via global.css
      return (
        <div className="hero-image-bg" style={containerStyle}>
          <HeroImage className="hero-responsive-image" />
        </div>
      );
  }
}
