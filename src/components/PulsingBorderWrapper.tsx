/**
 * Pulsing Border Wrapper
 *
 * Wraps children with an animated pulsing border effect using Paper Design shaders.
 * Use on buttons, cards, or navigation elements for a glowing border effect.
 */

import { useEffect, useState, ReactNode } from 'react';
import { PulsingBorder } from '@paper-design/shaders-react';

interface PulsingBorderWrapperProps {
  children: ReactNode;
  colors?: string[];
  colorBack?: string;
  thickness?: number;
  roundness?: number;
  pulse?: number;
  bloom?: number;
  speed?: number;
  intensity?: number;
  softness?: number;
  spots?: number;
  spotSize?: number;
  smoke?: number;
  smokeSize?: number;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export default function PulsingBorderWrapper({
  children,
  colors = ['#ff6b6b', '#4ecdc4', '#45b7d1'],
  colorBack = 'transparent',
  thickness = 0.02,
  roundness = 0.15,
  pulse = 0.3,
  bloom = 0.4,
  speed = 0.3,
  intensity = 0.6,
  softness = 0.3,
  spots = 3,
  spotSize = 0.5,
  smoke = 0,
  smokeSize = 0.3,
  className = '',
  style = {},
  disabled = false,
}: PulsingBorderWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || disabled) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        ...style,
      }}
    >
      {/* Shader border layer */}
      <PulsingBorder
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        colors={colors}
        colorBack={colorBack}
        thickness={thickness}
        roundness={roundness}
        pulse={pulse}
        bloom={bloom}
        speed={speed}
        intensity={intensity}
        softness={softness}
        spots={spots}
        spotSize={spotSize}
        smoke={smoke}
        smokeSize={smokeSize}
      />
      {/* Content layer */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
