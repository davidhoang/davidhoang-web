import React, { useState, useRef, useCallback } from 'react';
import {
  Renderer,
  StateProvider,
  VisibilityProvider,
  ActionProvider,
  type Spec,
} from '@json-render/react';
import { registry } from './registry';

interface ThemeData {
  name: string;
  date: string;
  description: string;
  colors: {
    colorScheme: string;
    contrastMode: string;
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  fonts: {
    heading: { name: string; category: string };
    body: { name: string; category: string };
  };
  cards: { style: string };
  background: { texture: string };
  hero: { layout: string };
  showcase?: Spec;
}

interface Props {
  themes: ThemeData[];
}

type FilterKey = 'all' | 'serif' | 'sans-serif' | 'display' | 'glass' | 'elevated' | 'flat';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'serif', label: 'Serif' },
  { key: 'sans-serif', label: 'Sans-serif' },
  { key: 'display', label: 'Display' },
  { key: 'glass', label: 'Glass' },
  { key: 'elevated', label: 'Elevated' },
  { key: 'flat', label: 'Flat' },
];

function matchesFilter(theme: ThemeData, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  if (['serif', 'sans-serif', 'display'].includes(filter)) {
    return (
      theme.fonts.heading.category === filter ||
      theme.fonts.body.category === filter
    );
  }
  if (['glass', 'elevated', 'flat'].includes(filter)) {
    return theme.cards.style === filter;
  }
  return true;
}

function ThemeSpecRenderer({ spec }: { spec: Spec }) {
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

function ThemeMetaRow({ theme }: { theme: ThemeData }) {
  return (
    <div className="theme-meta-row">
      <span className="theme-meta-date">{theme.date}</span>
      <span className="theme-meta-dot">&middot;</span>
      <span className="theme-meta-fonts">
        {theme.fonts.heading.name} + {theme.fonts.body.name}
      </span>
    </div>
  );
}

export default function ThemesExplorer({ themes }: Props) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [aiSpec, setAiSpec] = useState<Spec | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const themesWithShowcase = themes.filter((t) => t.showcase);
  const filtered = themesWithShowcase.filter((t) => matchesFilter(t, filter));

  const handleAiQuery = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!query.trim() || aiLoading) return;

      // Abort previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setAiLoading(true);
      setAiError(null);
      setAiSpec(null);

      try {
        const res = await fetch('/api/theme-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: query.trim() }),
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

          // Try to parse complete JSON from the buffer
          try {
            const parsed = JSON.parse(buffer);
            if (parsed.root && parsed.elements) {
              setAiSpec(parsed);
            }
          } catch {
            // Not complete yet, keep accumulating
          }
        }

        // Final parse
        try {
          const finalSpec = JSON.parse(buffer);
          if (finalSpec.root && finalSpec.elements) {
            setAiSpec(finalSpec);
          }
        } catch {
          if (!aiSpec) {
            throw new Error('Failed to parse AI response');
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setAiError(err.message);
        }
      } finally {
        setAiLoading(false);
      }
    },
    [query, aiLoading],
  );

  return (
    <div className="themes-explorer">
      {/* AI Query */}
      <form className="themes-explorer__query" onSubmit={handleAiQuery}>
        <input
          type="text"
          className="themes-explorer__input"
          placeholder="Ask about themes... e.g. &quot;show me dark moody themes&quot;"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={aiLoading}
        />
        <button
          type="submit"
          className="themes-explorer__submit"
          disabled={aiLoading || !query.trim()}
        >
          {aiLoading ? 'Generating...' : 'Ask'}
        </button>
      </form>

      {/* AI Result */}
      {aiError && (
        <div className="themes-explorer__error">
          {aiError}
        </div>
      )}
      {aiSpec && (
        <div className="themes-explorer__ai-result">
          <div className="themes-explorer__ai-header">
            <span className="themes-explorer__ai-label">AI-composed layout</span>
            <button
              className="themes-explorer__ai-dismiss"
              onClick={() => setAiSpec(null)}
            >
              Dismiss
            </button>
          </div>
          <ThemeSpecRenderer spec={aiSpec} />
        </div>
      )}

      {/* Filters */}
      <div className="themes-explorer__filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`themes-explorer__filter ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Theme Grid */}
      <div className="themes-explorer__grid">
        {filtered.map((theme) => (
          <div key={theme.date} className="themes-explorer__card">
            <ThemeSpecRenderer spec={theme.showcase!} />
            <ThemeMetaRow theme={theme} />
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="themes-explorer__empty">
          No themes match this filter.
        </p>
      )}

      {/* Footer */}
      <p className="themes-explorer__footer">
        {themesWithShowcase.length} themes &middot; Showcases rendered with{' '}
        <a href="https://github.com/vercel-labs/json-render" target="_blank" rel="noopener noreferrer">
          json-render
        </a>
      </p>
    </div>
  );
}
