/**
 * Hero Image with Shader Effects
 *
 * Applies Paper Design shader filters to hero images.
 * Default theme uses HalftoneDots, other themes use CSS filters.
 * Supports responsive srcset for optimized loading across devices.
 */

import { useEffect, useState } from 'react';
import { HalftoneDots, Water, PaperTexture } from '@paper-design/shaders-react';
import { createResponsiveImage } from '../utils/responsive-images';

interface HeroImageShaderProps {
  src: string;
  alt: string;
  priority?: boolean; // For preloading critical hero images
}

export default function HeroImageShader({ src, alt, priority = false }: HeroImageShaderProps) {
  const [mounted, setMounted] = useState(false);
  const [isDefaultTheme, setIsDefaultTheme] = useState(true);
  const [currentShader, setCurrentShader] = useState<string>('halftone');

  // Create responsive image configuration
  const responsiveImage = createResponsiveImage({
    src,
    alt,
    loading: priority ? 'eager' : 'lazy'
  }, 'hero');

  useEffect(() => {
    setMounted(true);

    const checkTheme = () => {
      const mode = localStorage.getItem('daily-theme-mode');
      const isDefault = mode !== 'daily';
      setIsDefaultTheme(isDefault);

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
      attributeFilter: ['data-daily-theme', 'data-shader']
    });

    window.addEventListener('storage', checkTheme);

    return () => {
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

  const shaderStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  };

  // Responsive image component for non-shader cases
  const ResponsiveHeroImage = ({ className = '' }: { className?: string }) => (
    <img
      src={responsiveImage.src}
      srcSet={responsiveImage.srcSet}
      sizes={responsiveImage.sizes}
      alt={responsiveImage.alt}
      loading={responsiveImage.loading}
      className={className}
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

  if (!mounted) {
    return (
      <div style={containerStyle}>
        <ResponsiveHeroImage />
      </div>
    );
  }

  // Default theme: HalftoneDots shader with responsive image fallback
  if (isDefaultTheme) {
    return (
      <div style={containerStyle}>
        {/* Responsive image fallback hidden behind shader */}
        <ResponsiveHeroImage />
        {/* Shader overlay */}
        <HalftoneDots
          style={shaderStyle}
          image={src} // Shader uses original source for now
          colorFront="#2C1810"
          colorBack="#F5F0EB"
          originalColors={true}
          type="soft"
          grid="hex"
          size={0.012}
          radius={1.2}
          contrast={0.7}
          grainMixer={0.1}
          grainOverlay={0.05}
          grainSize={0.3}
          fit="cover"
        />
      </div>
    );
  }

  // Daily themes: use theme-specific shader with responsive image fallback
  switch (currentShader) {
    case 'waves':
      return (
        <div style={containerStyle}>
          <ResponsiveHeroImage />
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
          <ResponsiveHeroImage />
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
          <ResponsiveHeroImage className="hero-responsive-image" />
        </div>
      );
  }
}
