import { useEffect, useState, type ComponentType } from 'react';
import type { ThemeData } from './ThemeSpecRenderer';

type Props = {
  themes: ThemeData[];
};

/**
 * Thin island entry for /daily-themes. Dynamic import keeps json-render, Zod, and
 * catalog code in the optional `themes-explorer` chunk (see astro.config.mjs).
 */
export default function ThemesExplorerMount({ themes }: Props) {
  const [Explorer, setExplorer] = useState<ComponentType<Props> | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import('./ThemesExplorer').then((mod) => {
      if (!cancelled) setExplorer(() => mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Explorer) {
    return (
      <div
        className="themes-explorer themes-explorer--loading"
        role="status"
        aria-busy="true"
        aria-label="Loading themes explorer"
      />
    );
  }

  return <Explorer themes={themes} />;
}