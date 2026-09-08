import { Suspense, lazy } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import type { CareerOdysseyData } from './career-odyssey/types';

const CareerCanvas = lazy(() => import('./career-odyssey/CareerCanvas'));

function CareerOdysseyLoading() {
  return <div className="co-loading" aria-busy="true" aria-label="Loading Career Odyssey">
    <img src="/images/odyssey/img-san-francisco-2015.webp" alt="Looking toward the Golden Gate Bridge from the beach in San Francisco." width="1600" height="900" fetchPriority="high" />
    <h1>Career Odyssey</h1><p>Opening the canvas…</p>
  </div>;
}

function CareerOdysseyFallback() {
  return <div className="co-loading">
    <h1>Career Odyssey</h1>
    <img src="/images/odyssey/img-san-francisco-2015.webp" alt="Looking toward the Golden Gate Bridge from the beach in San Francisco." width="1600" height="900" />
    <h2>2015 · Moved to San Francisco</h2>
    <p>The canvas couldn’t open. You can try again or explore the stories in my writing.</p>
    <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>Try again</button>
    <a href="/writing">Explore my writing</a>
  </div>;
}

export default function CareerOdysseyWrapper({ careerData }: { careerData: CareerOdysseyData }) {
  return <ErrorBoundary fallback={<CareerOdysseyFallback />}><Suspense fallback={<CareerOdysseyLoading />}><CareerCanvas careerData={careerData} /></Suspense></ErrorBoundary>;
}
