/**
 * Progressive experimental WebMCP helpers for davidhoang.com.
 *
 * No polyfill / npm dependency — feature-detects document.modelContext
 * (with navigator.modelContext fallback) and no-ops when unavailable.
 */

export const SEARCH_INDEX_URL = '/search-index.json';
export const NEWSLETTER_SUBSCRIBE_PATH = '/subscribe';
export const NEWSLETTER_FORM_SELECTOR = 'form[data-substack-signup]';

export type SearchIndexItem = {
  title: string;
  description: string;
  path: string;
  type: 'page' | 'writing' | 'note' | string;
};

export type WebMcpToolResult = {
  ok: boolean;
  error?: string;
  message?: string;
  [key: string]: unknown;
};

export type RegisterWebMcpToolsOptions = {
  /** Override fetch of /search-index.json (tests). */
  loadIndex?: () => Promise<SearchIndexItem[]>;
  /** Override navigation (tests / custom routers). */
  navigate?: (path: string) => void;
  /** Document used for form assist + modelContext lookup. */
  doc?: Document;
  /** AbortSignal for registration lifecycle. */
  signal?: AbortSignal;
};

const DEFAULT_SEARCH_LIMIT = 8;
const MAX_SEARCH_LIMIT = 25;

let searchIndexCache: SearchIndexItem[] | null = null;
let searchIndexPromise: Promise<SearchIndexItem[]> | null = null;

function resolveDocument(doc?: Document): Document | undefined {
  if (doc) return doc;
  return typeof document !== 'undefined' ? document : undefined;
}

function resolveNavigator(nav?: Navigator): Navigator | undefined {
  if (nav) return nav;
  return typeof navigator !== 'undefined' ? navigator : undefined;
}

/** Feature-detect the current browser WebMCP surface without throwing. */
export function getModelContext(
  doc?: Document,
  nav?: Navigator,
): WebMcpModelContext | null {
  try {
    const documentRef = resolveDocument(doc);
    const navigatorRef = resolveNavigator(nav);
    const fromDocument = documentRef
      ? (documentRef as Document & { modelContext?: WebMcpModelContext }).modelContext
      : undefined;
    const fromNavigator = navigatorRef
      ? (navigatorRef as Navigator & { modelContext?: WebMcpModelContext }).modelContext
      : undefined;
    const ctx = fromDocument ?? fromNavigator ?? null;
    if (!ctx || typeof ctx.registerTool !== 'function') return null;
    return ctx;
  } catch {
    return null;
  }
}

export function isWebMcpAvailable(doc?: Document, nav?: Navigator): boolean {
  return getModelContext(doc, nav) !== null;
}

export function resetSearchIndexCache(): void {
  searchIndexCache = null;
  searchIndexPromise = null;
}

export async function loadSearchIndex(
  fetchImpl: typeof fetch = fetch,
): Promise<SearchIndexItem[]> {
  if (searchIndexCache) return searchIndexCache;
  if (!searchIndexPromise) {
    searchIndexPromise = fetchImpl(SEARCH_INDEX_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load search index (${response.status})`);
        }
        const data = (await response.json()) as unknown;
        if (!Array.isArray(data)) {
          throw new Error('Search index response was not an array');
        }
        searchIndexCache = data as SearchIndexItem[];
        return searchIndexCache;
      })
      .catch((error) => {
        searchIndexPromise = null;
        throw error;
      });
  }
  return searchIndexPromise;
}

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

export function scoreSearchMatch(query: string, item: SearchIndexItem): number {
  const q = query.toLowerCase();
  const title = (item.title || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();
  const path = (item.path || '').toLowerCase();
  if (title.startsWith(q)) return 100;
  if (path === q || path === `/${q}`) return 95;
  if (title.includes(q)) return 80;
  if (path.includes(q)) return 60;
  if (desc.includes(q)) return 50;
  if (fuzzyMatch(q, item.title)) return 30;
  if (fuzzyMatch(q, item.description)) return 10;
  return 0;
}

export function searchSiteContent(
  query: string,
  index: SearchIndexItem[],
  limit = DEFAULT_SEARCH_LIMIT,
): SearchIndexItem[] {
  const q = query.trim();
  const capped = Math.min(Math.max(1, limit | 0), MAX_SEARCH_LIMIT);
  if (!q) {
    return index.filter((item) => item.type === 'page').slice(0, capped);
  }
  return index
    .map((item) => ({ item, score: scoreSearchMatch(q, item) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, capped)
    .map(({ item }) => item);
}

/** Allow only same-origin relative site paths that appear in the search index. */
export function resolveIndexedPath(
  path: string,
  index: SearchIndexItem[],
): { ok: true; path: string; item: SearchIndexItem } | { ok: false; error: string } {
  if (typeof path !== 'string' || !path.trim()) {
    return { ok: false, error: 'Path is required.' };
  }
  let normalized = path.trim();
  try {
    if (/^[a-z][a-z0-9+.-]*:/i.test(normalized)) {
      return { ok: false, error: 'Only same-origin site paths are allowed (e.g. /writing/…).' };
    }
    if (!normalized.startsWith('/')) {
      normalized = `/${normalized}`;
    }
    const url = new URL(normalized, 'https://davidhoang.com');
    normalized = url.pathname;
  } catch {
    return { ok: false, error: 'Path could not be parsed.' };
  }

  if (normalized.includes('..') || normalized.includes('//')) {
    return { ok: false, error: 'Invalid path.' };
  }

  const item = index.find((entry) => entry.path === normalized);
  if (!item) {
    return {
      ok: false,
      error: `Path is not in the site search index: ${normalized}. Use search_site to find a valid path.`,
    };
  }
  return { ok: true, path: normalized, item };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export type NewsletterAssistDeps = {
  doc?: Document;
  navigate?: (path: string) => void;
  currentPath?: string;
};

/**
 * Assist newsletter signup via the existing accessible Substack form UI.
 * Never submits the form — the human must confirm / click Subscribe.
 */
export function assistNewsletterSubscribe(
  input: { email?: unknown },
  deps: NewsletterAssistDeps = {},
): WebMcpToolResult {
  const doc = deps.doc ?? document;
  const form = doc.querySelector<HTMLFormElement>(NEWSLETTER_FORM_SELECTOR);

  if (!form) {
    const current =
      deps.currentPath ??
      (typeof window !== 'undefined' ? window.location.pathname : '');
    if (current !== NEWSLETTER_SUBSCRIBE_PATH) {
      const navigate =
        deps.navigate ??
        ((path: string) => {
          window.location.assign(path);
        });
      navigate(NEWSLETTER_SUBSCRIBE_PATH);
      return {
        ok: true,
        navigated: true,
        path: NEWSLETTER_SUBSCRIBE_PATH,
        submitted: false,
        message:
          'Opened the Subscribe page. After it loads, call assist_newsletter_subscribe again to fill the form. The human must click Subscribe — this tool never submits.',
      };
    }
    return {
      ok: false,
      submitted: false,
      error:
        'Newsletter signup form was not found on this page. Open /subscribe and try again.',
    };
  }

  const emailInput = form.querySelector<HTMLInputElement>('input[type="email"][name="email"]');
  if (!emailInput) {
    return {
      ok: false,
      submitted: false,
      error: 'Newsletter email field was not found. The form markup may have changed.',
    };
  }

  const rawEmail = typeof input.email === 'string' ? input.email.trim() : '';
  if (rawEmail) {
    if (!isValidEmail(rawEmail)) {
      return {
        ok: false,
        submitted: false,
        error: 'Email looks invalid. Ask the user for a valid address, then try again.',
      };
    }
    emailInput.value = rawEmail;
    try {
      const Ev = typeof Event === 'function' ? Event : null;
      if (Ev) {
        emailInput.dispatchEvent(new Ev('input', { bubbles: true }));
        emailInput.dispatchEvent(new Ev('change', { bubbles: true }));
      }
    } catch {
      // Non-DOM test environments may lack Event.
    }
  }

  try {
    form.scrollIntoView({ block: 'center', behavior: 'smooth' });
  } catch {
    form.scrollIntoView();
  }

  emailInput.focus({ preventScroll: true });

  const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  announceForAssistiveTech(
    doc,
    rawEmail
      ? 'Newsletter form ready. Review the email and press Subscribe to confirm.'
      : 'Newsletter form focused. Enter an email and press Subscribe to confirm.',
  );

  return {
    ok: true,
    submitted: false,
    filledEmail: Boolean(rawEmail),
    focused: true,
    path: NEWSLETTER_SUBSCRIBE_PATH,
    message: rawEmail
      ? 'Filled the newsletter email field and focused the existing signup form. Waiting for the human to press Subscribe — nothing was submitted.'
      : 'Focused the existing newsletter signup form. The human must enter an email and press Subscribe — nothing was submitted.',
    submitControl: submitButton ? 'present' : 'missing',
  };
}

function announceForAssistiveTech(doc: Document, message: string): void {
  const id = 'webmcp-assist-live';
  let live = doc.getElementById(id);
  if (!live) {
    live = doc.createElement('div');
    live.id = id;
    live.className = 'sr-only';
    live.setAttribute('role', 'status');
    live.setAttribute('aria-live', 'polite');
    live.setAttribute('aria-atomic', 'true');
    doc.body.appendChild(live);
  }
  live.textContent = '';
  const schedule =
    typeof globalThis.setTimeout === 'function'
      ? globalThis.setTimeout
      : (fn: () => void) => {
          fn();
          return 0 as unknown as ReturnType<typeof setTimeout>;
        };
  schedule(() => {
    live!.textContent = message;
  }, 0);
}

export async function executeSearchSite(
  input: Record<string, unknown>,
  loadIndex: () => Promise<SearchIndexItem[]> = loadSearchIndex,
): Promise<WebMcpToolResult> {
  const query = typeof input.query === 'string' ? input.query : '';
  if (!query.trim()) {
    return {
      ok: false,
      error: 'query is required (non-empty string).',
    };
  }
  const limit =
    typeof input.limit === 'number' && Number.isFinite(input.limit)
      ? input.limit
      : DEFAULT_SEARCH_LIMIT;

  try {
    const index = await loadIndex();
    const results = searchSiteContent(query, index, limit);
    return {
      ok: true,
      query: query.trim(),
      count: results.length,
      results: results.map(({ title, description, path, type }) => ({
        title,
        description,
        path,
        type,
      })),
      message:
        results.length === 0
          ? `No matches for “${query.trim()}”.`
          : `Found ${results.length} match${results.length === 1 ? '' : 'es'}.`,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Search index failed to load. Try again later.',
    };
  }
}

export async function executeNavigateSite(
  input: Record<string, unknown>,
  options: {
    loadIndex?: () => Promise<SearchIndexItem[]>;
    navigate?: (path: string) => void;
  } = {},
): Promise<WebMcpToolResult> {
  const path = typeof input.path === 'string' ? input.path : '';
  const loadIndex = options.loadIndex ?? loadSearchIndex;
  const navigate =
    options.navigate ??
    ((target: string) => {
      window.location.assign(target);
    });

  try {
    const index = await loadIndex();
    const resolved = resolveIndexedPath(path, index);
    if (!resolved.ok) {
      return { ok: false, error: resolved.error };
    }
    navigate(resolved.path);
    return {
      ok: true,
      path: resolved.path,
      title: resolved.item.title,
      type: resolved.item.type,
      message: `Navigating to ${resolved.item.title} (${resolved.path}).`,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Could not navigate — search index unavailable.',
    };
  }
}

function toolContent(result: WebMcpToolResult): unknown {
  return {
    ...result,
    content: [
      {
        type: 'text',
        text: JSON.stringify(result),
      },
    ],
  };
}

/**
 * Register read-only search/navigation tools and newsletter assist.
 * Returns false when WebMCP is unavailable (progressive enhancement).
 */
export async function registerWebMcpTools(
  options: RegisterWebMcpToolsOptions = {},
): Promise<boolean> {
  const doc = options.doc ?? document;
  const ctx = getModelContext(doc);
  if (!ctx) return false;

  const loadIndex = options.loadIndex ?? (() => loadSearchIndex());
  const navigate =
    options.navigate ??
    ((path: string) => {
      window.location.assign(path);
    });
  const signal = options.signal;

  if (signal?.aborted) return false;

  const register = async (tool: WebMcpToolDefinition) => {
    try {
      await Promise.resolve(
        ctx.registerTool(tool, signal ? { signal } : undefined),
      );
    } catch (error) {
      console.warn('[webmcp] registerTool failed:', tool.name, error);
    }
  };

  await register({
    name: 'search_site',
    title: 'Search site',
    description:
      'Read-only search across davidhoang.com pages, writing, and notes using the public site search index. Returns titles, descriptions, paths, and types.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (title, description, or path keywords).',
        },
        limit: {
          type: 'integer',
          description: `Max results (1–${MAX_SEARCH_LIMIT}, default ${DEFAULT_SEARCH_LIMIT}).`,
          minimum: 1,
          maximum: MAX_SEARCH_LIMIT,
        },
      },
      required: ['query'],
    },
    annotations: { readOnlyHint: true },
    execute: async (input) => toolContent(await executeSearchSite(input, loadIndex)),
  });

  await register({
    name: 'navigate_site',
    title: 'Navigate site',
    description:
      'Navigate to a path that exists in the site search index (pages, writing, or notes). Use search_site first to discover valid paths.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Same-origin path from the search index, e.g. /writing/some-post.',
        },
      },
      required: ['path'],
    },
    annotations: { readOnlyHint: true },
    execute: async (input) =>
      toolContent(await executeNavigateSite(input, { loadIndex, navigate })),
  });

  await register({
    name: 'assist_newsletter_subscribe',
    title: 'Assist newsletter subscribe',
    description:
      'Help the user subscribe to the Proof of Concept newsletter using the existing on-page signup form. May open /subscribe and fill an email, but NEVER submits — the human must press Subscribe to confirm.',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description:
            'Optional email to place in the form. Submission still requires an explicit human click.',
        },
      },
    },
    annotations: { readOnlyHint: false },
    execute: async (input) =>
      toolContent(
        assistNewsletterSubscribe(input, {
          doc,
          navigate,
        }),
      ),
  });

  return true;
}
