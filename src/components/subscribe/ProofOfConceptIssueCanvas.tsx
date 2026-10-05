import { useCallback, useMemo, useSyncExternalStore } from 'react';
import '@/styles/uselayouts-tailwind.css';
import {
  LiquidGlassInfiniteGrid,
  type GridItem,
} from '@/components/infinite-grid';
import type { ProofOfConceptIssuesFile } from '@/utils/proofOfConceptIssues';

type Props = {
  archive: ProofOfConceptIssuesFile;
};

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export default function ProofOfConceptIssueCanvas({ archive }: Props) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  const items = useMemo<GridItem[]>(
    () =>
      archive.issues.map((issue) => ({
        id: issue.id,
        title: issue.title,
        subtitle: issue.subtitle ?? undefined,
        imageUrl: issue.coverImage,
        category: 'proof-of-concept',
      })),
    [archive.issues],
  );

  const onItemClick = useCallback(
    (item: GridItem) => {
      const issue = archive.issues.find((entry) => entry.id === item.id);
      if (!issue) return;
      window.open(issue.url, '_blank', 'noopener,noreferrer');
    },
    [archive.issues],
  );

  if (items.length === 0) {
    return (
      <p className="poc-canvas-empty">
        Cover art from recent issues will appear here after the next archive sync.
      </p>
    );
  }

  return (
    <LiquidGlassInfiniteGrid
      items={items}
      columns={3}
      gapVw={2}
      cardWidthVw={22}
      enableLiquidBlobs={!reducedMotion}
      onItemClick={onItemClick}
      className="poc-infinite-grid !min-h-0 !h-full !bg-[var(--color-bg)]"
      cardClassName="poc-infinite-grid__card"
      aria-label="Proof of Concept issues with cover art — drag or scroll to explore"
    />
  );
}
