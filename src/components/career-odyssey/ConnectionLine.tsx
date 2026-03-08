import React from 'react';
import type { PositionedNode, Connection } from './types';

interface ConnectionLineProps {
  connection: Connection;
  nodes: Map<string, PositionedNode>;
  isHighlighted: boolean;
}

/**
 * Renders a single SVG bezier curve between two nodes.
 * Source connects from right edge, target from left edge.
 */
export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  connection,
  nodes,
  isHighlighted,
}) => {
  const source = nodes.get(connection.sourceId);
  const target = nodes.get(connection.targetId);
  if (!source || !target) return null;

  // Connection points: right edge of source → left edge of target
  const x1 = source.x + source.width / 2;
  const y1 = source.y;
  const x2 = target.x - target.width / 2;
  const y2 = target.y;

  // Adaptive control point offset
  const dx = Math.abs(x2 - x1);
  const cpOffset = Math.max(40, dx * 0.35);

  const d = `M ${x1} ${y1} C ${x1 + cpOffset} ${y1}, ${x2 - cpOffset} ${y2}, ${x2} ${y2}`;

  const isDashed = !connection.pathTaken;

  return (
    <path
      d={d}
      fill="none"
      stroke={isHighlighted ? 'var(--color-link, #4a9eff)' : 'var(--color-border, #444)'}
      strokeWidth={isHighlighted ? 2.5 : 1.5}
      strokeDasharray={isDashed ? '6 4' : undefined}
      strokeOpacity={isHighlighted ? 1 : 0.5}
      style={{ transition: 'stroke 0.2s, stroke-opacity 0.2s, stroke-width 0.2s' }}
    />
  );
};
