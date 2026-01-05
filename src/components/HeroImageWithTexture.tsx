/**
 * Hero Image with Paper Texture Filter
 *
 * Applies PaperTexture shader as an image filter when default theme is active.
 * Shows regular image when daily theme is active.
 * Click to open modal with side-by-side image and controls.
 */

import { useEffect, useState } from 'react';
import { PaperTexture } from '@paper-design/shaders-react';

interface HeroImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

const defaultSettings = {
  colorFront: '#9fadbc',
  colorBack: '#ffffff',
  contrast: 0.3,
  roughness: 0.4,
  fiber: 0.3,
  fiberSize: 0.2,
  crumples: 0.3,
  crumpleSize: 0.35,
  folds: 0.65,
  foldCount: 5,
  drops: 0.2,
  fade: 0,
  seed: 5.8,
  scale: 1.0,
};

export default function HeroImageWithTexture({
  src,
  alt,
  width,
  height
}: HeroImageProps) {
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [isDefaultTheme, setIsDefaultTheme] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Check current theme mode
    const checkTheme = () => {
      const mode = localStorage.getItem('daily-theme-mode');
      setIsDefaultTheme(mode !== 'daily');
    };
    checkTheme();

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      checkTheme();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-daily-theme'] });

    // Close modal on escape
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    window.addEventListener('keydown', handleKeydown);

    // Listen for storage changes
    const handleStorage = () => checkTheme();
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('storage', handleStorage);
      observer.disconnect();
    };
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const updateSetting = (key: string, value: number | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const copySettings = () => {
    const code = JSON.stringify(settings, null, 2);
    navigator.clipboard.writeText(code);
  };

  const containerStyle: React.CSSProperties = {
    display: 'inline-block',
    maxWidth: '100%',
    borderRadius: 'var(--radius-md, 8px)',
    overflow: 'hidden',
    cursor: 'pointer',
    lineHeight: 0,
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  };

  const modalStyle: React.CSSProperties = {
    display: 'flex',
    maxWidth: '1000px',
    maxHeight: '90vh',
    width: '100%',
    background: 'var(--color-card-bg, #fff)',
    borderRadius: '16px',
    overflow: 'hidden',
  };

  const imageContainerStyle: React.CSSProperties = {
    flex: '1 1 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    background: '#1a1a1a',
  };

  const controlsPanelStyle: React.CSSProperties = {
    flex: '0 0 300px',
    background: 'var(--color-card-bg, #fff)',
    padding: '24px',
    overflowY: 'auto',
    maxHeight: '90vh',
  };

  const sliderRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
    gap: '10px',
  };

  const labelStyle: React.CSSProperties = {
    flex: '0 0 75px',
    fontSize: '12px',
    color: 'var(--color-text)',
  };

  const sliderStyle: React.CSSProperties = {
    flex: 1,
    cursor: 'pointer',
    accentColor: 'var(--color-link)',
  };

  const valueStyle: React.CSSProperties = {
    flex: '0 0 36px',
    textAlign: 'right',
    fontFamily: 'monospace',
    fontSize: '11px',
    color: 'var(--color-muted)',
  };

  const renderShader = (size: 'small' | 'large') => (
    <PaperTexture
      style={{
        display: 'block',
        width: size === 'small' ? width : 'auto',
        height: size === 'small' ? height : '70vh',
        aspectRatio: `${width}/${height}`,
        borderRadius: size === 'small' ? 'var(--radius-md, 8px)' : '0',
        maxWidth: '100%',
      }}
      image={src}
      colorFront={settings.colorFront}
      colorBack={settings.colorBack}
      contrast={settings.contrast}
      roughness={settings.roughness}
      fiber={settings.fiber}
      fiberSize={settings.fiberSize}
      crumples={settings.crumples}
      crumpleSize={settings.crumpleSize}
      folds={settings.folds}
      foldCount={settings.foldCount}
      drops={settings.drops}
      fade={settings.fade}
      seed={settings.seed}
      scale={settings.scale}
    />
  );

  // Show loading placeholder before mount
  if (!mounted) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        fetchPriority="high"
        decoding="async"
        className="img-themed hero-portrait"
      />
    );
  }

  // For daily themes, show regular image (CSS filters applied via global.css)
  if (!isDefaultTheme) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="img-themed hero-portrait"
        style={{
          display: 'block',
          width: width,
          maxWidth: '100%',
          height: 'auto',
          borderRadius: 'var(--radius-md, 8px)',
        }}
      />
    );
  }

  // For default theme, show paper texture shader with interactive controls
  return (
    <>
      <div
        style={containerStyle}
        onClick={() => setShowModal(true)}
        title="Click to play with the paper texture effect"
      >
        {renderShader('small')}
      </div>

      {showModal && (
        <div style={overlayStyle} onClick={() => setShowModal(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={imageContainerStyle}>
              {renderShader('large')}
            </div>

            <div style={controlsPanelStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--color-text)' }}>Play with the texture</h3>
                <button
                  onClick={() => setShowModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: 'var(--color-muted)', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '16px' }}>
                Adjust the sliders to change the paper texture effect in real-time.
              </p>

              {[
                { key: 'scale', label: 'Scale', min: 0.1, max: 2, step: 0.1 },
                { key: 'contrast', label: 'Contrast', min: 0, max: 1, step: 0.05 },
                { key: 'roughness', label: 'Roughness', min: 0, max: 1, step: 0.05 },
                { key: 'fiber', label: 'Fiber', min: 0, max: 1, step: 0.05 },
                { key: 'fiberSize', label: 'Fiber Size', min: 0, max: 1, step: 0.05 },
                { key: 'crumples', label: 'Crumples', min: 0, max: 1, step: 0.05 },
                { key: 'crumpleSize', label: 'Crumple Size', min: 0, max: 1, step: 0.05 },
                { key: 'folds', label: 'Folds', min: 0, max: 1, step: 0.05 },
                { key: 'foldCount', label: 'Fold Count', min: 1, max: 10, step: 1 },
                { key: 'drops', label: 'Drops', min: 0, max: 1, step: 0.05 },
                { key: 'fade', label: 'Fade', min: 0, max: 1, step: 0.05 },
                { key: 'seed', label: 'Seed', min: 0, max: 10, step: 0.1 },
              ].map(({ key, label, min, max, step }) => (
                <div key={key} style={sliderRowStyle}>
                  <span style={labelStyle}>{label}</span>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={settings[key as keyof typeof settings] as number}
                    onChange={(e) => updateSetting(key, parseFloat(e.target.value))}
                    style={sliderStyle}
                  />
                  <span style={valueStyle}>{(settings[key as keyof typeof settings] as number).toFixed(2)}</span>
                </div>
              ))}

              <div style={{ ...sliderRowStyle, marginTop: '8px' }}>
                <span style={labelStyle}>Tint</span>
                <input
                  type="color"
                  value={settings.colorFront}
                  onChange={(e) => updateSetting('colorFront', e.target.value)}
                  style={{ flex: 1, height: '28px', cursor: 'pointer', border: 'none', borderRadius: '4px' }}
                />
              </div>

              <div style={sliderRowStyle}>
                <span style={labelStyle}>Background</span>
                <input
                  type="color"
                  value={settings.colorBack}
                  onChange={(e) => updateSetting('colorBack', e.target.value)}
                  style={{ flex: 1, height: '28px', cursor: 'pointer', border: 'none', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={copySettings}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--color-link)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  Copy Settings
                </button>
                <button
                  onClick={() => setSettings(defaultSettings)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'var(--color-border)',
                    color: 'var(--color-text)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  Reset
                </button>
              </div>

              <p style={{ marginTop: '16px', color: 'var(--color-muted)', fontSize: '11px', textAlign: 'center' }}>
                Shader by <a href="https://shaders.paper.design" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-link)' }}>Paper Design</a>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
