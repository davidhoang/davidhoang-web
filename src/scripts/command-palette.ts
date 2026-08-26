/**
 * Command Palette
 *
 * Transforms the navigation bar into a searchable command palette.
 * Activated by clicking the nav, pressing ⌘K, or Ctrl+K.
 * Searches across pages, writing posts, and notes.
 */

import { reportAgentEvent } from './agent-experience';
import {
  buildSearchEmptyEvent,
  buildSearchErrorEvent,
  buildSearchOpenEvent,
  buildSearchSelectEvent,
  resolveSearchResultType,
  type SearchTrigger,
} from '../utils/agentExperienceMetrics';
import {
  rankCommandPaletteItems,
  readRecentSearches,
  saveRecentSearch,
  type CommandPaletteSearchItem as SearchItem,
} from '../utils/commandPaletteSearch';

const SEARCH_INDEX_URL = '/search-index.json';

const TYPE_LABELS: Record<string, string> = {
  recent: 'Recent searches',
  page: 'Pages',
  writing: 'Writing',
  note: 'Notes',
};

const TYPE_ORDER = ['page', 'writing', 'note'];

let searchIndexCache: SearchItem[] | null = null;
let searchIndexPromise: Promise<SearchItem[]> | null = null;

/** Prefer bare arrays; tolerate a transitional `{ items }` envelope. */
function normalizeSearchIndexPayload(payload: unknown): SearchItem[] {
  if (Array.isArray(payload)) {
    return payload as SearchItem[];
  }
  if (
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as { items?: unknown }).items)
  ) {
    return (payload as { items: SearchItem[] }).items;
  }
  throw new Error('Invalid search index payload');
}

function loadSearchIndex(): Promise<SearchItem[]> {
  if (searchIndexCache) return Promise.resolve(searchIndexCache);
  if (!searchIndexPromise) {
    searchIndexPromise = fetch(SEARCH_INDEX_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load search index (${response.status})`);
        }
        return response.json();
      })
      .then((payload) => {
        const index = normalizeSearchIndexPayload(payload);
        searchIndexCache = index;
        return index;
      })
      .catch((error) => {
        searchIndexPromise = null;
        throw error;
      });
  }
  return searchIndexPromise;
}

function appendHighlightedText(parent: HTMLElement, text: string, query: string) {
  if (!query) {
    parent.textContent = text;
    return;
  }

  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) {
    parent.textContent = text;
    return;
  }

  parent.append(
    text.slice(0, idx),
    Object.assign(document.createElement('mark'), {
      className: 'cmd-palette-highlight',
      textContent: text.slice(idx, idx + query.length),
    }),
    text.slice(idx + query.length),
  );
}

function createResultItem(item: SearchItem, resultIndex: number, query = '') {
  const link = document.createElement('a');
  link.href = item.path;
  link.id = `cmd-palette-opt-${resultIndex}`;
  link.className = `cmd-palette-item cmd-palette-item--${item.type}`;
  link.role = 'option';
  link.ariaSelected = 'false';
  link.dataset.path = item.path;
  link.dataset.type = item.type;
  link.style.setProperty('--cmd-palette-stagger', `${resultIndex * 0.02}s`);

  const main = document.createElement('span');
  main.className = 'cmd-palette-item__main';

  const title = document.createElement('span');
  title.className = 'cmd-palette-item__title';
  appendHighlightedText(title, item.title, query);
  main.append(title);

  if (item.description && item.type !== 'page') {
    const desc = document.createElement('span');
    desc.className = 'cmd-palette-item__desc';
    desc.textContent = item.description;
    main.append(desc);
  }

  link.append(main);
  return link;
}

function createGroupLabel(type: string, count: number) {
  const label = document.createElement('div');
  label.className = 'cmd-group-label';
  label.append(TYPE_LABELS[type], ' ');

  const countEl = document.createElement('span');
  countEl.className = 'cmd-group-count';
  countEl.textContent = `(${count})`;
  label.append(countEl);

  return label;
}

function createRecentSearchItem(query: string, resultIndex: number) {
  const button = document.createElement('button');
  button.type = 'button';
  button.id = `cmd-palette-opt-${resultIndex}`;
  button.className = 'cmd-palette-item cmd-palette-item--recent';
  button.role = 'option';
  button.ariaSelected = 'false';
  button.dataset.recentQuery = query;
  button.style.setProperty('--cmd-palette-stagger', `${resultIndex * 0.02}s`);

  const main = document.createElement('span');
  main.className = 'cmd-palette-item__main';

  const title = document.createElement('span');
  title.className = 'cmd-palette-item__title';
  title.textContent = query;

  const description = document.createElement('span');
  description.className = 'cmd-palette-item__desc';
  description.textContent = 'Search again';

  main.append(title, description);
  button.append(main);
  return button;
}

function createEmptyState(query: string) {
  const empty = document.createElement('div');
  empty.className = 'cmd-empty';

  const icon = document.createElement('span');
  icon.className = 'cmd-empty-icon';
  icon.textContent = '?';

  const text = document.createElement('span');
  text.className = 'cmd-empty-text';
  text.textContent = `No results for "${query}"`;

  const hint = document.createElement('span');
  hint.className = 'cmd-empty-hint';
  hint.textContent = 'Try a different search term';

  empty.append(icon, text, hint);
  return empty;
}

function createLoadingState() {
  const loading = document.createElement('div');
  loading.className = 'cmd-empty';

  const text = document.createElement('span');
  text.className = 'cmd-empty-text';
  text.textContent = 'Loading search index…';

  loading.append(text);
  return loading;
}

function createErrorState(message: string) {
  const error = document.createElement('div');
  error.className = 'cmd-empty';

  const text = document.createElement('span');
  text.className = 'cmd-empty-text';
  text.textContent = message;

  const hint = document.createElement('span');
  hint.className = 'cmd-empty-hint';
  hint.textContent = 'Check your connection and try again';

  error.append(text, hint);
  return error;
}

// Track cleanup function to tear down before reinitializing
let _cleanup: (() => void) | null = null;

export function initCommandPalette() {
  // Clean up previous instance (handles view transitions)
  if (_cleanup) {
    _cleanup();
    _cleanup = null;
  }

  const nav = document.querySelector<HTMLElement>('.site-nav');
  const input = document.getElementById('cmdPaletteInput') as HTMLInputElement | null;
  const results = document.getElementById('cmdPaletteResults');
  const footer = document.getElementById('cmdPaletteFooter');
  const desktopNav = document.querySelector<HTMLElement>('.desktop-nav');

  const liveRegion = document.getElementById('cmdPaletteLive');

  if (!nav || !input || !results || !desktopNav) return;

  let activeIndex = -1;
  let triggerElement: HTMLElement | null = null;
  let searchIndex: SearchItem[] = [];
  let indexLoadId = 0;
  let reportedEmptyForOpen = false;

  async function ensureSearchIndex() {
    const loadId = ++indexLoadId;
    results!.replaceChildren(createLoadingState());
    showResults();

    try {
      searchIndex = await loadSearchIndex();
      if (loadId !== indexLoadId) return false;
      return true;
    } catch {
      if (loadId !== indexLoadId) return false;
      results!.replaceChildren(createErrorState('Search is temporarily unavailable'));
      if (liveRegion) liveRegion.textContent = 'Search index failed to load';
      reportAgentEvent(buildSearchErrorEvent());
      return false;
    }
  }

  // --- Core actions ---

  async function open(trigger: SearchTrigger = 'unknown') {
    // Remember what triggered the palette so we can restore focus on close
    triggerElement = document.activeElement as HTMLElement | null;
    nav!.classList.add('cmd-palette-active');
    input!.value = '';
    input!.setAttribute('aria-expanded', 'true');
    reportedEmptyForOpen = false;
    reportAgentEvent(buildSearchOpenEvent(trigger));

    const ready = searchIndex.length > 0 || await ensureSearchIndex();
    if (!ready) return;

    render('');
    requestAnimationFrame(() => {
      input!.focus();
      activeIndex = 0;
      highlightActive();
    });
  }

  // Expose open/close globally so the mobile menu can trigger the palette
  (window as any).__cmdPaletteOpen = open;
  (window as any).__cmdPaletteClose = close;

  function close() {
    indexLoadId++;
    nav!.classList.remove('cmd-palette-active', 'cmd-palette-has-results');
    input!.value = '';
    input!.setAttribute('aria-expanded', 'false');
    input!.removeAttribute('aria-activedescendant');
    results!.innerHTML = '';
    results!.classList.remove('has-results');
    footer?.classList.remove('visible');
    activeIndex = -1;
    input!.blur();
    // Avoid a loud focus ring on nav chrome after closing the palette
    const shouldRestoreFocus =
      triggerElement &&
      typeof triggerElement.focus === 'function' &&
      !triggerElement.closest('.site-nav');
    if (shouldRestoreFocus) {
      triggerElement!.focus({ preventScroll: true });
    }
    triggerElement = null;
  }

  function reportSelectFromElement(el: Element | null) {
    const resultType = resolveSearchResultType(
      el instanceof HTMLElement ? el.dataset.type : null,
    );
    if (resultType) {
      reportAgentEvent(buildSearchSelectEvent(resultType));
    }
  }

  function navigate(path: string, el?: Element | null) {
    saveRecentSearch(input!.value);
    reportSelectFromElement(el ?? null);
    close();
    window.location.href = path;
  }

  function runRecentSearch(query: string) {
    input!.value = query;
    render(query);
    input!.focus();
  }

  // --- Rendering ---

  function render(query: string) {
    const q = query.trim();
    let resultIndex = 0;

    if (!q) {
      const pages = searchIndex.filter(i => i.type === 'page');
      const recentSearches = readRecentSearches();
      const rendered: HTMLElement[] = [];

      if (recentSearches.length > 0) {
        rendered.push(createGroupLabel('recent', recentSearches.length));
        recentSearches.forEach((recentQuery) => {
          rendered.push(createRecentSearchItem(recentQuery, resultIndex++));
        });
      }

      rendered.push(createGroupLabel('page', pages.length));
      pages.forEach((item) => {
        rendered.push(createResultItem(item, resultIndex++));
      });

      results!.replaceChildren(...rendered);
      if (liveRegion) {
        liveRegion.textContent = recentSearches.length > 0
          ? `${recentSearches.length} recent searches and ${pages.length} pages`
          : `${pages.length} pages`;
      }
      showResults();
      return;
    }

    const matches = rankCommandPaletteItems(q, searchIndex);

    if (matches.length === 0) {
      results!.replaceChildren(createEmptyState(q));
      if (liveRegion) liveRegion.textContent = `No results for ${q}`;
      // One empty outcome per palette open — never include the query string.
      if (!reportedEmptyForOpen) {
        reportedEmptyForOpen = true;
        reportAgentEvent(buildSearchEmptyEvent());
      }
      showResults();
      return;
    }

    // Group by type
    const groups: Record<string, typeof matches> = {};
    matches.forEach(item => {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
    });

    const rendered: HTMLElement[] = [];
    TYPE_ORDER.forEach(type => {
      if (!groups[type]) return;
      rendered.push(createGroupLabel(type, groups[type].length));
      groups[type].forEach(item => {
        rendered.push(createResultItem(item, resultIndex++, q));
      });
    });

    results!.replaceChildren(...rendered);
    if (liveRegion) liveRegion.textContent = `${matches.length} result${matches.length === 1 ? '' : 's'} found`;
    showResults();
  }

  function showResults() {
    results!.classList.add('has-results');
    nav!.classList.add('cmd-palette-has-results');
    footer?.classList.add('visible');
    activeIndex = 0;
    highlightActive();
  }

  function highlightActive() {
    const items = results!.querySelectorAll('.cmd-palette-item');
    items.forEach((el, i) => {
      const on = activeIndex >= 0 && i === activeIndex;
      el.classList.toggle('is-highlighted', on);
      el.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (activeIndex >= 0 && items[activeIndex]) {
      const active = items[activeIndex] as HTMLElement;
      if (active.id) input!.setAttribute('aria-activedescendant', active.id);
      active.scrollIntoView({ block: 'nearest' });
    } else {
      input!.removeAttribute('aria-activedescendant');
    }
  }

  // --- Event handlers ---

  // Click nav background or ⌘K hint to open (desktop only)
  function handleNavClick(e: MouseEvent) {
    if (nav!.classList.contains('cmd-palette-active')) return;
    if (window.innerWidth <= 768) return;
    const target = e.target as HTMLElement;
    // ⌘K hint always opens palette
    if (target.closest('.cmd-k-hint')) {
      e.preventDefault();
      void open('click');
      return;
    }
    if (target.closest('a') || target.closest('button')) return;
    void open('click');
  }

  function handleDesktopNavClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('.cmd-k-hint')) {
      e.preventDefault();
      void open('click');
      return;
    }
    if (target.closest('a')) return;
    e.preventDefault();
    void open('click');
  }

  // Input typing
  function handleInput() {
    if (!searchIndex.length) return;
    render(input!.value);
  }

  // Keyboard navigation in input
  function handleInputKeydown(e: KeyboardEvent) {
    const items = results!.querySelectorAll('.cmd-palette-item');
    const count = items.length;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'ArrowDown':
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, count - 1);
        highlightActive();
        break;
      case 'ArrowUp':
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, -1);
        highlightActive();
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && items[activeIndex]) {
          const activeItem = items[activeIndex] as HTMLElement;
          const recentQuery = activeItem.dataset.recentQuery;
          const path = activeItem.dataset.path;
          if (recentQuery) {
            runRecentSearch(recentQuery);
          } else if (path) {
            navigate(path, activeItem);
          }
        } else if (items.length > 0) {
          const firstItem = items[0] as HTMLElement;
          const recentQuery = firstItem.dataset.recentQuery;
          const path = firstItem.dataset.path;
          if (recentQuery) {
            runRecentSearch(recentQuery);
          } else if (path) {
            navigate(path, firstItem);
          }
        }
        break;
      case 'Tab':
        // Trap focus within the palette — keep focus on input
        e.preventDefault();
        break;
    }
  }

  // Click a result
  function handleResultClick(e: MouseEvent) {
    const item = (e.target as HTMLElement).closest('.cmd-palette-item');
    if (item) {
      const recentQuery = (item as HTMLElement).dataset.recentQuery;
      if (recentQuery) {
        e.preventDefault();
        runRecentSearch(recentQuery);
        return;
      }
      saveRecentSearch(input!.value);
      reportSelectFromElement(item);
      close();
    }
  }

  // Click outside to close
  function handleDocumentClick(e: MouseEvent) {
    const openTrigger = (e.target as HTMLElement).closest('[data-open-command-palette]');
    if (openTrigger && !nav!.classList.contains('cmd-palette-active')) {
      e.preventDefault();
      void open('click');
      return;
    }
    if (!nav!.contains(e.target as Node) && nav!.classList.contains('cmd-palette-active')) {
      close();
    }
  }

  // Global shortcuts (⌘K, arrow forwarding)
  function handleGlobalKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (nav!.classList.contains('cmd-palette-active')) {
        close();
      } else {
        void open('keyboard');
      }
      return;
    }

    // Forward navigation keys when palette is open but input lost focus
    if (nav!.classList.contains('cmd-palette-active') && document.activeElement !== input) {
      if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
        e.preventDefault();
        input!.focus();
        handleInputKeydown(e);
      }
    }
  }

  // --- Bind events ---
  nav.addEventListener('click', handleNavClick);
  desktopNav.addEventListener('click', handleDesktopNavClick as EventListener);
  input.addEventListener('input', handleInput);
  input.addEventListener('keydown', handleInputKeydown);
  results.addEventListener('click', handleResultClick as EventListener);
  document.addEventListener('click', handleDocumentClick as EventListener);
  document.addEventListener('keydown', handleGlobalKeydown);

  // --- Cleanup function for teardown ---
  _cleanup = () => {
    nav.removeEventListener('click', handleNavClick);
    desktopNav.removeEventListener('click', handleDesktopNavClick as EventListener);
    input.removeEventListener('input', handleInput);
    input.removeEventListener('keydown', handleInputKeydown);
    results.removeEventListener('click', handleResultClick as EventListener);
    document.removeEventListener('click', handleDocumentClick as EventListener);
    document.removeEventListener('keydown', handleGlobalKeydown);
  };
}
