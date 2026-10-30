/**
 * Hero Image with Shader Effects
 *
 * Applies Paper Design shader filters to hero images.
 * Default theme shows plain image, daily themes use shader filters.
 * Supports responsive srcset for optimized loading across devices.
 */

import { useEffect, useState, type ComponentType } from 'react';
import type { HeroImageShaderOverlaysProps } from '../shaders/lazy/HeroImageShaderOverlays';

interface HeroImageShaderProps {
  src: string;
  alt: string;
  priority?: boolean;
  /** PageHeader already renders an optimized hero image — avoid a duplicate <img>. */
  withStaticHeroImage?: boolean;
}

function heroNeedsShaderOverlay(isDefaultTheme: boolean, currentShader: string) {
  if (isDefaultTheme) return false;
  return currentShader === 'waves' || currentShader === 'paper' || currentShader === 'grain';
}

export default function HeroImageShader({
  src,
  alt,
  priority = false,
  withStaticHeroImage = false,
}: HeroImageShaderProps) {
  const [mounted, setMounted] = useState(false);
  const [isDefaultTheme, setIsDefaultTheme] = useState(true);
  const [currentShader, setCurrentShader] = useState<string>('halftone');
  const [Overlays, setOverlays] = useState<ComponentType<HeroImageShaderOverlaysProps> | null>(null);

  useEffect(() => {
    setMounted(true);

    const checkTheme = () => {
      const isDefault = localStorage.getItem('daily-theme-mode') !== 'true';
      setIsDefaultTheme(isDefault);

      if (!isDefault) {
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

  useEffect(() => {
    if (!mounted || !heroNeedsShaderOverlay(isDefaultTheme, currentShader)) {
      setOverlays(null);
      return;
    }

    let cancelled = false;
    import('../shaders/lazy/HeroImageShaderOverlays').then((mod) => {
      if (!cancelled) setOverlays(() => mod.default);
    });

    return () => {
      cancelled = true;
    };
  }, [mounted, isDefaultTheme, currentShader]);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  };

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

  if (withStaticHeroImage) {
    if (
      !mounted ||
      isDefaultTheme ||
      !heroNeedsShaderOverlay(isDefaultTheme, currentShader) ||
      !Overlays
    ) {
      return null;
    }
    return (
      <Overlays src={src} alt={alt} priority={priority} currentShader={currentShader} />
    );
  }

  if (!mounted) {
    return (
      <div style={containerStyle}>
        <HeroImage />
      </div>
    );
  }

  if (isDefaultTheme) {
    return (
      <div style={containerStyle}>
        <HeroImage />
      </div>
    );
  }

  if (heroNeedsShaderOverlay(isDefaultTheme, currentShader)) {
    if (!Overlays) {
      return (
        <div style={containerStyle}>
          <HeroImage />
        </div>
      );
    }
    return (
      <Overlays src={src} alt={alt} priority={priority} currentShader={currentShader} />
    );
  }

  return (
    <div className="hero-image-bg" style={containerStyle}>
      <HeroImage className="hero-responsive-image" />
    </div>
  );
}
