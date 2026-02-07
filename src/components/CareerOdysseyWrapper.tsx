import React, { Suspense, lazy } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

// Lazy load the heavy CareerOdyssey component (5,868 lines)
const CareerOdyssey = lazy(() => import('./CareerOdyssey'));

interface CareerOdysseyWrapperProps {
  careerData: any;
}

// Loading skeleton shown while lazy component loads
const CareerOdysseyLoading = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    padding: '2rem',
    textAlign: 'center',
    color: 'var(--color-text, #333)'
  }} aria-busy="true" aria-label="Loading Career Odyssey">
    <div style={{
      width: '48px',
      height: '48px',
      border: '3px solid var(--color-border, #e0e0e0)',
      borderTopColor: 'var(--color-text, #333)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <p style={{ marginTop: '1rem', opacity: 0.7 }}>Loading Career Odyssey...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Error fallback shown when component fails to load
const CareerOdysseyFallback = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    padding: '2rem',
    textAlign: 'center',
    color: 'var(--color-text, #333)'
  }}>
    <h2 style={{ marginBottom: '1rem' }}>Unable to load Career Odyssey</h2>
    <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
      The interactive canvas failed to load. This may be due to browser compatibility issues.
    </p>
    <button
      onClick={() => window.location.reload()}
      style={{
        padding: '0.75rem 1.5rem',
        cursor: 'pointer',
        border: '1px solid currentColor',
        background: 'transparent',
        color: 'inherit',
        borderRadius: '4px',
        fontSize: '1rem'
      }}
    >
      Refresh page
    </button>
  </div>
);

export const CareerOdysseyWrapper: React.FC<CareerOdysseyWrapperProps> = ({ careerData }) => {
  return (
    <ErrorBoundary fallback={<CareerOdysseyFallback />}>
      <Suspense fallback={<CareerOdysseyLoading />}>
        <CareerOdyssey careerData={careerData} />
      </Suspense>
    </ErrorBoundary>
  );
};

export default CareerOdysseyWrapper;
