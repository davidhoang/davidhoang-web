import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import CareerOdyssey from './CareerOdyssey';

interface CareerOdysseyWrapperProps {
  careerData: any;
}

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
      <CareerOdyssey careerData={careerData} />
    </ErrorBoundary>
  );
};

export default CareerOdysseyWrapper;
