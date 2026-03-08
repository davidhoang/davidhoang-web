import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PositionedNode } from './types';
import { PersonAvatar } from '../PersonAvatar';

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
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!node) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [node, onClose]);

  // Scroll to top when node changes
  useEffect(() => {
    if (node && panelRef.current) {
      panelRef.current.scrollTop = 0;
    }
  }, [node?.id]);

  return (
    <AnimatePresence>
      {node && (
        <motion.div
          className={`node-panel-overlay ${isMobile ? 'node-panel-mobile' : 'node-panel-desktop'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={panelRef}
            className="node-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
          >
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
