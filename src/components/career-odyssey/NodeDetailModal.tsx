import React, { useEffect } from 'react';
import type { PositionedNode } from './types';
import { PersonAvatar } from '../PersonAvatar';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface NodeDetailModalProps {
  node: PositionedNode | null;
  allNodes: Map<string, PositionedNode>;
  onClose: () => void;
  onNavigate: (node: PositionedNode) => void;
  isMobile: boolean;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  node,
  allNodes,
  onClose,
  onNavigate,
  isMobile,
}) => {
  const { containerRef, handleKeyDown } = useFocusTrap(!!node);

  useEffect(() => {
    if (!node) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [node, onClose]);

  useEffect(() => {
    if (node && containerRef.current) {
      const panel = containerRef.current.querySelector('.node-panel');
      if (panel) panel.scrollTop = 0;
    }
  }, [node?.id]);

  if (!node) return null;

  return (
    <div
      ref={containerRef}
      className={`node-panel-overlay ${isMobile ? 'node-panel-mobile' : 'node-panel-desktop'} node-panel-overlay--open`}
      role="dialog"
      aria-modal="true"
      aria-label={node.label}
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="node-panel">
        <button
          className="node-card-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {node.image && (
          <div
            className="node-card-image"
            style={{ backgroundImage: `url(${node.image})` }}
          />
        )}

        <div className="node-card-content">
          <h2 className="node-card-title">{node.label}</h2>

          {(node.date || node.dateRange) && (
            <div className="node-card-date">
              {node.dateRange || node.date}
            </div>
          )}

          {node.description && (
            <p className="node-card-description">{node.description}</p>
          )}

          {node.iframe && (
            <div className="node-card-embed">
              <iframe
                className="node-card-embed-content"
                src={node.iframe}
                title={node.label}
                allowFullScreen
              />
            </div>
          )}

          {node.link && (
            <a
              href={node.link}
              target="_blank"
              rel="noopener noreferrer"
              className="node-card-link"
            >
              Learn more →
            </a>
          )}

          {node.workedWith && node.workedWith.length > 0 && (
            <div className="node-card-worked-with">
              <div className="node-card-worked-with-title">Worked with</div>
              <div className="node-card-worked-with-list">
                {node.workedWith.map((person) => (
                  <div key={person.name} className="node-card-worked-with-person">
                    <PersonAvatar person={person} size={28} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {node.connections && node.connections.length > 0 && (
            <div className="node-card-connections">
              <div className="node-card-connections-inline">
                <span className="node-card-connections-label">Connected to:</span>
                <span className="node-card-connections-items">
                  {node.connections.map((connId, index) => {
                    const connectedNode = allNodes.get(connId);
                    if (!connectedNode) return null;
                    return (
                      <span key={connId}>
                        {index > 0 && (
                          <span className="node-card-connections-separator">, </span>
                        )}
                        <button
                          className="node-card-connection-link"
                          onClick={() => onNavigate(connectedNode)}
                        >
                          {connectedNode.label}
                        </button>
                      </span>
                    );
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
