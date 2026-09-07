import { Component, lazy, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import './homes.css';

const HomeScene = lazy(() => import('./HomeScene'));
export type HomeKind = 'desert' | 'clocktower';
export type HomeView = 'home' | 'detail';
type Props = { kind: HomeKind; modelUrl: string; posterUrl: string; name: string; location: string };
class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function HomeViewer({ kind, modelUrl, posterUrl, name, location }: Props) {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<HomeView>('home');
  const [revision, setRevision] = useState(0);
  useEffect(() => setMounted(true), []);
  const onReady = useCallback(() => setReady(true), []);
  const detail = kind === 'desert' ? 'Meet Kai' : 'See the clock';
  const description = kind === 'desert'
    ? 'Clay miniature of our Palm Springs home, with palms, terracotta roofs and Kai the tabby cat by the front path.'
    : 'Clay miniature of the Clocktower in San Francisco, with arched factory windows, courtyards and a copper-colored tower roof.';
  const fallback = <div className="home-viewer__fallback"><img src={posterUrl} alt={description} /><p className="text-caption">The 3D view is unavailable. Here’s the rendered miniature.</p></div>;
  function reset() { setView('home'); setRevision(n => n + 1); }
  return <figure className="home-viewer" aria-labelledby={`${kind}-title`}>
    <div className="home-viewer__stage">
      <SceneBoundary fallback={fallback}>
        {!ready && <img className="home-viewer__poster loaded" src={posterUrl} alt={description} loading="lazy" decoding="async" />}
        {mounted && <Suspense fallback={null}>
          <HomeScene kind={kind} modelUrl={modelUrl} view={view} revision={revision} onReady={onReady} label={`${name}: interactive clay miniature`} descriptionId={`${kind}-instructions`} />
        </Suspense>}
      </SceneBoundary>
    </div>
    <figcaption className="home-viewer__caption">
      <div><h3 id={`${kind}-title`}>{name}</h3><p className="text-caption text-muted">{location}</p></div>
      {ready && <div className="home-viewer__actions">
        <button type="button" className="btn btn-ghost text-caption" aria-pressed={view === 'detail'} onClick={() => { setView('detail'); setRevision(n => n + 1); }}>{detail}</button>
        <button type="button" className="btn btn-ghost text-caption" onClick={reset} aria-label={`Reset ${name} view`}>Reset</button>
      </div>}
    </figcaption>
    <p id={`${kind}-instructions`} className="home-viewer__instructions text-caption text-muted"><span className="home-viewer__desktop-hint">Drag to orbit · Shift-drag to pan · Scroll to zoom</span><span className="home-viewer__touch-hint">One finger to orbit · Two fingers to pan & zoom</span><span className="sr-only">. Keyboard: arrow keys pan, + / − zoom.</span></p>
  </figure>;
}
