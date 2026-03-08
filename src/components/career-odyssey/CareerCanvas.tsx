import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { CareerOdysseyData, PositionedNode, Connection } from './types';
import { calculateLayout, buildConnections, getCanvasBounds, getYearRange } from './layout';
import { CareerNode } from './CareerNode';
import { ConnectionLine } from './ConnectionLine';
import { NodeDetailModal } from './NodeDetailModal';

// ─── Pan / Zoom state ─────────────────────────────────────────────────────────

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.2;
const MAX_SCALE = 2.5;
const ZOOM_STEP = 0.15;

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  careerData: CareerOdysseyData;
}

const CareerCanvas: React.FC<Props> = ({ careerData }) => {
  // ── Layout (computed once) ──────────────────────────────────────────────────

  const nodes = useMemo(() => calculateLayout(careerData.nodes), [careerData]);
  const nodeMap = useMemo(() => {
    const m = new Map<string, PositionedNode>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);
  const connections = useMemo(() => buildConnections(careerData.nodes), [careerData]);
  const bounds = useMemo(() => getCanvasBounds(nodes), [nodes]);
  const yearRange = useMemo(() => getYearRange(careerData.nodes), [careerData]);

  // ── Interaction state ───────────────────────────────────────────────────────

  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<PositionedNode | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  // ── Fit to viewport on mount ────────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    setIsMobile(vw < 640);

    const canvasW = bounds.maxX - bounds.minX;
    const canvasH = bounds.maxY - bounds.minY;
    const scale = Math.min(vw / canvasW, vh / canvasH, 1) * 0.9;
    const x = (vw - canvasW * scale) / 2 - bounds.minX * scale;
    const y = (vh - canvasH * scale) / 2 - bounds.minY * scale;
    setTransform({ x, y, scale });
  }, [bounds]);

  // ── Resize listener ─────────────────────────────────────────────────────────

  useEffect(() => {
    const onResize = () => {
      if (containerRef.current) {
        setIsMobile(containerRef.current.clientWidth < 640);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Pan handlers ────────────────────────────────────────────────────────────

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Ignore if clicking inside a node (it handles its own clicks)
      if ((e.target as HTMLElement).closest('.co-node')) return;
      e.preventDefault();
      dragStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y };
      setIsDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [transform.x, transform.y],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStart.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setTransform((t) => ({ ...t, x: dragStart.current!.tx + dx, y: dragStart.current!.ty + dy }));
    },
    [],
  );

  const onPointerUp = useCallback(() => {
    dragStart.current = null;
    setIsDragging(false);
  }, []);

  // ── Zoom (wheel) ────────────────────────────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const direction = e.deltaY < 0 ? 1 : -1;

      setTransform((t) => {
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, t.scale * (1 + direction * ZOOM_STEP)));
        const ratio = newScale / t.scale;
        return {
          scale: newScale,
          x: mx - (mx - t.x) * ratio,
          y: my - (my - t.y) * ratio,
        };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // ── Zoom buttons ────────────────────────────────────────────────────────────

  const zoomIn = useCallback(() => {
    setTransform((t) => {
      const newScale = Math.min(MAX_SCALE, t.scale * (1 + ZOOM_STEP));
      const el = containerRef.current;
      if (!el) return { ...t, scale: newScale };
      const cx = el.clientWidth / 2;
      const cy = el.clientHeight / 2;
      const ratio = newScale / t.scale;
      return { scale: newScale, x: cx - (cx - t.x) * ratio, y: cy - (cy - t.y) * ratio };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((t) => {
      const newScale = Math.max(MIN_SCALE, t.scale * (1 - ZOOM_STEP));
      const el = containerRef.current;
      if (!el) return { ...t, scale: newScale };
      const cx = el.clientWidth / 2;
      const cy = el.clientHeight / 2;
      const ratio = newScale / t.scale;
      return { scale: newScale, x: cx - (cx - t.x) * ratio, y: cy - (cy - t.y) * ratio };
    });
  }, []);

  const fitToView = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    const canvasW = bounds.maxX - bounds.minX;
    const canvasH = bounds.maxY - bounds.minY;
    const scale = Math.min(vw / canvasW, vh / canvasH, 1) * 0.9;
    const x = (vw - canvasW * scale) / 2 - bounds.minX * scale;
    const y = (vh - canvasH * scale) / 2 - bounds.minY * scale;
    setTransform({ x, y, scale });
  }, [bounds]);

  // ── Highlight connected nodes ───────────────────────────────────────────────

  const connectedIds = useMemo(() => {
    if (!hoveredId) return new Set<string>();
    const ids = new Set<string>();
    ids.add(hoveredId);
    const hovered = nodeMap.get(hoveredId);
    if (hovered?.connections) {
      for (const c of hovered.connections) ids.add(c);
    }
    // Also add nodes that connect TO hovered
    for (const n of nodes) {
      if (n.connections?.includes(hoveredId)) ids.add(n.id);
    }
    return ids;
  }, [hoveredId, nodeMap, nodes]);

  const isConnectionHighlighted = useCallback(
    (conn: Connection) => {
      if (!hoveredId) return false;
      return connectedIds.has(conn.sourceId) && connectedIds.has(conn.targetId);
    },
    [hoveredId, connectedIds],
  );

  // ── Navigate to node (from modal) ──────────────────────────────────────────

  const navigateToNode = useCallback(
    (node: PositionedNode) => {
      setSelectedNode(node);
      const el = containerRef.current;
      if (!el) return;
      const vw = el.clientWidth;
      const vh = el.clientHeight;
      setTransform((t) => ({
        ...t,
        x: vw / 2 - node.x * t.scale,
        y: vh / 2 - node.y * t.scale,
      }));
    },
    [],
  );

  // ── Canvas content dimensions (for SVG) ─────────────────────────────────────

  const svgWidth = bounds.maxX - bounds.minX;
  const svgHeight = bounds.maxY - bounds.minY;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="career-odyssey-wrapper">
      <div
        ref={containerRef}
        className={`career-odyssey-container${isDragging ? ' is-dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Transformed layer: all nodes & connections */}
        <div
          className="co-canvas"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            position: 'absolute',
            top: 0,
            left: 0,
            willChange: 'transform',
          }}
        >
          {/* SVG layer for connections (behind nodes) */}
          <svg
            className="co-connections"
            style={{
              position: 'absolute',
              left: bounds.minX,
              top: bounds.minY,
              width: svgWidth,
              height: svgHeight,
              overflow: 'visible',
              pointerEvents: 'none',
            }}
            viewBox={`${bounds.minX} ${bounds.minY} ${svgWidth} ${svgHeight}`}
          >
            {connections.map((conn) => (
              <ConnectionLine
                key={`${conn.sourceId}-${conn.targetId}`}
                connection={conn}
                nodes={nodeMap}
                isHighlighted={isConnectionHighlighted(conn)}
              />
            ))}
          </svg>

          {/* DOM nodes */}
          {nodes.map((node) => (
            <CareerNode
              key={node.id}
              node={node}
              isHovered={hoveredId === node.id}
              isConnected={hoveredId !== null && connectedIds.has(node.id)}
              onHover={setHoveredId}
              onClick={setSelectedNode}
            />
          ))}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="zoom-controls">
        <button className="zoom-control-btn" onClick={zoomIn} aria-label="Zoom in" title="Zoom in">
          +
        </button>
        <button className="zoom-control-btn" onClick={zoomOut} aria-label="Zoom out" title="Zoom out">
          −
        </button>
        <button className="zoom-control-btn" onClick={fitToView} aria-label="Fit to view" title="Fit to view">
          ⌂
        </button>
      </div>

      {/* Timeline pill */}
      <div className="timeline">
        <div className="timeline-content">
          <span className="timeline-year">{yearRange.min}</span>
          <span className="timeline-separator">—</span>
          <span className="timeline-year">{yearRange.max}</span>
        </div>
      </div>

      {/* Detail modal */}
      <NodeDetailModal
        node={selectedNode}
        allNodes={nodeMap}
        onClose={() => setSelectedNode(null)}
        onNavigate={navigateToNode}
        isMobile={isMobile}
      />
    </div>
  );
};

export default CareerCanvas;
