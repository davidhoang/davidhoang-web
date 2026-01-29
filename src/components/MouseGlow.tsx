/**
 * MouseGlow Component
 *
 * Renders a smooth, interactive glow effect that follows the cursor.
 * Uses Canvas 2D for performant rendering with lerped movement.
 */

import { useEffect, useRef, useState } from 'react';

interface MouseGlowProps {
  color?: string;
  intensity?: number;
  size?: number;
  smoothing?: number;
}

// Linear interpolation helper
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

// Parse hex color to rgba
function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(255, 255, 255, ${alpha})`;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function MouseGlow({
  color = '#ffffff',
  intensity = 0.4,
  size = 250,
  smoothing = 0.08,
}: MouseGlowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: -1000, y: -1000 });
  const targetPos = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>();
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsEnabled(false);
      return;
    }

    // Check if touch device (no hover capability)
    const isTouchDevice = window.matchMedia('(hover: none)').matches;
    if (isTouchDevice) {
      setIsEnabled(false);
      return;
    }

    // Set canvas size with device pixel ratio for crisp rendering
    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();

    // Debounced resize handler
    let resizeTimeout: number;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(updateCanvasSize, 100);
    };

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
    };

    // Mouse leave handler - move glow off screen
    const handleMouseLeave = () => {
      targetPos.current = { x: -1000, y: -1000 };
    };

    // Draw glow effect
    const drawGlow = (x: number, y: number) => {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      // Skip drawing if cursor is off-screen
      if (x < -500 || y < -500) return;

      // Create radial gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);

      // Gradient stops for smooth falloff
      gradient.addColorStop(0, hexToRgba(color, 0.35));
      gradient.addColorStop(0.3, hexToRgba(color, 0.2));
      gradient.addColorStop(0.6, hexToRgba(color, 0.08));
      gradient.addColorStop(1, hexToRgba(color, 0));

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    };

    // Animation loop
    let lastTime = 0;
    const animate = (time: number) => {
      // Skip if tab is hidden
      if (document.hidden) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Throttle to ~60fps
      if (time - lastTime < 16) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTime = time;

      // Lerp current position toward target
      mousePos.current.x = lerp(mousePos.current.x, targetPos.current.x, smoothing);
      mousePos.current.y = lerp(mousePos.current.y, targetPos.current.y, smoothing);

      drawGlow(mousePos.current.x, mousePos.current.y);

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Add event listeners
    window.addEventListener('resize', handleResize);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [color, size, smoothing]);

  if (!isEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        opacity: intensity,
        willChange: 'transform',
      }}
      aria-hidden="true"
    />
  );
}
