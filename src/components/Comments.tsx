import React, { useEffect, useState } from "react";
import { Thread, Composer } from "@liveblocks/react-ui";
import { useThreads } from "../../liveblocks.config";
import LiveblocksWrapper from "./LiveblocksWrapper";
import AuthForm from "./AuthForm";
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
  const [user, setUser] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Check if user is already authenticated
    const savedUser = localStorage.getItem('liveblocks-user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('liveblocks-user');
      }
    }
  }, []);

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    setIsAuthenticating(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem('liveblocks-user');
    setUser(null);
  };

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

  // Show authentication form if user is not logged in
  if (!user) {
    return (
      <div className="comments-section">
        <h3>Comments</h3>
        <div className="comments-container">
          <AuthForm onAuthSuccess={handleAuthSuccess} />
        </div>
      </div>
    );
  }
  return (
    <div className="comments-section">
      <div className="comments-header">
        <h3>Comments</h3>
        <div className="user-profile">
          <img 
            src={user.info.avatar} 
            alt={user.info.name}
            className="user-avatar"
          />
          <span className="user-name">{user.info.name}</span>
          <button 
            onClick={handleSignOut}
            className="sign-out-button"
            title="Sign out"
          >
            Sign out
          </button>
        </div>
      </div>
      <div className="comments-container">
        <LiveblocksWrapper roomId={roomId} user={user}>
          <CommentsContent />
        </LiveblocksWrapper>
      </div>
    </div>
  );
}