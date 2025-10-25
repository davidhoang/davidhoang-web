import React, { useState, useEffect } from 'react';

interface ModerationPanelProps {
  roomId: string;
  adminToken: string;
}

interface Comment {
  id: string;
  body: string;
  userId: string;
  createdAt: string;
  threadId: string;
}

interface Thread {
  id: string;
  comments: Comment[];
  metadata: any;
}

export default function ModerationPanel({ roomId, adminToken }: ModerationPanelProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const loadRoomData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getRoomData',
          roomId,
          adminToken
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load room data');
      }

      // Transform the data to match our interface
      const roomData = data.result;
      const threadsData = roomData.threads || [];
      setThreads(threadsData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch('/api/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deleteComment',
          commentId,
          adminToken
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete comment');
      }

      // Reload data after deletion
      await loadRoomData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  };

  const editComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch('/api/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'editComment',
          commentId,
          newContent: editContent,
          adminToken
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to edit comment');
      }

      setEditingComment(null);
      setEditContent('');
      await loadRoomData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit comment');
    }
  };

  const deleteThread = async (threadId: string) => {
    if (!confirm('Are you sure you want to delete this entire thread?')) return;

    try {
      const response = await fetch('/api/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deleteThread',
          threadId,
          adminToken
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete thread');
      }

      await loadRoomData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete thread');
    }
  };

  useEffect(() => {
    loadRoomData();
  }, [roomId]);

  return (
    <div className="moderation-panel">
      <div className="moderation-header">
        <h3>Comment Moderation</h3>
        <button onClick={loadRoomData} disabled={isLoading} className="refresh-button">
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="moderation-content">
        {threads.length === 0 ? (
          <p>No comments to moderate.</p>
        ) : (
          threads.map((thread) => (
            <div key={thread.id} className="thread-item">
              <div className="thread-header">
                <h4>Thread {thread.id}</h4>
                <button 
                  onClick={() => deleteThread(thread.id)}
                  className="delete-thread-button"
                >
                  Delete Thread
                </button>
              </div>
              
              <div className="comments-list">
                {thread.comments?.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      <span className="comment-user">User: {comment.userId}</span>
                      <span className="comment-date">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="comment-content">
                      {editingComment === comment.id ? (
                        <div className="edit-form">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="edit-textarea"
                          />
                          <div className="edit-actions">
                            <button 
                              onClick={() => editComment(comment.id)}
                              className="save-button"
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => {
                                setEditingComment(null);
                                setEditContent('');
                              }}
                              className="cancel-button"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p>{comment.body}</p>
                      )}
                    </div>
                    
                    <div className="comment-actions">
                      <button 
                        onClick={() => {
                          setEditingComment(comment.id);
                          setEditContent(comment.body);
                        }}
                        className="edit-button"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => deleteComment(comment.id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
