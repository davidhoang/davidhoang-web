import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { Spec } from '@json-render/react';
import ThemeSpecRenderer, { type ThemeData } from './ThemeSpecRenderer';
import {
  THEME_FILTERS,
  type ThemeFilterKey,
  type ThemeSortKey,
  buildCompareShareUrl,
  buildThemeShareUrl,
  filterThemes,
  paletteToCss,
  parseThemeUrlState,
  themeMetaSummary,
} from '../../components/generative-ui/themeExplorer';

interface Props {
  themes: ThemeData[];
}

/** Apply a theme site-wide by triggering the DailyThemeToggle calendar button. */
function applyThemeSiteWide(date: string) {
  const btn = document.querySelector(`[data-date="${date}"]`) as HTMLElement | null;
  if (btn) {
    btn.click();
    return;
  }
  localStorage.setItem('daily-theme-mode', 'true');
  localStorage.setItem('daily-theme-date', date);
  localStorage.setItem('e-ink-mode', 'false');
  window.dispatchEvent(new CustomEvent('theme-selected', { detail: { date } }));
  window.location.reload();
}

function tryParseSpec(buffer: string): Spec | null {
  try {
    const cleaned = buffer
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

async function copyText(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function ComparePanel({
  themes,
  onClear,
  onShare,
  shareCopied,
}: {
  themes: ThemeData[];
  onClear: () => void;
  onShare: () => void;
  shareCopied: boolean;
}) {
  if (themes.length === 0) return null;

  return (
    <section className="themes-explorer__compare" aria-label="Theme comparison">
      <div className="themes-explorer__compare-header">
        <div>
          <h2 className="themes-explorer__compare-title">Compare themes</h2>
          <p className="themes-explorer__compare-subtitle">
            {themes.length === 1
              ? 'Select one more theme to compare side by side.'
              : `${themes[0]?.name} vs ${themes[1]?.name}`}
          </p>
        </div>
        <div className="themes-explorer__compare-actions">
          {themes.length === 2 && (
            <button type="button" className="theme-action-btn" onClick={onShare}>
              {shareCopied ? 'Link copied' : 'Share comparison'}
            </button>
          )}
          <button type="button" className="theme-action-btn theme-action-btn--ghost" onClick={onClear}>
            Clear
          </button>
        </div>
      </div>

      {themes.length === 2 && (
        <div className="themes-explorer__compare-grid">
          {themes.map((theme) => (
            <article key={theme.date} className="themes-explorer__compare-card">
              <ThemeSpecRenderer spec={theme.showcase!} theme={theme} className="theme-spec-scope" />
              <dl className="themes-explorer__compare-meta">
                {themeMetaSummary(theme).map((item) => (
                  <div key={`${theme.date}-${item.label}`}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ThemeMetaRow({
  theme,
  activeDate,
  compareDates,
  onApply,
  onToggleCompare,
  onShare,
  onCopyPalette,
  feedback,
}: {
  theme: ThemeData;
  activeDate: string | null;
  compareDates: string[];
  onApply: (date: string) => void;
  onToggleCompare: (date: string) => void;
  onShare: (date: string) => void;
  onCopyPalette: (theme: ThemeData) => void;
  feedback: string | null;
}) {
  const isActive = activeDate === theme.date;
  const isCompared = compareDates.includes(theme.date);
  const compareDisabled = !isCompared && compareDates.length >= 2;

  return (
    <div className="theme-meta-row">
      <div className="theme-meta-main">
        <strong className="theme-meta-name">{theme.name}</strong>
        <span className="theme-meta-date">{theme.date}</span>
        <span className="theme-meta-dot">&middot;</span>
        <span className="theme-meta-fonts">
          {theme.fonts?.heading?.name} + {theme.fonts?.body?.name}
        </span>
      </div>
      <div className="theme-meta-actions">
        {feedback && <span className="theme-meta-feedback">{feedback}</span>}
        <button
          type="button"
          className={`theme-action-btn theme-action-btn--ghost ${isCompared ? 'active' : ''}`}
          onClick={() => onToggleCompare(theme.date)}
          disabled={compareDisabled}
          aria-pressed={isCompared}
          title={compareDisabled ? 'Compare supports up to two themes' : 'Add to comparison'}
        >
          {isCompared ? 'Compared' : 'Compare'}
        </button>
        <button
          type="button"
          className="theme-action-btn theme-action-btn--ghost"
          onClick={() => onShare(theme.date)}
          title="Copy share link"
        >
          Share
        </button>
        <button
          type="button"
          className="theme-action-btn theme-action-btn--ghost"
          onClick={() => onCopyPalette(theme)}
          title="Copy light-mode CSS variables"
        >
          Palette
        </button>
        <button
          type="button"
          className={`theme-apply-btn ${isActive ? 'active' : ''}`}
          onClick={() => onApply(theme.date)}
          title={isActive ? 'Currently active' : `Apply ${theme.name}`}
        >
          {isActive ? 'Active' : 'Apply'}
        </button>
      </div>
    </div>
  );
}

export default function ThemesExplorer({ themes }: Props) {
  const [filter, setFilter] = useState<ThemeFilterKey>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<ThemeSortKey>('newest');
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
  const [compareDates, setCompareDates] = useState<string[]>([]);
  const [highlightDate, setHighlightDate] = useState<string | null>(null);
  const [cardFeedback, setCardFeedback] = useState<Record<string, string>>({});
  const [compareShareCopied, setCompareShareCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const themesWithShowcase = useMemo(
    () => themes.filter((t): t is ThemeData & { showcase: Spec } => Boolean(t.showcase)),
    [themes],
  );

  const filtered = useMemo(
    () => filterThemes(themesWithShowcase, { filter, search, sort }),
    [themesWithShowcase, filter, search, sort],
  );

  const compareThemes = useMemo(
    () =>
      compareDates
        .map((date) => themesWithShowcase.find((theme) => theme.date === date))
        .filter((theme): theme is ThemeData & { showcase: Spec } => Boolean(theme)),
    [compareDates, themesWithShowcase],
  );

  const showFeedback = useCallback((date: string, message: string) => {
    setCardFeedback((current) => ({ ...current, [date]: message }));
    window.setTimeout(() => {
      setCardFeedback((current) => {
        const next = { ...current };
        delete next[date];
        return next;
      });
    }, 1800);
  }, []);

  const handleApplyTheme = useCallback((date: string) => {
    setActiveDate(date);
    applyThemeSiteWide(date);
  }, []);

  const handleCopyPalette = useCallback(
    async (theme: ThemeData) => {
      const copied = await copyText(paletteToCss(theme));
      if (copied) showFeedback(theme.date, 'Palette copied');
    },
    [showFeedback],
  );

  const handleShareTheme = useCallback(
    async (date: string) => {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const copied = await copyText(buildThemeShareUrl(date, origin));
      if (copied) showFeedback(date, 'Link copied');
    },
    [showFeedback],
  );

  const handleToggleCompare = useCallback((date: string) => {
    setCompareDates((current) => {
      if (current.includes(date)) {
        return current.filter((value) => value !== date);
      }
      if (current.length >= 2) return current;
      return [...current, date];
    });
    setCompareShareCopied(false);
  }, []);

  const handleShareCompare = useCallback(async () => {
    if (compareDates.length !== 2) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const copied = await copyText(buildCompareShareUrl(compareDates, origin));
    if (copied) {
      setCompareShareCopied(true);
      window.setTimeout(() => setCompareShareCopied(false), 1800);
    }
  }, [compareDates]);

  useEffect(() => {
    const onApply = (event: Event) => {
      const date = (event as CustomEvent<{ date?: string }>).detail?.date;
      if (date) handleApplyTheme(date);
    };
    const onCopyPalette = (event: Event) => {
      const payload = (event as CustomEvent<{ payload?: string }>).detail?.payload;
      if (payload) void copyText(payload);
    };

    window.addEventListener('daily-theme:apply', onApply);
    window.addEventListener('daily-theme:copy-palette', onCopyPalette);
    return () => {
      window.removeEventListener('daily-theme:apply', onApply);
      window.removeEventListener('daily-theme:copy-palette', onCopyPalette);
    };
  }, [handleApplyTheme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { theme, compare } = parseThemeUrlState(window.location.search);
    if (compare?.length) {
      setCompareDates(compare.slice(0, 2));
    }
    const focusDate = theme || compare?.[0];
    if (!focusDate) return;

    setHighlightDate(focusDate);
    window.requestAnimationFrame(() => {
      cardRefs.current[focusDate]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    window.setTimeout(() => setHighlightDate(null), 2400);
  }, []);

  const handleAiQuery = useCallback(
    async (e: { preventDefault: () => void }) => {
      e.preventDefault();
      if (!query.trim() || aiLoading) return;

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
        let latestSpec: Spec | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const spec = tryParseSpec(buffer);
          if (spec) {
            latestSpec = spec;
            setAiSpec(spec);
          }
        }

        const finalSpec = tryParseSpec(buffer);
        if (finalSpec) {
          setAiSpec(finalSpec);
        } else if (!latestSpec) {
          throw new Error('Failed to parse AI response');
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
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
      <form className="themes-explorer__query" onSubmit={handleAiQuery}>
        <input
          type="text"
          className="themes-explorer__input"
          placeholder='Ask about themes... e.g. "show me dark moody themes"'
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

      {aiError && <div className="themes-explorer__error">{aiError}</div>}

      {(aiSpec || aiLoading) && (
        <div className="themes-explorer__ai-result">
          <div className="themes-explorer__ai-header">
            <span className="themes-explorer__ai-label">
              {aiLoading ? 'Composing layout...' : 'AI-composed layout'}
            </span>
            {!aiLoading && (
              <button className="themes-explorer__ai-dismiss" onClick={() => setAiSpec(null)}>
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

      <div className="themes-explorer__toolbar">
        <input
          type="search"
          className="themes-explorer__search"
          placeholder="Search by name, mood, font, layout..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search themes"
        />
        <label className="themes-explorer__sort">
          <span>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as ThemeSortKey)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
        <p className="themes-explorer__count" aria-live="polite">
          {filtered.length} of {themesWithShowcase.length}
        </p>
      </div>

      <div className="themes-explorer__filters" role="toolbar" aria-label="Theme filters">
        {THEME_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`themes-explorer__filter ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
          >
            {f.label}
          </button>
        ))}
      </div>

      {compareThemes.length > 0 && (
        <ComparePanel
          themes={compareThemes}
          onClear={() => setCompareDates([])}
          onShare={() => void handleShareCompare()}
          shareCopied={compareShareCopied}
        />
      )}

      <div className="themes-explorer__grid">
        {filtered.map((theme) => (
          <div
            key={theme.date}
            ref={(node) => {
              cardRefs.current[theme.date] = node;
            }}
            className={`themes-explorer__card ${highlightDate === theme.date ? 'is-highlighted' : ''} ${
              compareDates.includes(theme.date) ? 'is-compared' : ''
            }`}
          >
            <ThemeSpecRenderer spec={theme.showcase} theme={theme} className="theme-spec-scope" />
            <ThemeMetaRow
              theme={theme}
              activeDate={activeDate}
              compareDates={compareDates}
              onApply={handleApplyTheme}
              onToggleCompare={handleToggleCompare}
              onShare={handleShareTheme}
              onCopyPalette={handleCopyPalette}
              feedback={cardFeedback[theme.date] || null}
            />
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="themes-explorer__empty">No themes match this filter or search.</p>
      )}

      <p className="themes-explorer__footer">
        {themesWithShowcase.length} themes · Compare up to two · Share links copy a permalink · Showcases rendered with{' '}
        <a href="https://github.com/vercel-labs/json-render" target="_blank" rel="noopener noreferrer">
          json-render
        </a>
      </p>
    </div>
  );
}
