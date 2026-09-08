import type { CareerNode, PositionedNode, Connection } from './types';
import { NODE_DIMENSIONS } from './types';

const BOARD_CENTER = { x: 700, y: 400 };
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const CANVAS_PADDING = 80;

const parseDate = (dateStr?: string): number => {
  if (!dateStr || !/^\d{4}(?:-\d{2})?(?:-\d{2})?$/.test(dateStr)) return 0;
  const [year, month = 6, day = 15] = dateStr.split('-').map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

export const getYear = (dateStr?: string): number => {
  if (!dateStr) return new Date().getFullYear();
  return parseInt(dateStr.split('-')[0], 10);
};

/**
 * Explicit board connections take precedence over legacy predecessor lists.
 * The board represents relationships, so a reversed edge is the same cable.
 */
export function buildConnections(
  nodes: CareerNode[],
  explicitConnections?: Connection[],
): Connection[] {
  const nodeIds = new Set(nodes.map(node => node.id));
  const candidates = explicitConnections ?? nodes.flatMap(node =>
    (node.connections ?? []).map(sourceId => ({
      sourceId,
      targetId: node.id,
      pathTaken: node.pathTaken !== false,
    })),
  );
  const seen = new Set<string>();

  return candidates.filter(connection => {
    const { sourceId, targetId } = connection;
    if (sourceId === targetId || !nodeIds.has(sourceId) || !nodeIds.has(targetId)) {
      return false;
    }
    const key = JSON.stringify([sourceId, targetId].sort());
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(connection => ({ ...connection }));
}

/**
 * Keep authored centers untouched. Unplaced moments follow a deterministic
 * radial arrangement; dates are metadata and never influence position.
 */
export function calculateLayout(nodes: CareerNode[]): PositionedNode[] {
  return nodes.map((node, index) => {
    const dimensions = NODE_DIMENSIONS[node.presentation ?? node.type] ?? NODE_DIMENSIONS.moment;
    const angle = index * GOLDEN_ANGLE - Math.PI / 2;
    const radius = 360 * Math.sqrt(index + 1);

    return {
      ...node,
      x: Number.isFinite(node.x) ? node.x! : Math.round(BOARD_CENTER.x + Math.cos(angle) * radius),
      y: Number.isFinite(node.y) ? node.y! : Math.round(BOARD_CENTER.y + Math.sin(angle) * radius),
      width: Number.isFinite(node.width) && node.width! > 0 ? node.width! : dimensions.width,
      height: Number.isFinite(node.height) && node.height! > 0 ? node.height! : dimensions.height,
      timestamp: parseDate(node.date),
    };
  });
}

export function getCanvasBounds(nodes: PositionedNode[]) {
  if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 1400, maxY: 800 };

  return {
    minX: Math.min(...nodes.map(node => node.x - node.width / 2)) - CANVAS_PADDING,
    minY: Math.min(...nodes.map(node => node.y - node.height / 2)) - CANVAS_PADDING,
    maxX: Math.max(...nodes.map(node => node.x + node.width / 2)) + CANVAS_PADDING,
    maxY: Math.max(...nodes.map(node => node.y + node.height / 2)) + CANVAS_PADDING,
  };
}

export function getYearRange(nodes: CareerNode[]): { min: number; max: number } {
  const years = nodes.filter(node => node.date).map(node => getYear(node.date)).filter(Number.isFinite);
  if (years.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...years), max: Math.max(...years) };
}
