import { useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { heroDialDefaults, type HeroDialValues } from './heroDialDefaults';
import { HeroDialContext } from './heroDialContext';

export function useHeroDial(): HeroDialValues {
  return useContext(HeroDialContext);
}

interface HeroDialProviderProps {
  children: ReactNode;
  onReplayEntrance?: () => void;
}

export function HeroDialProvider({ children, onReplayEntrance }: HeroDialProviderProps) {
  if (import.meta.env.DEV) {
    return (
      <HeroDialProviderDevLoader onReplayEntrance={onReplayEntrance}>
        {children}
      </HeroDialProviderDevLoader>
    );
  }

  return <HeroDialContext.Provider value={heroDialDefaults}>{children}</HeroDialContext.Provider>;
}

function HeroDialProviderDevLoader({ children, onReplayEntrance }: HeroDialProviderProps) {
  const [DevProvider, setDevProvider] = useState<
    React.ComponentType<HeroDialProviderProps> | null
  >(null);

  useEffect(() => {
    void import('./HeroDialProvider.dev').then((mod) => {
      setDevProvider(() => mod.HeroDialProviderInner);
    });
  }, []);

  if (!DevProvider) {
    return <HeroDialContext.Provider value={heroDialDefaults}>{children}</HeroDialContext.Provider>;
  }

  return (
    <DevProvider onReplayEntrance={onReplayEntrance}>{children}</DevProvider>
  );
}

export function useScaledFanPosition(
  position: { x: number; y: number; rotation: number },
  dial: HeroDialValues
) {
  return useMemo(
    () => ({
      x: position.x * (dial.fan.spread / heroDialDefaults.fan.spread),
      y: position.y * (dial.fan.yOffset / heroDialDefaults.fan.yOffset),
      rotation: position.rotation * (dial.fan.rotation / heroDialDefaults.fan.rotation),
    }),
    [position, dial.fan.spread, dial.fan.yOffset, dial.fan.rotation]
  );
}
