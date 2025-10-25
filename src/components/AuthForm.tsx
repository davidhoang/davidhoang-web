import React, { useState } from 'react';

interface AuthFormProps {
  onAuthSuccess: (user: any) => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/liveblocks-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Create user object from form data and store in localStorage
      const user = {
        id: email.toLowerCase().replace(/[^a-z0-9]/g, ''),
        info: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name.trim())}&background=007bff&color=fff&size=40`
        }
      };

      // Store user info in localStorage for persistence
      localStorage.setItem('liveblocks-user', JSON.stringify(user));
      
      onAuthSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <div className="auth-form-header">
        <h4>Sign in to comment</h4>
        <p>Please provide your name and email to join the conversation.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="auth-form-content">
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={isLoading}
          />
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <button 
          type="submit" 
          className="auth-submit-button"
          disabled={isLoading || !email || !name}
        >
          {isLoading ? 'Signing in...' : 'Sign in to comment'}
        </button>
      </form>
      
      <div className="auth-privacy">
        <small>
          By signing in, you agree to our terms of service. Your email will be used to identify you in comments and will not be shared publicly.
        </small>
      </div>
    </div>
  );
}
