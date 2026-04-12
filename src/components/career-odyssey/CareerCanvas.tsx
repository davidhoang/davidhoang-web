import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { CareerOdysseyData, PositionedNode, Connection } from './types';
import { calculateLayout, buildConnections, getCanvasBounds, getYearRange, getYear } from './layout';
import { CareerNode } from './CareerNode';
import { ConnectionLine } from './ConnectionLine';
import { NodeDetailModal } from './NodeDetailModal';

interface Props {
  careerData: CareerOdysseyData;
}

const CareerCanvas: React.FC<Props> = ({ careerData }) => {
  // ── Layout ─────────────────────────────────────────────────────────────────
  const [nodePositions, setNodePositions] = useState<PositionedNode[]>([]);
  const baseNodes = useMemo(() => calculateLayout(careerData.nodes), [careerData]);

  // Initialize positions from layout
  useEffect(() => {
    setNodePositions(baseNodes);
  }, [baseNodes]);

  const nodeMap = useMemo(() => {
    const m = new Map<string, PositionedNode>();
    for (const n of nodePositions) m.set(n.id, n);
    return m;
  }, [nodePositions]);

  const connections = useMemo(() => buildConnections(careerData.nodes), [careerData]);
  const bounds = useMemo(() => getCanvasBounds(nodePositions), [nodePositions]);
  const yearRange = useMemo(() => getYearRange(careerData.nodes), [careerData]);

  // Year markers for the timeline ruler
  const yearMarkers = useMemo(() => {
    const markers: { year: number; x: number }[] = [];
    if (nodePositions.length === 0) return markers;

    // Group nodes by year to find average X position per year
    const yearXs = new Map<number, number[]>();
    for (const n of nodePositions) {
      const year = getYear(n.date);
      if (!yearXs.has(year)) yearXs.set(year, []);
      yearXs.get(year)!.push(n.x);
    }
    for (const [year, xs] of yearXs) {
      markers.push({ year, x: xs.reduce((a, b) => a + b, 0) / xs.length });
    }
    markers.sort((a, b) => a.year - b.year);
    return markers;
  }, [nodePositions]);

  // ── Interaction state ──────────────────────────────────────────────────────
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<PositionedNode | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ nodeId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const panRef = useRef<{ startX: number; startY: number; scrollLeft: number; scrollTop: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  // ── Canvas panning (drag on empty space) ───────────────────────────────────
  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    // Only pan if clicking on empty canvas, not on a node
    if ((e.target as HTMLElement).closest('.co-node')) return;
    const el = containerRef.current;
    if (!el) return;
    e.preventDefault();
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    };
    setIsPanning(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    if (!panRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const dx = e.clientX - panRef.current.startX;
    const dy = e.clientY - panRef.current.startY;
    el.scrollLeft = panRef.current.scrollLeft - dx;
    el.scrollTop = panRef.current.scrollTop - dy;
  }, []);

  const handleCanvasPointerUp = useCallback(() => {
    panRef.current = null;
    setIsPanning(false);
  }, []);

  // ── Resize ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      if (containerRef.current) setIsMobile(containerRef.current.clientWidth < 640);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Center viewport on active node on mount
  useEffect(() => {
    const el = containerRef.current;
    if (!el || nodePositions.length === 0) return;
    const activeNode = nodePositions.find(n => n.active) || nodePositions[nodePositions.length - 1];
    if (activeNode) {
      const nodeCanvasX = activeNode.x - bounds.minX;
      const nodeCanvasY = activeNode.y - bounds.minY;
      el.scrollLeft = nodeCanvasX - el.clientWidth / 2;
      el.scrollTop = nodeCanvasY - el.clientHeight / 2;
    }
  }, [nodePositions.length > 0]); // only on first render

  // ── Node dragging ──────────────────────────────────────────────────────────
  const handleDragStart = useCallback((e: React.PointerEvent, node: PositionedNode) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: node.x,
      origY: node.y,
    };
    setDraggingId(node.id);
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const newX = dragRef.current.origX + dx;
      const newY = dragRef.current.origY + dy;

      setNodePositions(prev =>
        prev.map(n => n.id === dragRef.current!.nodeId ? { ...n, x: newX, y: newY } : n)
      );
    };

    const onUp = (e: PointerEvent) => {
      if (!dragRef.current) return;
      const dx = Math.abs(e.clientX - dragRef.current.startX);
      const dy = Math.abs(e.clientY - dragRef.current.startY);

      // If barely moved, treat as click
      if (dx < 4 && dy < 4) {
        const node = nodePositions.find(n => n.id === dragRef.current!.nodeId);
        if (node) setSelectedNode(node);
      }

      dragRef.current = null;
      setDraggingId(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [nodePositions]);

  // ── Highlight connected nodes ──────────────────────────────────────────────
  const connectedIds = useMemo(() => {
    if (!hoveredId) return new Set<string>();
    const ids = new Set<string>();
    ids.add(hoveredId);
    const hovered = nodeMap.get(hoveredId);
    if (hovered?.connections) {
      for (const c of hovered.connections) ids.add(c);
    }
    for (const n of nodePositions) {
      if (n.connections?.includes(hoveredId)) ids.add(n.id);
    }
    return ids;
  }, [hoveredId, nodeMap, nodePositions]);

  const isConnectionHighlighted = useCallback(
    (conn: Connection) => {
      if (!hoveredId) return false;
      return connectedIds.has(conn.sourceId) && connectedIds.has(conn.targetId);
    },
    [hoveredId, connectedIds],
  );

  // ── Navigate to node ───────────────────────────────────────────────────────
  const navigateToNode = useCallback(
    (node: PositionedNode) => {
      setSelectedNode(node);
      const el = containerRef.current;
      if (!el) return;
      const scrollX = node.x - el.clientWidth / 2 - bounds.minX;
      el.scrollTo({ left: Math.max(0, scrollX), behavior: 'smooth' });
    },
    [bounds.minX],
  );

  // ── Canvas dimensions ──────────────────────────────────────────────────────
  const canvasWidth = bounds.maxX - bounds.minX;
  const canvasHeight = bounds.maxY - bounds.minY;

  return (
    <div className="career-odyssey-wrapper">
      <div
        ref={containerRef}
        className={`career-odyssey-container${isPanning ? ' is-panning' : ''}`}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
      >
        <div
          className="co-canvas"
          style={{
            width: canvasWidth,
            minHeight: canvasHeight,
            position: 'relative',
          }}
        >
          {/* Year markers (floating, subtle) */}
          {yearMarkers.map(({ year, x }) => (
            <div
              key={year}
              className="co-year-marker"
              style={{
                left: x - bounds.minX,
                top: 20,
              }}
            >
              {year}
            </div>
          ))}

          {/* SVG connections */}
          <svg
            className="co-connections"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: canvasWidth,
              height: canvasHeight,
              overflow: 'visible',
              pointerEvents: 'none',
            }}
            viewBox={`${bounds.minX} ${bounds.minY} ${canvasWidth} ${canvasHeight}`}
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

          {/* Nodes */}
          {nodePositions.map((node) => (
            <CareerNode
              key={node.id}
              node={{
                ...node,
                x: node.x - bounds.minX,
                y: node.y - bounds.minY,
              }}
              isHovered={hoveredId === node.id}
              isConnected={hoveredId !== null && connectedIds.has(node.id)}
              isDragging={draggingId === node.id}
              onHover={setHoveredId}
              onClick={setSelectedNode}
              onDragStart={handleDragStart}
            />
          ))}
        </div>
      </div>

      {/* Timeline pill */}
      <div className="timeline">
        <div className="timeline-content">
          <span className="timeline-year">{yearRange.min}</span>
          <span className="timeline-separator">—</span>
          <span className="timeline-year">{yearRange.max}</span>
        </div>
      </div>

      {/* Detail panel */}
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
