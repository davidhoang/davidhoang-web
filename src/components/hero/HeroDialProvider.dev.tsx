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

function finiteOr<T extends number>(value: T | undefined | null, fallback: T): T {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function HeroDialProviderInner({ children, onReplayEntrance }: HeroDialProviderInnerProps) {
  // Dev-only panel (also gated by HeroDialProvider + DialRoot productionEnabled).
  // v2 persist key: older localStorage could store spread: 0 and collapse the fan.
  const params = useDialKit('Home cards', heroDialConfig, {
    id: 'home-cards',
    persist: {
      key: 'davidhoang-hero-cards-v2',
      storage: 'localStorage',
      presets: true,
    },
    onAction: (action) => {
      if (action === 'replayEntrance') onReplayEntrance?.();
    },
  }) as unknown as HeroDialParams;

  const values = useMemo<HeroDialValues>(() => {
    const defaults = heroDialDefaults;
    const fanDefaults = defaults.stackedFan.fan;
    const spread = finiteOr(params.stackedFan?.fan?.spread, fanDefaults.spread);

    return {
      card: {
        width: finiteOr(params.card?.width, defaults.card.width),
        height: finiteOr(params.card?.height, defaults.card.height),
        borderRadius: finiteOr(params.card?.borderRadius, defaults.card.borderRadius),
      },
      hoverTween: {
        type: 'tween',
        duration: finiteOr(params.hoverTween?.duration, 0.32),
        ease: params.hoverTween?.ease ?? defaults.hoverTween.ease,
      },
      tilt: {
        enabled: Boolean(params.tilt?.enabled),
        amplitude: finiteOr(params.tilt?.amplitude, defaults.tilt.amplitude),
        stiffness: finiteOr(params.tilt?.stiffness, defaults.tilt.stiffness),
        damping: finiteOr(params.tilt?.damping, defaults.tilt.damping),
        mass: finiteOr(params.tilt?.mass, defaults.tilt.mass),
      },
      stackedFan: {
        fan: {
          // Never allow 0 spread — it stacks every card on the center one.
          spread: spread > 0 ? spread : fanDefaults.spread,
          yOffset: finiteOr(params.stackedFan?.fan?.yOffset, fanDefaults.yOffset),
          rotation: finiteOr(params.stackedFan?.fan?.rotation, fanDefaults.rotation),
        },
        wrapper: {
          width: finiteOr(params.stackedFan?.wrapper?.width, defaults.stackedFan.wrapper.width),
          height: finiteOr(params.stackedFan?.wrapper?.height, defaults.stackedFan.wrapper.height),
          marginTop: finiteOr(params.stackedFan?.wrapper?.marginTop, defaults.stackedFan.wrapper.marginTop),
        },
        hover: {
          liftY: finiteOr(params.stackedFan?.hover?.liftY, defaults.stackedFan.hover.liftY),
          scale: finiteOr(params.stackedFan?.hover?.scale, defaults.stackedFan.hover.scale),
          tapScale: finiteOr(params.stackedFan?.hover?.tapScale, defaults.stackedFan.hover.tapScale),
        },
        entrance: {
          initialScale: finiteOr(params.stackedFan?.entrance?.initialScale, defaults.stackedFan.entrance.initialScale),
          staggerDelay: finiteOr(params.stackedFan?.entrance?.staggerDelay, defaults.stackedFan.entrance.staggerDelay),
          stiffness: finiteOr(params.stackedFan?.entrance?.stiffness, defaults.stackedFan.entrance.stiffness),
          damping: finiteOr(params.stackedFan?.entrance?.damping, defaults.stackedFan.entrance.damping),
          settleStiffness: finiteOr(
            params.stackedFan?.entrance?.settleStiffness,
            defaults.stackedFan.entrance.settleStiffness
          ),
          settleDamping: finiteOr(
            params.stackedFan?.entrance?.settleDamping,
            defaults.stackedFan.entrance.settleDamping
          ),
        },
        expand: {
          stiffness: params.stackedFan?.expand?.spring?.stiffness ?? defaults.stackedFan.expand.stiffness,
          damping: params.stackedFan?.expand?.spring?.damping ?? defaults.stackedFan.expand.damping,
          mass: params.stackedFan?.expand?.spring?.mass ?? defaults.stackedFan.expand.mass,
        },
        dimmedOpacity: finiteOr(params.stackedFan?.dimmedOpacity, defaults.stackedFan.dimmedOpacity),
      },
      editorial: { ...defaults.editorial, ...params.editorial },
      scattered: { ...defaults.scattered, ...params.scattered },
      rolodex: { ...defaults.rolodex, ...params.rolodex },
      cinematic: { ...defaults.cinematic, ...params.cinematic },
    };
  }, [params]);

  return (
    <HeroDialContext.Provider value={values}>
      {children}
      <DialRoot
        position="bottom-right"
        defaultOpen
        theme="system"
        productionEnabled={false}
      />
    </HeroDialContext.Provider>
  );
}
