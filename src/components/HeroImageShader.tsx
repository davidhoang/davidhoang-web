/**
 * Hero Image with Shader Effects
 *
 * Applies Paper Design shader filters to hero images.
 * Default theme uses HalftoneDots, other themes use CSS filters.
 */

import { useEffect, useState } from 'react';
import { HalftoneDots, Water, PaperTexture } from '@paper-design/shaders-react';

interface HeroImageShaderProps {
  src: string;
  alt: string;
}

export default function HeroImageShader({ src, alt }: HeroImageShaderProps) {
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

  if (!mounted) {
    return (
      <div
        style={{
          ...containerStyle,
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        role="img"
        aria-label={alt}
      />
    );
  }

  // Default theme: HalftoneDots shader
  if (isDefaultTheme) {
    return (
      <HalftoneDots
        style={shaderStyle}
        image={src}
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
    );
  }

  // Daily themes: use theme-specific shader or CSS filter fallback
  switch (currentShader) {
    case 'waves':
      return (
        <Water
          style={shaderStyle}
          image={src}
          colorInfluence={0.3}
          ripple={0.15}
          speed={0.2}
          scale={1.5}
          fit="cover"
        />
      );

    case 'paper':
    case 'grain':
      return (
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
      );

    default:
      // Fallback to regular image (CSS filters applied via global.css)
      return (
        <div
          className="hero-image-bg"
          style={{
            ...containerStyle,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          role="img"
          aria-label={alt}
        />
      );
  }
}
