import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import type { CareerNode, PositionedNode, Connection, NODE_DIMENSIONS } from './types';
import { NODE_DIMENSIONS as DIMS } from './types';

// ─── Date utilities ───────────────────────────────────────────────────────────

const parseDate = (dateStr?: string): number => {
  if (!dateStr) return Date.now();
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parts[1] ? parseInt(parts[1], 10) - 1 : 5;
  const day = parts[2] ? parseInt(parts[2], 10) : 15;
  return new Date(year, month, day).getTime();
};

export const getYear = (dateStr?: string): number => {
  if (!dateStr) return new Date().getFullYear();
  return parseInt(dateStr.split('-')[0], 10);
};

// ─── Build connection list ────────────────────────────────────────────────────

export function buildConnections(nodes: CareerNode[]): Connection[] {
  const connections: Connection[] = [];
  for (const node of nodes) {
    if (!node.connections) continue;
    for (const sourceId of node.connections) {
      connections.push({
        sourceId,
        targetId: node.id,
        pathTaken: node.pathTaken !== false,
      });
    }
  }
  return connections;
}

// ─── Layout constants ─────────────────────────────────────────────────────────

const MAIN_PATH_Y = 300;
const X_SCALE = 120;           // px per year
const SIMULATION_TICKS = 300;  // run simulation to completion synchronously

// ─── Force-directed layout ────────────────────────────────────────────────────

interface SimNode extends SimulationNodeDatum {
  id: string;
  nodeData: CareerNode;
  width: number;
  height: number;
  timestamp: number;
  pinned: boolean;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  pathTaken: boolean;
}

export function calculateLayout(nodes: CareerNode[]): PositionedNode[] {
  if (nodes.length === 0) return [];

  // Find the earliest year for X positioning
  const years = nodes.map(n => getYear(n.date));
  const minYear = Math.min(...years);

  // Create simulation nodes
  const simNodes: SimNode[] = nodes.map((node) => {
    const dims = DIMS[node.type] || DIMS.event;
    const year = getYear(node.date);
    const hasPinX = node.x !== undefined;
    const hasPinY = node.y !== undefined;
    const pinned = hasPinX && hasPinY;

    // Initial X: place by year on timeline; Y: main path center
    const initialX = hasPinX ? node.x! : (year - minYear) * X_SCALE + 100;
    const initialY = hasPinY
      ? node.y!
      : node.pathTaken === false
        ? MAIN_PATH_Y - 120 // branches above main path
        : MAIN_PATH_Y;

    return {
      id: node.id,
      nodeData: node,
      x: initialX,
      y: initialY,
      width: dims.width,
      height: dims.height,
      timestamp: parseDate(node.date),
      pinned,
      // d3-force uses fx/fy to pin nodes
      ...(pinned ? { fx: node.x, fy: node.y } : {}),
    };
  });

  // Build a quick lookup
  const nodeIndex = new Map<string, number>();
  simNodes.forEach((n, i) => nodeIndex.set(n.id, i));

  // Create simulation links
  const simLinks: SimLink[] = [];
  for (const node of nodes) {
    if (!node.connections) continue;
    for (const sourceId of node.connections) {
      const si = nodeIndex.get(sourceId);
      const ti = nodeIndex.get(node.id);
      if (si !== undefined && ti !== undefined) {
        simLinks.push({
          source: si,
          target: ti,
          pathTaken: node.pathTaken !== false,
        });
      }
    }
  }

  // ─── Configure forces ───────────────────────────────────────────────────────

  const simulation = forceSimulation<SimNode>(simNodes)
    // Links pull connected nodes together
    .force(
      'link',
      forceLink<SimNode, SimLink>(simLinks)
        .id((_, i) => i!)
        .distance(160)
        .strength(0.4)
    )
    // Gentle repulsion so nodes don't pile up
    .force('charge', forceManyBody<SimNode>().strength(-200).distanceMax(500))
    // Rectangular collision: use the larger dimension as radius
    .force(
      'collide',
      forceCollide<SimNode>()
        .radius((d) => Math.max(d.width, d.height) / 2 + 20)
        .strength(0.8)
        .iterations(3)
    )
    // Pull nodes toward their date-based X position (timeline gravity)
    .force(
      'x',
      forceX<SimNode>()
        .x((d) => (getYear(d.nodeData.date) - minYear) * X_SCALE + 100)
        .strength((d) => (d.pinned ? 0 : 0.15))
    )
    // Pull main-path nodes toward center Y, branches slightly above
    .force(
      'y',
      forceY<SimNode>()
        .y((d) => (d.nodeData.pathTaken === false ? MAIN_PATH_Y - 100 : MAIN_PATH_Y))
        .strength((d) => (d.pinned ? 0 : 0.08))
    )
    .alphaDecay(0.02)
    .velocityDecay(0.4);

  // Run synchronously to completion
  simulation.tick(SIMULATION_TICKS);
  simulation.stop();

  // ─── Build output ─────────────────────────────────────────────────────────

  return simNodes.map((sn) => ({
    ...sn.nodeData,
    x: Math.round(sn.x!),
    y: Math.round(sn.y!),
    width: sn.width,
    height: sn.height,
    timestamp: sn.timestamp,
  }));
}

// ─── Compute canvas bounds from positioned nodes ──────────────────────────────

export function getCanvasBounds(nodes: PositionedNode[]) {
  if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 2000, maxY: 600 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x - n.width / 2);
    minY = Math.min(minY, n.y - n.height / 2);
    maxX = Math.max(maxX, n.x + n.width / 2);
    maxY = Math.max(maxY, n.y + n.height / 2);
  }
  const pad = 80;
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
}

// ─── Year range for timeline ──────────────────────────────────────────────────

export function getYearRange(nodes: CareerNode[]): { min: number; max: number } {
  const years = nodes
    .filter((n) => n.date)
    .map((n) => getYear(n.date));
  return { min: Math.min(...years), max: Math.max(...years) };
}
