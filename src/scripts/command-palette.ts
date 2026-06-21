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
  link.style.setProperty('--cmd-palette-stagger', `${resultIndex * 0.02}s`);

  const main = document.createElement('span');
  main.className = 'cmd-palette-item__main';

  const title = document.createElement('span');
  title.className = 'cmd-palette-item__title';
  appendHighlightedText(title, item.title, query);
  main.append(title);

  if (item.description) {
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

// Track cleanup function to tear down before reinitializing
let _cleanup: (() => void) | null = null;

export function initCommandPalette(searchIndex: SearchItem[]) {
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

  // --- Core actions ---

  function open() {
    // Remember what triggered the palette so we can restore focus on close
    triggerElement = document.activeElement as HTMLElement | null;
    nav!.classList.add('cmd-palette-active');
    input!.value = '';
    input!.setAttribute('aria-expanded', 'true');
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
    nav!.classList.remove('cmd-palette-active', 'cmd-palette-has-results');
    input!.value = '';
    input!.setAttribute('aria-expanded', 'false');
    input!.removeAttribute('aria-activedescendant');
    results!.innerHTML = '';
    results!.classList.remove('has-results');
    footer?.classList.remove('visible');
    activeIndex = -1;
    // Restore focus to the element that opened the palette
    if (triggerElement && typeof triggerElement.focus === 'function') {
      triggerElement.focus();
      triggerElement = null;
    }
  }

  function navigate(path: string) {
    close();
    window.location.href = path;
  }

  // --- Rendering ---

  function render(query: string) {
    const q = query.trim();
    let resultIndex = 0;

    if (!q) {
      const pages = searchIndex.filter(i => i.type === 'page');
      results!.replaceChildren(...pages.map(item => createResultItem(item, resultIndex++)));
      if (liveRegion) liveRegion.textContent = `${pages.length} pages`;
      showResults();
      return;
    }

    const matches = searchIndex
      .map(item => ({ ...item, score: scoreMatch(q, item) }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    if (matches.length === 0) {
      results!.replaceChildren(createEmptyState(q));
      if (liveRegion) liveRegion.textContent = `No results for ${q}`;
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
          navigate(items[activeIndex].getAttribute('data-path')!);
        } else if (items.length > 0) {
          navigate(items[0].getAttribute('data-path')!);
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
    if ((e.target as HTMLElement).closest('.cmd-palette-item')) {
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
