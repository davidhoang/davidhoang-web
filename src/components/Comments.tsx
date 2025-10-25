import React, { useEffect, useState } from "react";

interface CommentsProps {
  roomId: string;
}

export default function Comments({ roomId }: CommentsProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    console.log("Comments component mounted with roomId:", roomId);
    setIsLoaded(true);
  }, [roomId]);
  
  return (
    <div className="comments-section">
      <h3>Comments</h3>
      <div className="comments-container">
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          <p>Room ID: {roomId}</p>
          <p>Component loaded: {isLoaded ? 'Yes' : 'No'}</p>
          <p>This is a test to verify React hydration is working.</p>
          <button 
            onClick={() => alert('React is working!')}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Test Button
          </button>
        </div>
      </div>
    </div>
  );
}
