import { lazy, Suspense, useEffect, useState } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

// Deliberately a dynamic import: it keeps three/@react-three out of this
// island's chunk so the renderer stays in the optional `homes-3d` bundle.
const DioramaScene = lazy(() => import('./DioramaScene'));

function Placeholder({ message }: { message: string }) {
  return (
    <div className="diorama-canvas__placeholder">
      <p className="diorama-loader" role="status">
        <span className="diorama-loader__dot" aria-hidden="true" />
        {message}
      </p>
    </div>
  );
}

export default function GrecoDiorama() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div
      className="diorama-canvas"
      role="img"
      aria-label="Interactive clay diorama of a single-story desert house with palms, xeriscape, and mountains on a rounded base"
    >
      <ErrorBoundary fallback={<Placeholder message="The 3D view is unavailable." />}>
        {mounted && (
          <Suspense fallback={<Placeholder message="Loading clay house" />}>
            <DioramaScene />
          </Suspense>
        )}
      </ErrorBoundary>
      <p className="diorama-canvas__hint">Drag to orbit</p>
    </div>
  );
}
