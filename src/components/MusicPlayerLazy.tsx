import React, { Suspense, lazy } from 'react';

const MusicPlayer = lazy(() => import('./MusicPlayer'));

export default function MusicPlayerLazy({ className }: { className?: string }) {
  return (
    <Suspense fallback={null}>
      <MusicPlayer className={className} />
    </Suspense>
  );
}
