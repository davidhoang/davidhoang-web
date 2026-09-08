import type { PositionedNode, Connection } from './types';

interface ConnectionLineProps {
  connection: Connection;
  nodes: Map<string, PositionedNode>;
  isHighlighted: boolean;
}

export function ConnectionLine({ connection, nodes, isHighlighted }: ConnectionLineProps) {
  const source = nodes.get(connection.sourceId);
  const target = nodes.get(connection.targetId);
  if (!source || !target) return null;

  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const horizontal = Math.abs(dx) / ((source.width + target.width) / 2) > Math.abs(dy) / ((source.height + target.height) / 2);
  const direction = Math.sign(horizontal ? dx : dy) || 1;
  const start = { x: source.x + (horizontal ? direction * source.width / 2 : 0), y: source.y + (horizontal ? 0 : direction * source.height / 2) };
  const end = { x: target.x - (horizontal ? direction * target.width / 2 : 0), y: target.y - (horizontal ? 0 : direction * target.height / 2) };
  const bend = Math.max(56, Math.abs(horizontal ? end.x - start.x : end.y - start.y) * 0.48);
  const c1 = { x: start.x + (horizontal ? direction * bend : 0), y: start.y + (horizontal ? 0 : direction * bend) };
  const c2 = { x: end.x - (horizontal ? direction * bend : 0), y: end.y - (horizontal ? 0 : direction * bend) };
  const mid = { x: (start.x + 3 * c1.x + 3 * c2.x + end.x) / 8, y: (start.y + 3 * c1.y + 3 * c2.y + end.y) / 8 };

  return <g className={`co-wire${isHighlighted ? ' co-wire--highlighted' : ''}`} data-source={source.id} data-target={target.id}>
    <path className="co-wire__path" d={`M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`} vectorEffect="non-scaling-stroke" />
    {connection.label && <text className="co-wire__label" x={mid.x} y={mid.y - 9} textAnchor="middle">{connection.label}</text>}
  </g>;
}
