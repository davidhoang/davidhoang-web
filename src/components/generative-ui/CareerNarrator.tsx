import React, { useState, useRef, useCallback } from 'react';
import {
  Renderer,
  StateProvider,
  VisibilityProvider,
  ActionProvider,
  type Spec,
} from '@json-render/react';
import { registry } from './registry';

interface Props {
  /** Suggested queries shown as quick-action chips */
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  'Show me the design leadership path',
  'How did gaming shape David\'s career?',
  'What are the roads not taken?',
  'Tell me about the startup journey',
  'The path from art school to tech',
];

function tryParseSpec(buffer: string): Spec | null {
  try {
    let cleaned = buffer
      .replace(/```(?:json)?\s*/g, '')
      .replace(/```\s*$/g, '')
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/\/\/[^\n]*/g, '');
    const parsed = JSON.parse(cleaned);
    if (parsed.root && parsed.elements && parsed.elements[parsed.root]) {
      return parsed;
    }
  } catch {
    // Not valid yet
  }
  return null;
}

function SpecRenderer({ spec }: { spec: Spec }) {
  return (
    <StateProvider initialState={{}}>
      <VisibilityProvider>
        <ActionProvider handlers={{}}>
          <Renderer spec={spec} registry={registry} />
        </ActionProvider>
      </VisibilityProvider>
    </StateProvider>
  );
}

export default function CareerNarrator({ suggestions = DEFAULT_SUGGESTIONS }: Props) {
  const [query, setQuery] = useState('');
  const [spec, setSpec] = useState<Spec | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runQuery = useCallback(
    async (q: string) => {
      if (!q.trim() || loading) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setQuery(q);
      setLoading(true);
      setError(null);
      setSpec(null);

      try {
        const res = await fetch('/api/career-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q.trim() }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response stream');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const parsed = tryParseSpec(buffer);
          if (parsed) setSpec(parsed);
        }

        const finalSpec = tryParseSpec(buffer);
        if (finalSpec) {
          setSpec(finalSpec);
        } else if (!spec) {
          throw new Error('Failed to parse AI response');
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runQuery(query);
  };

  return (
    <div className="career-narrator">
      <form className="career-narrator__query" onSubmit={handleSubmit}>
        <input
          type="text"
          className="career-narrator__input"
          placeholder="Ask about David's career..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="career-narrator__submit"
          disabled={loading || !query.trim()}
        >
          {loading ? 'Narrating...' : 'Ask'}
        </button>
      </form>

      {/* Suggestion chips */}
      {!spec && !loading && (
        <div className="career-narrator__suggestions">
          {suggestions.map((s) => (
            <button
              key={s}
              className="career-narrator__chip"
              onClick={() => runQuery(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="career-narrator__error">{error}</div>
      )}

      {/* Result */}
      {(spec || loading) && (
        <div className="career-narrator__result">
          {spec && <SpecRenderer spec={spec} />}
          {loading && !spec && (
            <div className="career-narrator__loading">
              <div className="streaming-dot" />
              <div className="streaming-dot" />
              <div className="streaming-dot" />
            </div>
          )}
        </div>
      )}

      {spec && !loading && (
        <div className="career-narrator__actions">
          <button
            className="career-narrator__reset"
            onClick={() => { setSpec(null); setQuery(''); }}
          >
            Ask another question
          </button>
        </div>
      )}
    </div>
  );
}
