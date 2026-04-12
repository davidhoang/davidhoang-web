import React from 'react';
import type { PositionedNode, Connection } from './types';

interface ConnectionLineProps {
  connection: Connection;
  nodes: Map<string, PositionedNode>;
  isHighlighted: boolean;
}

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  connection,
  nodes,
  isHighlighted,
}) => {
  const source = nodes.get(connection.sourceId);
  const target = nodes.get(connection.targetId);
  if (!source || !target) return null;

  // Connect from right edge of source to left edge of target
  const x1 = source.x + source.width / 2;
  const y1 = source.y;
  const x2 = target.x - target.width / 2;
  const y2 = target.y;

  const dy = Math.abs(y2 - y1);
  const dx = Math.abs(x2 - x1);

  let d: string;

  if (dy < 8) {
    // Nearly horizontal — straight line
    d = `M ${x1} ${y1} L ${x2} ${y2}`;
  } else if (dx < 20) {
    // Nearly vertical — straight line
    d = `M ${x1} ${y1} L ${x2} ${y2}`;
  } else {
    // Gentle curve — small control point offset keeps it tight
    const cpOffset = Math.min(30, dx * 0.15);
    d = `M ${x1} ${y1} C ${x1 + cpOffset} ${y1}, ${x2 - cpOffset} ${y2}, ${x2} ${y2}`;
  }

  return (
    <path
      d={d}
      fill="none"
      stroke={isHighlighted ? 'var(--color-link, #4a9eff)' : 'var(--color-border, #ccc)'}
      strokeWidth={isHighlighted ? 2 : 1}
      strokeDasharray={isHighlighted ? undefined : '4 3'}
      strokeOpacity={isHighlighted ? 0.9 : 0.5}
      style={{ transition: 'stroke 0.15s, stroke-opacity 0.15s, stroke-width 0.15s' }}
    />
  );
};
