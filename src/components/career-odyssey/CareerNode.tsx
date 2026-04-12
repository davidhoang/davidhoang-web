import React from 'react';
import type { PositionedNode } from './types';

interface CareerNodeProps {
  node: PositionedNode;
  isHovered: boolean;
  isConnected: boolean;
  isDragging: boolean;
  onHover: (id: string | null) => void;
  onClick: (node: PositionedNode) => void;
  onDragStart: (e: React.PointerEvent, node: PositionedNode) => void;
}

export const CareerNode: React.FC<CareerNodeProps> = ({
  node,
  isHovered,
  isConnected,
  isDragging,
  onHover,
  onClick,
  onDragStart,
}) => {
  return (
    <div
      className={[
        'co-node',
        node.active && 'co-node--active',
        isHovered && 'co-node--hovered',
        isConnected && 'co-node--connected',
        isDragging && 'co-node--dragging',
      ].filter(Boolean).join(' ')}
      style={{
        position: 'absolute',
        left: node.x - node.width / 2,
        top: node.y - node.height / 2,
        width: node.width,
        height: node.height,
      }}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => {
        e.stopPropagation();
        onClick(node);
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onDragStart(e, node);
      }}
      role="button"
      tabIndex={0}
      aria-label={`${node.label} — ${node.dateRange || node.date || ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(node);
        }
      }}
    >
      {node.image && (
        <div
          className="co-node__image"
          style={{ backgroundImage: `url(${node.image})` }}
        />
      )}
      <div className="co-node__body">
        <span className="co-node__label">{node.label}</span>
        {node.dateRange && <span className="co-node__date">{node.dateRange}</span>}
      </div>
      {node.active && <span className="co-node__active-dot" />}
    </div>
  );
};
