import { useMemo, type CSSProperties } from 'react';
import { useMagneticTilt } from '../useMagneticTilt';
import type { HeroDialValues } from './heroDialDefaults';
import { heroDialDefaults } from './heroDialDefaults';

export function cardDimensionStyle(dial: HeroDialValues): CSSProperties {
  return {
    width: dial.card.width,
    height: dial.card.height,
    borderRadius: dial.card.borderRadius,
    marginLeft: -dial.card.width / 2,
    marginTop: -dial.card.height / 2,
    ['--card-radius' as string]: `${dial.card.borderRadius}px`,
    ['--card-hero-inner-radius' as string]: `calc(${dial.card.borderRadius}px - var(--card-hero-frame))`,
    ['--card-panel-inner-radius' as string]: `max(0px, calc(${dial.card.borderRadius}px - var(--card-panel-inset)))`,
  };
}

export function useHeroCardTilt(dial: HeroDialValues, disabled: boolean) {
  return useMagneticTilt({
    disabled: disabled || !dial.tilt.enabled,
    amplitude: dial.tilt.amplitude,
    spring: {
      stiffness: dial.tilt.stiffness,
      damping: dial.tilt.damping,
      mass: dial.tilt.mass,
    },
  });
}

export function scaleFanPosition(
  position: { x: number; y: number; rotation: number },
  dial: HeroDialValues
) {
  const defaults = heroDialDefaults.stackedFan.fan;
  const fan = dial.stackedFan.fan;
  return {
    x: position.x * (fan.spread / defaults.spread),
    y: position.y * (fan.yOffset / defaults.yOffset),
    rotation: position.rotation * (fan.rotation / defaults.rotation),
  };
}

export function scaleScatteredPosition(
  position: { x: number; y: number; rotation: number },
  dial: HeroDialValues
) {
  const defaults = heroDialDefaults.scattered;
  const scattered = dial.scattered;
  return {
    x: position.x * (scattered.spreadX / defaults.spreadX),
    y: position.y * (scattered.spreadY / defaults.spreadY),
    rotation: position.rotation * (scattered.maxRotation / defaults.maxRotation),
  };
}

export function useScaledFanPosition(
  position: { x: number; y: number; rotation: number },
  dial: HeroDialValues
) {
  return useMemo(() => scaleFanPosition(position, dial), [
    position,
    dial.stackedFan.fan.spread,
    dial.stackedFan.fan.yOffset,
    dial.stackedFan.fan.rotation,
  ]);
}
