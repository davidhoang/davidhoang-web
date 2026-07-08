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
      fan: {
        spread: params.fan.spread,
        yOffset: params.fan.yOffset,
        rotation: params.fan.rotation,
      },
      wrapper: {
        width: params.wrapper.width,
        height: params.wrapper.height,
        marginTop: params.wrapper.marginTop,
      },
      card: {
        width: params.card.width,
        height: params.card.height,
        borderRadius: params.card.borderRadius,
      },
      hover: {
        liftY: params.hover.liftY,
        scale: params.hover.scale,
        tapScale: params.hover.tapScale,
      },
      entrance: {
        initialScale: params.entrance.initialScale,
        staggerDelay: params.entrance.staggerDelay,
        stiffness: params.entrance.stiffness,
        damping: params.entrance.damping,
        settleStiffness: params.entrance.settleStiffness,
        settleDamping: params.entrance.settleDamping,
      },
      expand: {
        stiffness: params.expand.spring.stiffness ?? heroDialDefaults.expand.stiffness,
        damping: params.expand.spring.damping ?? heroDialDefaults.expand.damping,
        mass: params.expand.spring.mass ?? heroDialDefaults.expand.mass,
      },
      hoverTween: {
        type: 'tween',
        duration: params.hoverTween.duration,
        ease: params.hoverTween.ease,
      },
      dimmedOpacity: params.dimmedOpacity,
      tilt: {
        enabled: params.tilt.enabled,
        amplitude: params.tilt.amplitude,
        stiffness: params.tilt.stiffness,
        damping: params.tilt.damping,
        mass: params.tilt.mass,
      },
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
