import { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { CareerOdysseyData, PositionedNode } from './types';
import { calculateLayout, buildConnections, getCanvasBounds } from './layout';
import { CareerNode } from './CareerNode';
import { ConnectionLine } from './ConnectionLine';

const NodeDetailModal = lazy(() =>
  import('./NodeDetailModal').then((mod) => ({ default: mod.NodeDetailModal })),
);

type Camera = { x: number; y: number; zoom: number };
type Point = { x: number; y: number };
type Gesture = {
  kind: 'pan' | 'node' | 'pinch';
  start: Point;
  camera: Camera;
  node?: PositionedNode;
  moved: boolean;
  distance?: number;
  anchor?: Point;
};
const clampZoom = (zoom: number) => Math.min(1.8, Math.max(0.22, zoom));

export default function CareerCanvas({ careerData }: { careerData: CareerOdysseyData }) {
  const [nodes, setNodes] = useState(() => calculateLayout(careerData.nodes));
  const nodesRef = useRef(nodes);
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const cameraRef = useRef(camera);
  const viewportRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const framingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [framing, setFraming] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [panning, setPanning] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<'canvas' | 'list'>('canvas');
  const [ready, setReady] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const nodeMap = useMemo(() => new Map(nodes.map(node => [node.id, node])), [nodes]);
  const connections = useMemo(() => buildConnections(careerData.nodes, careerData.connections), [careerData]);
  const activeId = selectedId || hoveredId || focusedId;
  const relatedIds = useMemo(() => {
    const ids = new Set<string>();
    if (activeId) for (const connection of connections) {
      if (connection.sourceId === activeId) ids.add(connection.targetId);
      if (connection.targetId === activeId) ids.add(connection.sourceId);
    }
    return ids;
  }, [activeId, connections]);
  const selectedNode = selectedId ? nodeMap.get(selectedId) : undefined;

  const updateCamera = useCallback((next: Camera, animate = false) => {
    clearTimeout(framingTimer.current);
    setFraming(animate);
    if (animate) framingTimer.current = setTimeout(() => setFraming(false), 650);
    cameraRef.current = next;
    setCamera(next);
  }, []);

  const frameNode = useCallback((node: PositionedNode, animate = true) => {
    const { width, height } = sizeRef.current;
    if (!width || !height) return;
    const zoom = clampZoom(Math.min(1, (width - 64) / node.width, (height - 80) / node.height));
    updateCamera({ zoom, x: width / 2 - node.x * zoom, y: height / 2 - node.y * zoom }, animate);
  }, [updateCamera]);

  const fitAll = useCallback(() => {
    const bounds = getCanvasBounds(nodesRef.current);
    const { width, height } = sizeRef.current;
    const zoom = clampZoom(Math.min(1, (width - 48) / (bounds.maxX - bounds.minX), (height - 48) / (bounds.maxY - bounds.minY)));
    updateCamera({ zoom, x: width / 2 - (bounds.minX + bounds.maxX) / 2 * zoom, y: height / 2 - (bounds.minY + bounds.maxY) / 2 * zoom }, true);
    setAnnouncement('All moments are in view.');
  }, [updateCamera]);

  const zoomAt = useCallback((factor: number, point?: Point) => {
    const previous = cameraRef.current;
    const center = point || { x: sizeRef.current.width / 2, y: sizeRef.current.height / 2 };
    const zoom = clampZoom(previous.zoom * factor);
    updateCamera({ zoom, x: center.x - (center.x - previous.x) * zoom / previous.zoom, y: center.y - (center.y - previous.y) * zoom / previous.zoom }, !point);
  }, [updateCamera]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(() => {
      const width = viewport.clientWidth, height = viewport.clientHeight;
      if (!width || !height) return;
      const previous = sizeRef.current;
      sizeRef.current = { width, height };
      if (!previous.width) {
        const start = nodesRef.current.find(node => node.id === careerData.startingNodeId) || nodesRef.current.find(node => node.featured) || nodesRef.current[0];
        if (start) frameNode(start, false);
        setReady(true);
      } else {
        const current = cameraRef.current;
        updateCamera({ ...current, x: current.x + (width - previous.width) / 2, y: current.y + (height - previous.height) / 2 });
      }
    });
    observer.observe(viewport);
    return () => { observer.disconnect(); clearTimeout(framingTimer.current); };
  }, [careerData.startingNodeId, frameNode, updateCamera]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1;
      if (event.ctrlKey || event.metaKey) {
        const bounds = viewport.getBoundingClientRect();
        zoomAt(Math.exp(-event.deltaY * unit * 0.008), { x: event.clientX - bounds.left, y: event.clientY - bounds.top });
      } else {
        const current = cameraRef.current;
        updateCamera({ ...current, x: current.x - (event.shiftKey ? event.deltaY : event.deltaX) * unit, y: current.y - (event.shiftKey ? 0 : event.deltaY) * unit });
      }
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [updateCamera, zoomAt]);

  const openMoment = useCallback((id: string) => {
    const button = viewportRef.current?.querySelector<HTMLButtonElement>(`[data-node-id="${id}"]`);
    button?.focus({ preventScroll: true });
    setSelectedId(id);
  }, []);

  const focusMoment = useCallback((id: string | null, reveal = false) => {
    setFocusedId(id);
    if (!id || !reveal) return;
    const node = nodesRef.current.find(moment => moment.id === id);
    if (!node) return;
    const current = cameraRef.current;
    const x = node.x * current.zoom + current.x, y = node.y * current.zoom + current.y;
    const { width, height } = sizeRef.current;
    if (x - node.width * current.zoom / 2 < 8 || x + node.width * current.zoom / 2 > width - 8 || y - node.height * current.zoom / 2 < 8 || y + node.height * current.zoom / 2 > height - 8) frameNode(node);
  }, [frameNode]);

  const localPoint = (event: ReactPointerEvent): Point => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };

  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.button !== 1) return;
    event.preventDefault();
    const point = localPoint(event);
    pointers.current.set(event.pointerId, point);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (pointers.current.size >= 2) {
      const [a, b] = Array.from(pointers.current.values());
      const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const current = cameraRef.current;
      gesture.current = { kind: 'pinch', start: center, camera: current, distance: Math.hypot(a.x - b.x, a.y - b.y), anchor: { x: (center.x - current.x) / current.zoom, y: (center.y - current.y) / current.zoom }, moved: true };
      setDraggingId(null);
      return;
    }
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-node-id]');
    const node = event.button === 0 ? nodesRef.current.find(moment => moment.id === button?.dataset.nodeId) : undefined;
    (button || event.currentTarget).focus({ preventScroll: true });
    gesture.current = { kind: node ? 'node' : 'pan', start: point, camera: cameraRef.current, node, moved: false };
    setFraming(false);
    setPanning(!node);
  };

  const pointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    const point = localPoint(event);
    pointers.current.set(event.pointerId, point);
    const current = gesture.current;
    if (!current) return;
    if (current.kind === 'pinch' && pointers.current.size >= 2 && current.anchor) {
      const [a, b] = Array.from(pointers.current.values());
      const zoom = clampZoom(current.camera.zoom * Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, current.distance || 1));
      updateCamera({ zoom, x: (a.x + b.x) / 2 - current.anchor.x * zoom, y: (a.y + b.y) / 2 - current.anchor.y * zoom });
      return;
    }
    const dx = point.x - current.start.x, dy = point.y - current.start.y;
    if (!current.moved && Math.hypot(dx, dy) < 5) return;
    current.moved = true;
    if (current.kind === 'node' && current.node) {
      const dragged = current.node;
      setDraggingId(dragged.id);
      const next = nodesRef.current.map(node => node.id === dragged.id ? { ...node, x: dragged.x + dx / current.camera.zoom, y: dragged.y + dy / current.camera.zoom } : node);
      nodesRef.current = next;
      setNodes(next);
    } else if (current.kind === 'pan') {
      updateCamera({ ...current.camera, x: current.camera.x + dx, y: current.camera.y + dy });
    }
  };

  const finishPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const current = gesture.current;
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (event.type === 'pointerup' && current?.kind === 'node' && !current.moved && current.node) openMoment(current.node.id);
    if (pointers.current.size === 1 && current?.kind === 'pinch') {
      gesture.current = { kind: 'pan', start: Array.from(pointers.current.values())[0], camera: cameraRef.current, moved: true };
    } else {
      gesture.current = null;
      setDraggingId(null);
      setPanning(false);
    }
  };

  const handleKeys = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (selectedId || event.altKey || event.metaKey || event.ctrlKey) return;
    const shifts: Record<string, Point> = { ArrowLeft: { x: 64, y: 0 }, ArrowRight: { x: -64, y: 0 }, ArrowUp: { x: 0, y: 64 }, ArrowDown: { x: 0, y: -64 } };
    const shift = shifts[event.key];
    if (shift) {
      event.preventDefault();
      updateCamera({ ...cameraRef.current, x: cameraRef.current.x + shift.x, y: cameraRef.current.y + shift.y });
    } else if (['+', '=', '-', '_', 'Home'].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'Home') fitAll();
      else zoomAt(event.key === '+' || event.key === '=' ? 1.2 : 1 / 1.2);
    }
  };

  const resetBoard = () => {
    const original = calculateLayout(careerData.nodes);
    nodesRef.current = original;
    setNodes(original);
    const start = original.find(node => node.id === careerData.startingNodeId) || original[0];
    if (start) frameNode(start);
    setAnnouncement('Original arrangement restored.');
  };

  return <section className="career-odyssey-wrapper" aria-labelledby="co-title">
    <header className="co-header">
      <div><p className="co-eyebrow">David Hoang / A work in progress</p><h1 id="co-title">Career Odyssey<span aria-hidden="true">.</span></h1><p className="co-intro">Moments, people, and ideas that connect along the way.</p></div>
      <div className="co-view-switch" role="group" aria-label="View moments"><button type="button" aria-pressed={view === 'canvas'} onClick={() => setView('canvas')}>Canvas</button><button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>List</button></div>
    </header>
    <div className="co-workspace" hidden={view !== 'canvas'}>
      <div ref={viewportRef} className={`co-viewport${panning ? ' co-viewport--panning' : ''}`} tabIndex={0} role="region" aria-label="Moments canvas" aria-describedby="co-instructions" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={finishPointer} onPointerCancel={finishPointer} onKeyDown={handleKeys}>
        <div className={`co-canvas${framing ? ' co-canvas--framing' : ''}`} style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`, visibility: ready ? 'visible' : 'hidden' }}>
          <svg className="co-connections" width="1" height="1" aria-hidden="true">
            {connections.map(connection => <ConnectionLine key={`${connection.sourceId}-${connection.targetId}`} connection={connection} nodes={nodeMap} isHighlighted={connection.sourceId === activeId || connection.targetId === activeId} />)}
          </svg>
          {nodes.map(node => <CareerNode key={node.id} node={node} isHighlighted={activeId === node.id} isConnected={relatedIds.has(node.id)} isDragging={draggingId === node.id} onHover={setHoveredId} onOpen={openMoment} onFocus={focusMoment} />)}
        </div>
      </div>
      <footer className="co-toolbar">
        <p className="co-hint" id="co-instructions">Drag to explore · Select a moment<span className="co-sr-only">. Drag a moment to rearrange it. Pinch or Control-scroll to zoom. Use Tab to reach moments, Enter to open, arrow keys to pan, plus and minus to zoom, and Home to fit all moments.</span></p>
        <div className="co-tools" role="group" aria-label="Canvas controls">
          <button type="button" onClick={() => zoomAt(1 / 1.2)} aria-label="Zoom out" disabled={camera.zoom <= 0.22}>−</button>
          <output aria-label="Canvas zoom">{Math.round(camera.zoom * 100)}%</output>
          <button type="button" onClick={() => zoomAt(1.2)} aria-label="Zoom in" disabled={camera.zoom >= 1.8}>+</button>
          <span className="co-tools__separator" aria-hidden="true" />
          <button type="button" className="co-tools__text" onClick={fitAll}>Fit all</button>
          <button type="button" className="co-tools__text" onClick={resetBoard}>Reset</button>
        </div>
        <span className="co-count">{nodes.length} moments · Many connections</span>
      </footer>
    </div>
    {view === 'list' && <div className="co-list" aria-label="All moments">
      {nodes.map(node => <article key={node.id} className="co-list__item">
        <span className="co-list__date">{node.dateRange || node.date || node.kicker}</span>
        <div>{node.image && <img src={node.image} alt={node.imageAlt || node.label} width="1600" height="900" loading="lazy" />}<h2><button type="button" onClick={() => setSelectedId(node.id)}>{node.label} <span aria-hidden="true">↗</span></button></h2><p>{node.description}</p></div>
      </article>)}
    </div>}
    <span className="co-sr-only" role="status">{announcement}</span>
    {selectedNode && <Suspense fallback={<span className="co-loading-detail" role="status">Opening moment…</span>}><NodeDetailModal node={selectedNode} allNodes={nodeMap} connections={connections} onClose={() => setSelectedId(null)} onNavigate={(node) => { setSelectedId(node.id); frameNode(node); }} /></Suspense>}
  </section>;
}
