import React, { useEffect, useState } from "react";
import { Thread, Composer } from "@liveblocks/react-ui";
import { useThreads } from "../../liveblocks.config";
import LiveblocksWrapper from "./LiveblocksWrapper";
import "@liveblocks/react-ui/styles.css";

interface CommentsProps {
  roomId: string;
}

// Inner component that uses Liveblocks hooks
function CommentsContent() {
  const { threads, isLoading, error } = useThreads();

  console.log("CommentsContent render:", { threads, isLoading, error });

  if (error) {
    console.error("Liveblocks error:", error);
    return (
      <div className="comments-error">
        <p>Failed to load comments. Please try refreshing the page.</p>
        <details>
          <summary>Error details</summary>
          <pre>{error.message}</pre>
        </details>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="comments-loading">
        <p>Loading comments...</p>
      </div>
    );
  }

  return (
    <div className="comments-content">
      {/* Composer for creating new comments */}
      <div className="comments-composer">
        <Composer />
      </div>
      
      {/* Display existing threads */}
      <div className="comments-threads">
        {threads.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to comment!</p>
        ) : (
          threads.map((thread) => (
            <Thread key={thread.id} thread={thread} />
          ))
        )}
      </div>
    </div>
  );
}

export default function Comments({ roomId }: CommentsProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  console.log("Comments component rendering with roomId:", roomId);
  
  if (!isClient) {
    return (
      <div className="comments-section">
        <h3>Comments</h3>
        <div className="comments-container">
          <div className="comments-loading">
            <p>Loading comments...</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="comments-section">
      <h3>Comments</h3>
      <div className="comments-container">
        <LiveblocksWrapper roomId={roomId}>
          <CommentsContent />
        </LiveblocksWrapper>
      </div>
    </div>
  );
}