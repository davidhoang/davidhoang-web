import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Spec } from '@json-render/react';
import ThemeSpecRenderer, { type ThemeData } from './ThemeSpecRenderer';

interface Props {
  themes: ThemeData[];
}

type FilterKey =
  | 'all'
  | 'serif'
  | 'sans-serif'
  | 'display'
  | 'elevated'
  | 'flat'
  | 'outlined'
  | 'filled'
  | 'high-contrast';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'serif', label: 'Serif' },
  { key: 'sans-serif', label: 'Sans-serif' },
  { key: 'display', label: 'Display' },
  { key: 'elevated', label: 'Elevated' },
  { key: 'flat', label: 'Flat' },
  { key: 'outlined', label: 'Outlined' },
  { key: 'filled', label: 'Filled' },
  { key: 'high-contrast', label: 'High contrast' },
];

function matchesFilter(theme: ThemeData, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  if (['serif', 'sans-serif', 'display'].includes(filter)) {
    return (
      theme.fonts?.heading?.category === filter ||
      theme.fonts?.body?.category === filter
    );
  }
  if (['elevated', 'flat', 'outlined', 'filled'].includes(filter)) {
    return theme.cards?.style === filter;
  }
  if (filter === 'high-contrast') {
    return theme.colors?.contrastMode === 'high';
  }
  return true;
}

/** Apply a theme site-wide by triggering the DailyThemeToggle calendar button. */
function applyThemeSiteWide(date: string) {
  // Find the calendar button with this date and click it
  const btn = document.querySelector(`[data-date="${date}"]`) as HTMLElement | null;
  if (btn) {
    btn.click();
    return;
  }
  // Fallback: set localStorage directly and dispatch event
  localStorage.setItem('daily-theme-mode', 'true');
  localStorage.setItem('daily-theme-date', date);
  localStorage.setItem('e-ink-mode', 'false');
  window.dispatchEvent(new CustomEvent('theme-selected', { detail: { date } }));
  // Reload to apply
  window.location.reload();
}

/** Try to parse a partial JSON spec, returning null if not yet valid. */
function tryParseSpec(buffer: string): Spec | null {
  try {
    // Clean common LLM artifacts
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

function ThemeMetaRow({
  theme,
  activeDate,
  onApply,
}: {
  theme: ThemeData;
  activeDate: string | null;
  onApply: (date: string) => void;
}) {
  const isActive = activeDate === theme.date;
  return (
    <div className="theme-meta-row">
      <span className="theme-meta-date">{theme.date}</span>
      <span className="theme-meta-dot">&middot;</span>
      <span className="theme-meta-fonts">
        {theme.fonts?.heading?.name} + {theme.fonts?.body?.name}
      </span>
      <button
        className={`theme-apply-btn ${isActive ? 'active' : ''}`}
        onClick={() => onApply(theme.date)}
        title={isActive ? 'Currently active' : `Apply ${theme.name}`}
      >
        {isActive ? 'Active' : 'Apply'}
      </button>
    </div>
  );
}

export default function ThemesExplorer({ themes }: Props) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [aiSpec, setAiSpec] = useState<Spec | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('daily-theme-date') || null;
    }
    return null;
  });
  const abortRef = useRef<AbortController | null>(null);

  const themesWithShowcase = themes.filter((t): t is ThemeData & { showcase: Spec } => Boolean(t.showcase));
  const filtered = themesWithShowcase.filter((t) => matchesFilter(t, filter));

  const handleApplyTheme = useCallback((date: string) => {
    setActiveDate(date);
    applyThemeSiteWide(date);
  }, []);

  const handleCopyPalette = useCallback(async (payload?: string) => {
    if (!payload || typeof navigator === 'undefined' || !navigator.clipboard) return;
    await navigator.clipboard.writeText(payload);
  }, []);

  useEffect(() => {
    const onApply = (event: Event) => {
      const date = (event as CustomEvent<{ date?: string }>).detail?.date;
      if (date) handleApplyTheme(date);
    };
    const onCopyPalette = (event: Event) => {
      const payload = (event as CustomEvent<{ payload?: string }>).detail?.payload;
      void handleCopyPalette(payload);
    };

    window.addEventListener('daily-theme:apply', onApply);
    window.addEventListener('daily-theme:copy-palette', onCopyPalette);
    return () => {
      window.removeEventListener('daily-theme:apply', onApply);
      window.removeEventListener('daily-theme:copy-palette', onCopyPalette);
    };
  }, [handleApplyTheme, handleCopyPalette]);

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

          // Progressively try to parse and render
          const spec = tryParseSpec(buffer);
          if (spec) {
            setAiSpec(spec);
          }
        }

        // Final parse
        const finalSpec = tryParseSpec(buffer);
        if (finalSpec) {
          setAiSpec(finalSpec);
        } else if (!aiSpec) {
          throw new Error('Failed to parse AI response');
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
      {(aiSpec || aiLoading) && (
        <div className="themes-explorer__ai-result">
          <div className="themes-explorer__ai-header">
            <span className="themes-explorer__ai-label">
              {aiLoading ? 'Composing layout...' : 'AI-composed layout'}
            </span>
            {!aiLoading && (
              <button
                className="themes-explorer__ai-dismiss"
                onClick={() => setAiSpec(null)}
              >
                Dismiss
              </button>
            )}
          </div>
          {aiSpec && <ThemeSpecRenderer spec={aiSpec} />}
          {aiLoading && !aiSpec && (
            <div className="themes-explorer__streaming-placeholder">
              <div className="streaming-dot" />
              <div className="streaming-dot" />
              <div className="streaming-dot" />
            </div>
          )}
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
            <ThemeSpecRenderer spec={theme.showcase} theme={theme} className="theme-spec-scope" />
            <ThemeMetaRow
              theme={theme}
              activeDate={activeDate}
              onApply={handleApplyTheme}
            />
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
