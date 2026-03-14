/**
 * Command Palette
 *
 * Transforms the navigation bar into a searchable command palette.
 * Activated by clicking the nav, pressing ⌘K, or Ctrl+K.
 * Searches across pages, writing posts, and notes.
 */

interface SearchItem {
  title: string;
  description: string;
  path: string;
  type: 'page' | 'writing' | 'note';
}

const TYPE_LABELS: Record<string, string> = {
  page: 'Pages',
  writing: 'Writing',
  note: 'Notes',
};

const TYPE_ORDER = ['page', 'writing', 'note'];

function fuzzyMatch(query: string, text: string): boolean {
  if (!text) return false;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

function scoreMatch(query: string, item: SearchItem): number {
  const q = query.toLowerCase();
  const title = item.title.toLowerCase();
  const desc = (item.description || '').toLowerCase();
  if (title.startsWith(q)) return 100;
  if (title.includes(q)) return 80;
  if (desc.includes(q)) return 50;
  if (fuzzyMatch(q, item.title)) return 30;
  if (fuzzyMatch(q, item.description)) return 10;
  return 0;
}

function highlightQuery(text: string, query: string): string {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return text.slice(0, idx)
    + '<mark class="cmd-highlight">'
    + text.slice(idx, idx + query.length)
    + '</mark>'
    + text.slice(idx + query.length);
}

// Track cleanup function to tear down before reinitializing
let _cleanup: (() => void) | null = null;

export function initCommandPalette(searchIndex: SearchItem[]) {
  // Clean up previous instance (handles view transitions)
  if (_cleanup) {
    _cleanup();
    _cleanup = null;
  }

  const nav = document.querySelector('nav');
  const input = document.getElementById('cmdPaletteInput') as HTMLInputElement | null;
  const results = document.getElementById('cmdPaletteResults');
  const footer = document.getElementById('cmdPaletteFooter');
  const desktopNav = document.querySelector('.desktop-nav');

  if (!nav || !input || !results || !desktopNav) return;

  let activeIndex = -1;

  // --- Core actions ---

  function open() {
    nav!.classList.add('cmd-palette-active');
    input!.value = '';
    render('');
    requestAnimationFrame(() => {
      input!.focus();
      activeIndex = 0;
      highlightActive();
    });
  }

  function close() {
    nav!.classList.remove('cmd-palette-active', 'cmd-palette-has-results');
    input!.value = '';
    results!.innerHTML = '';
    results!.classList.remove('has-results');
    footer?.classList.remove('visible');
    activeIndex = -1;
  }

  function navigate(path: string) {
    close();
    window.location.href = path;
  }

  // --- Rendering ---

  function render(query: string) {
    const q = query.trim();
    let resultIndex = 0;

    function resultHtml(item: SearchItem, type: string, title: string, desc?: string): string {
      const delay = resultIndex * 0.02;
      const descHtml = desc
        ? `<span class="cmd-result-desc">${desc}</span>`
        : '';
      const html = `<a href="${item.path}" class="cmd-result cmd-result--${type}" role="option" data-path="${item.path}" style="animation-delay:${delay}s">
        <span class="cmd-result-text">
          <span class="cmd-result-title">${title}</span>
          ${descHtml}
        </span>
      </a>`;
      resultIndex++;
      return html;
    }

    if (!q) {
      const pages = searchIndex.filter(i => i.type === 'page');
      results!.innerHTML = pages
        .map(item => resultHtml(item, 'page', item.title))
        .join('');
      showResults();
      return;
    }

    const matches = searchIndex
      .map(item => ({ ...item, score: scoreMatch(q, item) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    if (matches.length === 0) {
      results!.innerHTML = `<div class="cmd-empty">
        <span class="cmd-empty-icon">?</span>
        <span class="cmd-empty-text">No results for "${q}"</span>
        <span class="cmd-empty-hint">Try a different search term</span>
      </div>`;
      showResults();
      return;
    }

    // Group by type
    const groups: Record<string, typeof matches> = {};
    matches.forEach(item => {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
    });

    let html = '';
    TYPE_ORDER.forEach(type => {
      if (!groups[type]) return;
      html += `<div class="cmd-group-label">${TYPE_LABELS[type]} <span class="cmd-group-count">(${groups[type].length})</span></div>`;
      groups[type].forEach(item => {
        const title = highlightQuery(item.title, q);
        html += resultHtml(item, type, title, item.description || undefined);
      });
    });

    results!.innerHTML = html;
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
    const items = results!.querySelectorAll('.cmd-result');
    items.forEach((el, i) => el.classList.toggle('active', i === activeIndex));
    if (activeIndex >= 0 && items[activeIndex]) {
      items[activeIndex].scrollIntoView({ block: 'nearest' });
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
      open();
      return;
    }
    if (target.closest('a') || target.closest('button')) return;
    open();
  }

  function handleDesktopNavClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('.cmd-k-hint')) {
      e.preventDefault();
      open();
      return;
    }
    if (target.closest('a')) return;
    e.preventDefault();
    open();
  }

  // Input typing
  function handleInput() {
    render(input!.value);
  }

  // Keyboard navigation in input
  function handleInputKeydown(e: KeyboardEvent) {
    const items = results!.querySelectorAll('.cmd-result');
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
          navigate(items[activeIndex].getAttribute('data-path')!);
        } else if (items.length > 0) {
          navigate(items[0].getAttribute('data-path')!);
        }
        break;
    }
  }

  // Click a result
  function handleResultClick(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('.cmd-result')) {
      close();
    }
  }

  // Click outside to close
  function handleDocumentClick(e: MouseEvent) {
    if (!nav!.contains(e.target as Node) && nav!.classList.contains('cmd-palette-active')) {
      close();
    }
  }

  // Global shortcuts (⌘K, arrow forwarding)
  function handleGlobalKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      nav!.classList.contains('cmd-palette-active') ? close() : open();
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
