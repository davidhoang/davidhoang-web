import { Component, lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import './homes.css';

const HomeScene = lazy(() => import('./HomeScene'));
export type HomeKind = 'desert' | 'clocktower';
export type HomeView = 'home' | 'detail';
type Props = { kind: HomeKind; modelUrl: string; posterUrl: string; name: string };
class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function HomeViewer({ kind, modelUrl, posterUrl, name }: Props) {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => setMounted(true), []);
  const onReady = useCallback(() => setReady(true), []);
  const description = kind === 'desert'
    ? 'Clay miniature of our Palm Springs home, with palms, terracotta roofs and Kai the tabby cat by the front path.'
    : 'Clay miniature of the Clocktower in San Francisco, with arched factory windows, courtyards and a copper-colored tower roof.';
  const fallback = <div className="home-viewer__fallback"><img src={posterUrl} alt={description} /><p className="text-caption">The 3D view is unavailable. Here’s the rendered miniature.</p></div>;
  return <figure className="home-viewer" aria-labelledby={`${kind}-title`}>
    <div className="home-viewer__stage">
      <SceneBoundary fallback={fallback}>
        {!ready && <img className="home-viewer__poster loaded" src={posterUrl} alt={description} loading="lazy" decoding="async" />}
        {mounted && <Suspense fallback={null}>
          <HomeScene kind={kind} modelUrl={modelUrl} view="home" revision={revision} onReady={onReady} label={`${name}: interactive clay miniature`} descriptionId={`${kind}-instructions`} />
        </Suspense>}
      </SceneBoundary>
      {ready && <button type="button" className="btn btn-ghost home-viewer__refresh" onClick={() => setRevision(n => n + 1)} aria-label={`Reset ${name} view`} title={`Reset ${name} view`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 11a8 8 0 0 0-14.6-4.6L3 9m0-6v6h6M4 13a8 8 0 0 0 14.6 4.6L21 15m0 6v-6h-6" />
        </svg>
      </button>}
    </div>
    <figcaption className="home-viewer__caption"><h3 id={`${kind}-title`}>{name}</h3></figcaption>
    <p id={`${kind}-instructions`} className="sr-only">Drag to orbit, Shift-drag to pan, scroll to zoom. Touch: one finger orbits, two fingers pan and zoom. Keyboard: arrow keys pan, + / − zoom.</p>
  </figure>;
}
