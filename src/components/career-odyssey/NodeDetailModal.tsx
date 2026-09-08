import { useEffect, useRef } from 'react';
import type { PositionedNode, Connection } from './types';

interface NodeDetailModalProps {
  node: PositionedNode;
  allNodes: Map<string, PositionedNode>;
  connections: Connection[];
  onClose: () => void;
  onNavigate: (node: PositionedNode) => void;
}

export function NodeDetailModal({ node, allNodes, connections, onClose, onNavigate }: NodeDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousNodeId = useRef(node.id);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
    if (previousNodeId.current !== node.id) headingRef.current?.focus({ preventScroll: true });
    previousNodeId.current = node.id;
  }, [node.id]);

  const related = connections.flatMap(connection => {
    const id = connection.sourceId === node.id ? connection.targetId : connection.targetId === node.id ? connection.sourceId : null;
    const moment = id ? allNodes.get(id) : null;
    return moment ? [{ moment, label: connection.label }] : [];
  });

  return <dialog
    ref={dialogRef}
    className="co-dialog"
    aria-labelledby="co-detail-title"
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}
  >
    <div className="co-detail" ref={panelRef}>
      <div className="co-detail__top"><span>{node.dateRange || node.date || node.kicker || 'A reflection'}</span><button type="button" className="btn btn-ghost co-detail__close" onClick={onClose} aria-label="Close moment">×</button></div>
      {node.image && <img className="co-detail__image" src={node.image} alt={node.imageAlt || node.label} width="1600" height="900" />}
      <div className="co-detail__body">
        <p className="co-detail__kicker">{node.kicker || 'A moment along the way'}</p>
        <h2 id="co-detail-title" ref={headingRef} tabIndex={-1}>{node.label}</h2>
        {node.description && <p className="co-detail__description">{node.description}</p>}
        {node.link && <a className="co-detail__source" href={node.link} {...(node.link.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{node.sourceLabel || 'Read the story'} <span aria-hidden="true">↗</span></a>}
        {related.length > 0 && <section className="co-detail__connections" aria-label="Connected moments">
          <h3>Follow a connection</h3>
          {related.map(({ moment, label }) => <button type="button" key={moment.id} className="co-detail__connection" onClick={() => onNavigate(moment)}><span><small>{label || 'Connected moment'}</small>{moment.label}</span><span aria-hidden="true">↗</span></button>)}
        </section>}
      </div>
    </div>
  </dialog>;
}
