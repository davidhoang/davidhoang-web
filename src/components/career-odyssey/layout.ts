/**
 * Organic node-graph layout.
 *
 * A lightweight force simulation (no D3) that uses the timeline as a
 * loose horizontal guide but lets connections pull related nodes together,
 * producing a non-linear, exploratory graph.
 */

import type { CareerNode, PositionedNode, Connection } from './types';
import { NODE_DIMENSIONS } from './types';

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

// ─── Connections ──────────────────────────────────────────────────────────────

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

const X_PER_YEAR = 100;    // tight horizontal spacing
const X_PAD = 300;        // center the cluster
const Y_CENTER = 360;
const ITERATIONS = 150;

// ─── Force simulation ─────────────────────────────────────────────────────────

interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  width: number;
  height: number;
  data: CareerNode;
}

export function calculateLayout(nodes: CareerNode[]): PositionedNode[] {
  if (nodes.length === 0) return [];

  const years = nodes.map(n => getYear(n.date));
  const minYear = Math.min(...years);

  // Build adjacency for connection forces
  const adjacency = new Map<string, string[]>();
  for (const node of nodes) {
    if (!node.connections) continue;
    for (const sourceId of node.connections) {
      if (!adjacency.has(node.id)) adjacency.set(node.id, []);
      adjacency.get(node.id)!.push(sourceId);
      if (!adjacency.has(sourceId)) adjacency.set(sourceId, []);
      adjacency.get(sourceId)!.push(node.id);
    }
  }

  // Initialize simulation nodes
  const simNodes: SimNode[] = nodes.map((node, i) => {
    const dim = NODE_DIMENSIONS[node.type] || NODE_DIMENSIONS.moment;
    const year = getYear(node.date);
    const targetX = (year - minYear) * X_PER_YEAR + X_PAD;

    // Tight initial spread — keep nodes close from the start
    const yOffset = ((i * 137.5) % 160) - 80;

    return {
      id: node.id,
      x: targetX + (Math.sin(i * 2.3) * 20),
      y: Y_CENTER + yOffset,
      vx: 0,
      vy: 0,
      targetX,
      width: dim.width,
      height: dim.height,
      data: node,
    };
  });

  const nodeIndex = new Map<string, number>();
  simNodes.forEach((n, i) => nodeIndex.set(n.id, i));

  // Run simulation
  for (let iter = 0; iter < ITERATIONS; iter++) {
    const alpha = 1 - iter / ITERATIONS; // cooling
    const strength = alpha * 0.3;

    // 1. X gravity — pull toward year-based position (loose)
    for (const n of simNodes) {
      n.vx += (n.targetX - n.x) * 0.03 * alpha;
    }

    // 2. Y gravity — pull toward center (stronger to keep cluster tight)
    for (const n of simNodes) {
      n.vy += (Y_CENTER - n.y) * 0.04 * alpha;
    }

    // 3. Connection attraction — pull connected nodes close together
    for (const [id, neighbors] of adjacency) {
      const i = nodeIndex.get(id);
      if (i === undefined) continue;
      const a = simNodes[i];
      for (const nid of neighbors) {
        const j = nodeIndex.get(nid);
        if (j === undefined) continue;
        const b = simNodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = 140; // tight cluster
        if (dist > targetDist) {
          const force = (dist - targetDist) * 0.006 * alpha;
          a.vx += (dx / dist) * force;
          a.vy += (dy / dist) * force;
          b.vx -= (dx / dist) * force;
          b.vy -= (dy / dist) * force;
        }
      }
    }

    // 4. Repulsion — push overlapping/close nodes apart
    for (let i = 0; i < simNodes.length; i++) {
      for (let j = i + 1; j < simNodes.length; j++) {
        const a = simNodes[i];
        const b = simNodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // Collision avoidance — only push apart when overlapping
        const minDist = (Math.max(a.width, a.height) + Math.max(b.width, b.height)) / 2 + 16;

        if (dist < minDist) {
          const force = ((minDist - dist) / dist) * strength;
          a.vx -= dx * force;
          a.vy -= dy * force;
          b.vx += dx * force;
          b.vy += dy * force;
        }

        // Gentle short-range repulsion (keeps nodes from stacking exactly)
        if (dist < 200) {
          const repulse = (10 / (dist * dist)) * alpha;
          a.vx -= dx * repulse;
          a.vy -= dy * repulse;
          b.vx += dx * repulse;
          b.vy += dy * repulse;
        }
      }
    }

    // Apply velocities with damping
    for (const n of simNodes) {
      n.x += n.vx;
      n.y += n.vy;
      n.vx *= 0.6;
      n.vy *= 0.6;
    }
  }

  // Re-center the whole graph so the active node sits at the origin
  const activeNode = simNodes.find(n => n.data.active) || simNodes[simNodes.length - 1];
  const centerX = 600; // target center X in canvas space
  const centerY = 400; // target center Y
  const offsetX = centerX - activeNode.x;
  const offsetY = centerY - activeNode.y;

  return simNodes.map(sn => ({
    ...sn.data,
    x: Math.round(sn.x + offsetX),
    y: Math.round(sn.y + offsetY),
    width: sn.width,
    height: sn.height,
    timestamp: parseDate(sn.data.date),
  }));
}

// ─── Canvas bounds ────────────────────────────────────────────────────────────

export function getCanvasBounds(nodes: PositionedNode[]) {
  if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 2000, maxY: 720 };
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

// ─── Year range ───────────────────────────────────────────────────────────────

export function getYearRange(nodes: CareerNode[]): { min: number; max: number } {
  const years = nodes.filter(n => n.date).map(n => getYear(n.date));
  return { min: Math.min(...years), max: Math.max(...years) };
}
