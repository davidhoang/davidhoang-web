import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { homeDescription, homeInstructions, homePeekLabel, type HomeKind, type HomeView } from './homeViews';
import './homes.css';

const HomeScene = lazy(() => import('./HomeScene'));
export type { HomeKind, HomeView };
type Props = { kind: HomeKind; modelUrl: string; posterUrl: string; name: string };
class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function HomeViewer({ kind, modelUrl, posterUrl, name }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(true);
  const [revision, setRevision] = useState(0);
  const [view, setView] = useState<HomeView>('home');
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let onscreen = true;
    const update = () => setActive(onscreen && document.visibilityState === 'visible');
    const io = new IntersectionObserver(([entry]) => {
      onscreen = entry.isIntersecting;
      update();
    }, { threshold: 0.05 });
    io.observe(stage);
    document.addEventListener('visibilitychange', update);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  const onReady = useCallback(() => setReady(true), []);
  const description = homeDescription(kind);
  const peekLabel = homePeekLabel(kind, view, name);
  const fallback = <div className="home-viewer__fallback"><img src={posterUrl} alt={description} /><p className="text-caption">The 3D view is unavailable. Here’s the rendered miniature.</p></div>;
  return <figure className="home-viewer" aria-labelledby={`${kind}-title`}>
    <div className="home-viewer__stage" ref={stageRef}>
      <SceneBoundary fallback={fallback}>
        {!ready && <img className="home-viewer__poster loaded" src={posterUrl} alt={description} loading="lazy" decoding="async" />}
        {mounted && <Suspense fallback={null}>
          <HomeScene
            kind={kind}
            modelUrl={modelUrl}
            view={view}
            revision={revision}
            active={active}
            onReady={onReady}
            onToggleView={() => setView(current => current === 'home' ? 'detail' : 'home')}
            label={`${name}: interactive clay miniature`}
            descriptionId={`${kind}-instructions`}
          />
        </Suspense>}
      </SceneBoundary>
      {ready && <div className="home-viewer__controls">
        <button type="button" className="btn btn-ghost home-viewer__control" onClick={() => setView(current => current === 'home' ? 'detail' : 'home')} aria-pressed={view === 'detail'} aria-label={peekLabel} title={peekLabel}>
          {view === 'detail'
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /><path d="M8 11h6" /></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /><path d="M11 8v6M8 11h6" /></svg>}
        </button>
        <button type="button" className="btn btn-ghost home-viewer__control" onClick={() => { setView('home'); setRevision(n => n + 1); }} aria-label={`Reset ${name} view`} title={`Reset ${name} view`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 11a8 8 0 0 0-14.6-4.6L3 9m0-6v6h6M4 13a8 8 0 0 0 14.6 4.6L21 15m0 6v-6h-6" />
          </svg>
        </button>
      </div>}
    </div>
    <figcaption className="home-viewer__caption"><h3 id={`${kind}-title`}>{name}</h3></figcaption>
    <p id={`${kind}-instructions`} className="sr-only">{homeInstructions()}</p>
  </figure>;
}
