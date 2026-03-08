/**
 * Hero Image with Shader Effects
 *
 * Applies Paper Design shader filters to hero images.
 * Default theme shows plain image, daily themes use shader filters.
 * Supports responsive srcset for optimized loading across devices.
 */

import { useEffect, useState } from 'react';
import { Water, PaperTexture } from '@paper-design/shaders-react';
interface HeroImageShaderProps {
  src: string;
  alt: string;
  priority?: boolean; // For preloading critical hero images
}

export default function HeroImageShader({ src, alt, priority = false }: HeroImageShaderProps) {
  const [mounted, setMounted] = useState(false);
  const [isDefaultTheme, setIsDefaultTheme] = useState(true);
  const [currentShader, setCurrentShader] = useState<string>('halftone');

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

  // Hero image for shader overlay cases (SSR img already handles base display)
  const HeroImage = ({ className = '' }: { className?: string }) => (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
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
