import { memo } from 'react';
import type { PositionedNode } from './types';

interface CareerNodeProps {
  node: PositionedNode;
  isHighlighted: boolean;
  isConnected: boolean;
  isDragging: boolean;
  onHover: (id: string | null) => void;
  onOpen: (id: string) => void;
  onFocus: (id: string | null, reveal?: boolean) => void;
}

export const CareerNode = memo(function CareerNode({ node, isHighlighted, isConnected, isDragging, onHover, onOpen, onFocus }: CareerNodeProps) {
  const presentation = node.presentation || 'moment';
  return (
    <button
      type="button"
      className={[
        'co-node', `co-node--${presentation}`,
        node.featured && 'co-node--featured',
        isHighlighted && 'co-node--highlighted',
        isConnected && 'co-node--connected',
        isDragging && 'co-node--dragging',
      ].filter(Boolean).join(' ')}
      data-node-id={node.id}
      style={{ left: node.x - node.width / 2, top: node.y - node.height / 2, width: node.width, height: node.height }}
      aria-label={`${node.dateRange || node.date || node.kicker || 'Moment'}: ${node.label}. Open moment.`}
      aria-haspopup="dialog"
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse' && window.matchMedia('(hover: hover)').matches) onHover(node.id);
      }}
      onPointerLeave={() => onHover(null)}
      onFocus={(event) => onFocus(node.id, event.currentTarget.matches(':focus-visible'))}
      onBlur={() => onFocus(null)}
      onClick={(event) => {
        // Pointer selection is resolved by the board after the drag threshold.
        if (event.detail === 0) onOpen(node.id);
      }}
    >
      <span className="co-node__port co-node__port--left" aria-hidden="true" />
      <span className="co-node__port co-node__port--right" aria-hidden="true" />
      <span className="co-node__port co-node__port--top" aria-hidden="true" />
      <span className="co-node__port co-node__port--bottom" aria-hidden="true" />
      <span className="co-node__content">
        <span className="co-node__heading">
          <span className="co-node__date">{node.dateRange || node.date || 'Beginnings'}</span>
          <span className="co-node__kind">{node.kicker || (presentation === 'photo' ? 'A change of place' : 'Moment')}</span>
        </span>
        {node.image && <img className="co-node__image" src={node.image} alt={node.imageAlt || node.label} width="1600" height="900" draggable={false} loading={node.featured ? 'eager' : 'lazy'} fetchPriority={node.featured ? 'high' : 'auto'} />}
        <span className="co-node__body">
          {presentation === 'quote' && <span className="co-node__quote-mark" aria-hidden="true">“</span>}
          <span className="co-node__label">{node.label}</span>
          {node.description && presentation !== 'photo' && <span className="co-node__summary">{node.description}</span>}
          <span className="co-node__footer">
            <span>{node.tags?.slice(0, 2).join(' / ') || node.sourceLabel || 'Explore this moment'}</span>
            <span className="co-node__open" aria-hidden="true">↗</span>
          </span>
        </span>
      </span>
    </button>
  );
});
