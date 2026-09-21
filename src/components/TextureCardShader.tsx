/**
 * Paper Design dithering shader for TextureCard hover / focus surfaces
 * and quieter always-on fills (Work career cards).
 * @see https://shaders.paper.design/dithering
 */

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Dithering } from '@paper-design/shaders-react';

export type TextureCardShaderVariant = 'overlay' | 'surface';

export type TextureCardShaderPalette = {
  light: { front: string; back: string };
  dark: { front: string; back: string };
};

interface TextureCardShaderProps {
  /**
   * `overlay` — TextureCard hover texture (sphere, finer grain).
   * `surface` — always-on card fill; coarser wave so type stays readable.
   */
  variant?: TextureCardShaderVariant;
  /** Brand palette for career cards. Falls back to theme tokens when omitted. */
  palette?: TextureCardShaderPalette;
  /** Paper dither animation speed. Lower is slower. Reduced motion still forces 0. */
  speed?: number;
  /** Show a hover handle that opens live Paper controls. */
  editable?: boolean;
  /** Stable id for the popover. Defaults to a React id. */
  controlId?: string;
}

const SURFACE_MAX_PIXELS = 640 * 400;
const SURFACE_SPEED = 0.044;
const OVERLAY_SPEED = 0.85;
const SURFACE_SIZE = 9;
const OVERLAY_SIZE = 2;
const SURFACE_SCALE = 1.7;
const OVERLAY_SCALE = 0.6;

const DITHER_SHAPES = ['simplex', 'warp', 'dots', 'wave', 'ripple', 'swirl', 'sphere'] as const;
const DITHER_TYPES = ['random', '2x2', '4x4', '8x8'] as const;

type DitherShape = (typeof DITHER_SHAPES)[number];
type DitherType = (typeof DITHER_TYPES)[number];

function toHex6(color: string): string {
  const value = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  const rgb = value.match(/rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)/i);
  if (rgb) {
    const hex = (channel: string) =>
      Math.round(Number(channel)).toString(16).padStart(2, '0');
    return `#${hex(rgb[1])}${hex(rgb[2])}${hex(rgb[3])}`;
  }
  return '#000000';
}

function formatParam(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function placePanel(handle: HTMLElement, panel: HTMLElement) {
  const rect = handle.getBoundingClientRect();
  const gap = 8;
  const width = panel.offsetWidth || 300;
  const height = panel.offsetHeight || 360;
  let top = rect.bottom + gap;
  let left = rect.right - width;
  if (left < 8) left = 8;
  if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
  if (top + height > window.innerHeight - 8) {
    top = Math.max(8, rect.top - height - gap);
  }
  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
  panel.style.right = 'auto';
}

export default function TextureCardShader({
  variant = 'overlay',
  palette,
  speed: speedProp,
  editable = false,
  controlId,
}: TextureCardShaderProps) {
  const reactId = useId();
  const panelId = `shader-play-${(controlId ?? reactId).replace(/:/g, '')}`;
  const mountRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dirtyRef = useRef(false);

  const isSurface = variant === 'surface';
  const defaultSpeed = speedProp ?? (isSurface ? SURFACE_SPEED : OVERLAY_SPEED);

  const [mounted, setMounted] = useState(false);
  const [eInk, setEInk] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [cardHost, setCardHost] = useState<HTMLElement | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [shape, setShape] = useState<DitherShape>(isSurface ? 'wave' : 'sphere');
  const [type, setType] = useState<DitherType>(isSurface ? 'random' : '4x4');
  const [size, setSize] = useState(isSurface ? SURFACE_SIZE : OVERLAY_SIZE);
  const [scale, setScale] = useState(isSurface ? SURFACE_SCALE : OVERLAY_SCALE);
  const [speed, setSpeed] = useState(defaultSpeed);
  const [colors, setColors] = useState(() => {
    if (palette && typeof document !== 'undefined') {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const pair = isDark ? palette.dark : palette.light;
      return { front: pair.front, back: pair.back };
    }
    return {
      front: palette?.light.front ?? '#00b3ff',
      back: palette?.light.back ?? '#000000',
    };
  });

  useEffect(() => {
    setMounted(true);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReducedMotion(mq.matches);
    syncMotion();
    mq.addEventListener('change', syncMotion);

    const syncTheme = () => {
      const root = document.documentElement;
      setEInk(root.getAttribute('data-e-ink') === 'true');
      if (dirtyRef.current) return;

      const isDark = root.getAttribute('data-theme') === 'dark';

      if (palette) {
        const pair = isDark ? palette.dark : palette.light;
        setColors({ front: pair.front, back: pair.back });
        return;
      }

      const styles = getComputedStyle(root);
      const bgToken = isSurface ? '--color-sidebar-bg' : '--color-bg';
      const bg = styles.getPropertyValue(bgToken).trim() || styles.getPropertyValue('--color-bg').trim();
      const link = styles.getPropertyValue('--color-link').trim();
      setColors({
        back: bg || '#ffffff',
        front: link || '#0066cc',
      });
    };

    syncTheme();
    const obs = new MutationObserver(syncTheme);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-e-ink', 'data-daily-theme'],
    });

    return () => {
      mq.removeEventListener('change', syncMotion);
      obs.disconnect();
    };
  }, [isSurface, palette]);

  useEffect(() => {
    if (!editable || !mounted) return;
    setCardHost((mountRef.current?.closest('.works-card') as HTMLElement | null) ?? null);
  }, [editable, mounted]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const onToggle = (event: Event) => {
      const nextOpen = 'newState' in event && (event as ToggleEvent).newState === 'open';
      setPanelOpen(nextOpen);
    };
    panel.addEventListener('toggle', onToggle);
    return () => panel.removeEventListener('toggle', onToggle);
  }, [cardHost]);

  useEffect(() => {
    if (!panelOpen) return;
    const update = () => {
      if (handleRef.current && panelRef.current) {
        placePanel(handleRef.current, panelRef.current);
      }
    };
    const frame = window.requestAnimationFrame(update);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [panelOpen]);

  if (!mounted || eInk) {
    return null;
  }

  const markDirty = () => {
    dirtyRef.current = true;
  };

  const dither = (
    <Dithering
      key={editable ? panelId : `${colors.front}-${colors.back}`}
      style={{ width: '100%', height: '100%', display: 'block' }}
      colorBack={colors.back}
      colorFront={colors.front}
      shape={shape}
      type={type}
      size={size}
      scale={scale}
      speed={reducedMotion ? 0 : speed}
      fit="cover"
      {...(isSurface ? { maxPixelCount: SURFACE_MAX_PIXELS } : {})}
    />
  );

  if (!editable) {
    return dither;
  }

  const controls =
    cardHost &&
    createPortal(
      <>
        <button
          ref={handleRef}
          type="button"
          className="shader-play__handle"
          popoverTarget={panelId}
          popoverTargetAction="toggle"
          aria-expanded={panelOpen}
          aria-controls={panelId}
          aria-label="Edit Paper shader controls"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <svg className="shader-play__mark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 39 39" fill="currentColor" aria-hidden="true">
            <path d="M39 24H24V6H6V24H24V39H0V6H6V0H39V24Z" />
          </svg>
        </button>
        <div
          ref={panelRef}
          id={panelId}
          popover="auto"
          className="shader-play__panel"
          role="dialog"
          aria-label="Shader controls"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="shader-play__head">
            <p className="shader-play__title">
              <svg className="shader-play__mark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 39 39" fill="currentColor" aria-hidden="true">
                <path d="M39 24H24V6H6V24H24V39H0V6H6V0H39V24Z" />
              </svg>
              Shaders
            </p>
            <a
              className="shader-play__open"
              href="https://paper.design"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Paper (opens in new tab)"
            >
              Open Paper
            </a>
          </div>
          <form onSubmit={(event) => event.preventDefault()}>
            <fieldset className="shader-play__fields">
              <legend className="shader-play__legend">Shaders</legend>
              <label className="shader-play__row">
                <span className="shader-play__label">Color Front</span>
                <span className="shader-play__control">
                  <input
                    className="shader-play__swatch"
                    type="color"
                    value={toHex6(colors.front)}
                    aria-label="Color Front"
                    onChange={(event) => {
                      markDirty();
                      setColors((current) => ({ ...current, front: event.target.value }));
                    }}
                  />
                  <span className="shader-play__hex">{toHex6(colors.front)}</span>
                </span>
              </label>
              <label className="shader-play__row">
                <span className="shader-play__label">Color Back</span>
                <span className="shader-play__control">
                  <input
                    className="shader-play__swatch"
                    type="color"
                    value={toHex6(colors.back)}
                    aria-label="Color Back"
                    onChange={(event) => {
                      markDirty();
                      setColors((current) => ({ ...current, back: event.target.value }));
                    }}
                  />
                  <span className="shader-play__hex">{toHex6(colors.back)}</span>
                </span>
              </label>
              <label className="shader-play__row">
                <span className="shader-play__label">Shape</span>
                <select
                  className="shader-play__select"
                  value={shape}
                  onChange={(event) => {
                    markDirty();
                    setShape(event.target.value as DitherShape);
                  }}
                >
                  {DITHER_SHAPES.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="shader-play__row">
                <span className="shader-play__label">Type</span>
                <select
                  className="shader-play__select"
                  value={type}
                  onChange={(event) => {
                    markDirty();
                    setType(event.target.value as DitherType);
                  }}
                >
                  {DITHER_TYPES.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="shader-play__row">
                <span className="shader-play__label">Size</span>
                <span className="shader-play__control">
                  <input
                    className="shader-play__range"
                    type="range"
                    min={1}
                    max={12}
                    step={0.1}
                    value={size}
                    onChange={(event) => {
                      markDirty();
                      setSize(Number(event.target.value));
                    }}
                  />
                  <span className="shader-play__value">{formatParam(size)}</span>
                </span>
              </label>
              <label className="shader-play__row">
                <span className="shader-play__label">Scale</span>
                <span className="shader-play__control">
                  <input
                    className="shader-play__range"
                    type="range"
                    min={0.2}
                    max={3}
                    step={0.01}
                    value={scale}
                    onChange={(event) => {
                      markDirty();
                      setScale(Number(event.target.value));
                    }}
                  />
                  <span className="shader-play__value">{formatParam(scale)}</span>
                </span>
              </label>
              <label className="shader-play__row">
                <span className="shader-play__label">Speed</span>
                <span className="shader-play__control">
                  <input
                    className="shader-play__range"
                    type="range"
                    min={0}
                    max={1.2}
                    step={0.005}
                    value={speed}
                    disabled={reducedMotion}
                    onChange={(event) => {
                      markDirty();
                      setSpeed(Number(event.target.value));
                    }}
                  />
                  <span className="shader-play__value">{formatParam(speed)}</span>
                </span>
              </label>
            </fieldset>
          </form>
        </div>
      </>,
      cardHost
    );

  return (
    <div ref={mountRef} className="shader-play__canvas" style={{ width: '100%', height: '100%' }} aria-hidden="true">
      {dither}
      {controls}
    </div>
  );
}
