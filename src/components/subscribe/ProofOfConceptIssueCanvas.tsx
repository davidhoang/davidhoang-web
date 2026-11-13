import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import '@/styles/uselayouts-tailwind.css';
import {
  LiquidGlassInfiniteGrid,
  type GridItem,
} from '@/components/infinite-grid';
import type { ProofOfConceptCanvasIssue } from '@/utils/proofOfConceptIssues';

type Props = {
  issues: ProofOfConceptCanvasIssue[];
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

function CanvasPlaceholder() {
  return (
    <div
      className="poc-infinite-grid poc-canvas-ssr-placeholder h-full w-full bg-[var(--color-bg)]"
      aria-hidden="true"
    />
  );
}

function IssueLinkList({ issues }: { issues: ProofOfConceptCanvasIssue[] }) {
  return (
    <ul className="poc-canvas-issue-links sr-only">
      {issues.map((issue) => (
        <li key={issue.id}>
          <a href={issue.url} target="_blank" rel="noopener noreferrer">
            {issue.title}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function ProofOfConceptIssueCanvas({ issues }: Props) {
  const [gridReady, setGridReady] = useState(false);

  useEffect(() => {
    setGridReady(true);
  }, []);

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  const items = useMemo<GridItem[]>(
    () =>
      issues.map((issue) => ({
        id: issue.id,
        title: issue.title,
        subtitle: issue.subtitle ?? undefined,
        imageUrl: issue.coverImage,
        category: 'proof-of-concept',
      })),
    [issues],
  );

  const onItemClick = useCallback(
    (item: GridItem) => {
      const issue = issues.find((entry) => entry.id === item.id);
      if (!issue) return;
      window.open(issue.url, '_blank', 'noopener,noreferrer');
    },
    [issues],
  );

  if (items.length === 0) {
    return (
      <p className="poc-canvas-empty">
        Cover art from recent issues will appear here after the next archive sync.
      </p>
    );
  }

  // Infinite grid repeats every issue 9× for panning; defer until after hydration.
  return (
    <div className="poc-canvas-shell relative h-full w-full">
      {!gridReady ? (
        <CanvasPlaceholder />
      ) : (
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
      )}
      <IssueLinkList issues={issues} />
    </div>
  );
}
