import React from 'react';
import { motion } from 'framer-motion';
import type { PositionedNode } from './types';
import { NODE_STYLES } from './types';

interface CareerNodeProps {
  node: PositionedNode;
  isHovered: boolean;
  isConnected: boolean;
  onHover: (id: string | null) => void;
  onClick: (node: PositionedNode) => void;
}

/**
 * A single node rendered as a positioned DOM element.
 * Uses Framer Motion for hover/tap micro-interactions.
 */
export const CareerNode: React.FC<CareerNodeProps> = ({
  node,
  isHovered,
  isConnected,
  onHover,
  onClick,
}) => {
  const style = NODE_STYLES[node.type] || NODE_STYLES.event;
  const isDimmed = !isHovered && !isConnected && node.pathTaken === false;

  return (
    <motion.div
      className={`co-node co-node--${node.type}${node.active ? ' co-node--active' : ''}${isDimmed ? ' co-node--dimmed' : ''}`}
      style={{
        position: 'absolute',
        left: node.x - node.width / 2,
        top: node.y - node.height / 2,
        width: node.width,
        height: node.height,
        borderColor: style.border,
        backgroundColor: style.fill,
        color: style.text,
      }}
      initial={false}
      whileHover={{ scale: 1.06, zIndex: 10 }}
      whileTap={{ scale: 0.97 }}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(node)}
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
        <span className="co-node__type">{node.type === 'possiblePath' ? 'path not taken' : node.type}</span>
        <span className="co-node__label">{node.label}</span>
        {node.dateRange && <span className="co-node__date">{node.dateRange}</span>}
      </div>
      {node.active && <span className="co-node__active-dot" />}
    </motion.div>
  );
};
