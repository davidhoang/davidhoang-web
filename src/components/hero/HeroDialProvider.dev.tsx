import { useMemo, type ReactNode } from 'react';
import { DialRoot, useDialKit } from 'dialkit';
import 'dialkit/styles.css';
import { heroDialConfig, type HeroDialParams } from './heroDialConfig';
import { heroDialDefaults, type HeroDialValues } from './heroDialDefaults';
import { HeroDialContext } from './heroDialContext';

interface HeroDialProviderInnerProps {
  children: ReactNode;
  onReplayEntrance?: () => void;
}

export function HeroDialProviderInner({ children, onReplayEntrance }: HeroDialProviderInnerProps) {
  const params = useDialKit('Home cards', heroDialConfig, {
    persist: { key: 'davidhoang-hero-cards', presets: true },
    onAction: (action) => {
      if (action === 'replayEntrance') onReplayEntrance?.();
    },
  }) as unknown as HeroDialParams;

  const values = useMemo<HeroDialValues>(
    () => ({
      card: {
        width: params.card.width,
        height: params.card.height,
        borderRadius: params.card.borderRadius,
      },
      hoverTween: {
        type: 'tween',
        duration: params.hoverTween.duration,
        ease: params.hoverTween.ease,
      },
      tilt: {
        enabled: params.tilt.enabled,
        amplitude: params.tilt.amplitude,
        stiffness: params.tilt.stiffness,
        damping: params.tilt.damping,
        mass: params.tilt.mass,
      },
      stackedFan: {
        fan: {
          spread: params.stackedFan.fan.spread,
          yOffset: params.stackedFan.fan.yOffset,
          rotation: params.stackedFan.fan.rotation,
        },
        wrapper: {
          width: params.stackedFan.wrapper.width,
          height: params.stackedFan.wrapper.height,
          marginTop: params.stackedFan.wrapper.marginTop,
        },
        hover: {
          liftY: params.stackedFan.hover.liftY,
          scale: params.stackedFan.hover.scale,
          tapScale: params.stackedFan.hover.tapScale,
        },
        entrance: {
          initialScale: params.stackedFan.entrance.initialScale,
          staggerDelay: params.stackedFan.entrance.staggerDelay,
          stiffness: params.stackedFan.entrance.stiffness,
          damping: params.stackedFan.entrance.damping,
          settleStiffness: params.stackedFan.entrance.settleStiffness,
          settleDamping: params.stackedFan.entrance.settleDamping,
        },
        expand: {
          stiffness: params.stackedFan.expand.spring.stiffness ?? heroDialDefaults.stackedFan.expand.stiffness,
          damping: params.stackedFan.expand.spring.damping ?? heroDialDefaults.stackedFan.expand.damping,
          mass: params.stackedFan.expand.spring.mass ?? heroDialDefaults.stackedFan.expand.mass,
        },
        dimmedOpacity: params.stackedFan.dimmedOpacity,
      },
      editorial: { ...params.editorial },
      scattered: { ...params.scattered },
      rolodex: { ...params.rolodex },
      cinematic: { ...params.cinematic },
    }),
    [params]
  );

  return (
    <HeroDialContext.Provider value={values}>
      {children}
      <DialRoot position="bottom-right" defaultOpen={false} theme="system" />
    </HeroDialContext.Provider>
  );
}
