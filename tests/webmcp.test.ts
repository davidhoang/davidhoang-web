import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  assistNewsletterSubscribe,
  executeNavigateSite,
  executeSearchSite,
  getModelContext,
  isValidEmail,
  isWebMcpAvailable,
  NEWSLETTER_FORM_SELECTOR,
  NEWSLETTER_SUBSCRIBE_PATH,
  registerWebMcpTools,
  resetSearchIndexCache,
  resolveIndexedPath,
  scoreSearchMatch,
  searchSiteContent,
  type SearchIndexItem,
} from '../src/utils/webmcp';

const INDEX: SearchIndexItem[] = [
  { title: 'About', description: 'Bio and background', path: '/about', type: 'page' },
  { title: 'Subscribe', description: 'Subscribe to updates', path: '/subscribe', type: 'page' },
  {
    title: 'The formlessness of AI agents',
    description: 'Finding the right vessel for new capabilities',
    path: '/writing/the-formlessness-of-ai-agents',
    type: 'writing',
  },
  {
    title: 'Dynamic interfaces',
    description: 'Notes on generative UI',
    path: '/notes/dynamic-interfaces',
    type: 'note',
  },
];

function mockModelContext() {
  const registerTool = vi.fn(async () => undefined);
  const ctx = {
    registerTool,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as WebMcpModelContext;
  return { ctx, registerTool };
}

describe('WebMCP feature detection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when modelContext is missing', () => {
    const doc = {} as Document;
    const nav = {} as Navigator;
    expect(getModelContext(doc, nav)).toBeNull();
    expect(isWebMcpAvailable(doc, nav)).toBe(false);
  });

  it('prefers document.modelContext over navigator', () => {
    const { ctx: docCtx } = mockModelContext();
    const { ctx: navCtx } = mockModelContext();
    const doc = { modelContext: docCtx } as Document;
    const nav = { modelContext: navCtx } as Navigator;
    expect(getModelContext(doc, nav)).toBe(docCtx);
  });

  it('falls back to navigator.modelContext', () => {
    const { ctx } = mockModelContext();
    const doc = {} as Document;
    const nav = { modelContext: ctx } as Navigator;
    expect(getModelContext(doc, nav)).toBe(ctx);
  });

  it('rejects objects without registerTool', () => {
    const doc = { modelContext: {} } as Document;
    expect(getModelContext(doc, {} as Navigator)).toBeNull();
  });
});

describe('search index helpers', () => {
  it('scores exact title prefix higher than fuzzy matches', () => {
    const writing = INDEX[2];
    expect(scoreSearchMatch('formless', writing)).toBeGreaterThan(
      scoreSearchMatch('xyz', writing),
    );
    expect(scoreSearchMatch('formlessness', writing)).toBeGreaterThanOrEqual(80);
  });

  it('returns page listings for empty query and ranked matches otherwise', () => {
    expect(searchSiteContent('', INDEX).every((i) => i.type === 'page')).toBe(true);
    const hits = searchSiteContent('agents', INDEX, 5);
    expect(hits[0]?.path).toBe('/writing/the-formlessness-of-ai-agents');
  });

  it('resolves only indexed same-origin paths', () => {
    expect(resolveIndexedPath('/about', INDEX)).toMatchObject({ ok: true, path: '/about' });
    expect(resolveIndexedPath('https://evil.example/', INDEX).ok).toBe(false);
    expect(resolveIndexedPath('/not-a-real-path', INDEX).ok).toBe(false);
    expect(resolveIndexedPath('../etc/passwd', INDEX).ok).toBe(false);
  });
});

describe('tool executors', () => {
  afterEach(() => {
    resetSearchIndexCache();
    vi.unstubAllGlobals();
  });

  it('executeSearchSite returns clear errors and results', async () => {
    const missing = await executeSearchSite({});
    expect(missing.ok).toBe(false);
    expect(missing.error).toMatch(/query/i);

    const result = await executeSearchSite(
      { query: 'subscribe', limit: 3 },
      async () => INDEX,
    );
    expect(result.ok).toBe(true);
    expect(result.count).toBeGreaterThan(0);
    expect((result.results as SearchIndexItem[])[0]?.path).toBe('/subscribe');
  });

  it('executeNavigateSite navigates indexed paths only', async () => {
    const navigate = vi.fn();
    const bad = await executeNavigateSite(
      { path: '/nope' },
      { loadIndex: async () => INDEX, navigate },
    );
    expect(bad.ok).toBe(false);
    expect(navigate).not.toHaveBeenCalled();

    const good = await executeNavigateSite(
      { path: '/notes/dynamic-interfaces' },
      { loadIndex: async () => INDEX, navigate },
    );
    expect(good.ok).toBe(true);
    expect(navigate).toHaveBeenCalledWith('/notes/dynamic-interfaces');
  });
});

describe('newsletter assist safety', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function mockSignupForm(options?: { includeSubmit?: boolean }) {
    const email = {
      type: 'email',
      name: 'email',
      value: '',
      focus: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    const button = { type: 'submit' };
    const form = {
      querySelector: (sel: string) => {
        if (sel.includes('input[type="email"]')) return email;
        if (sel.includes('button[type="submit"]')) {
          return options?.includeSubmit === false ? null : button;
        }
        return null;
      },
      scrollIntoView: vi.fn(),
    };
    const liveNodes: Array<{ id: string; textContent: string; setAttribute: ReturnType<typeof vi.fn> }> =
      [];
    const doc = {
      querySelector: (sel: string) => (sel === NEWSLETTER_FORM_SELECTOR ? form : null),
      getElementById: (id: string) => liveNodes.find((n) => n.id === id) ?? null,
      createElement: (tag: string) => {
        const el = {
          id: '',
          className: '',
          textContent: '',
          tagName: tag.toUpperCase(),
          setAttribute: vi.fn(),
        };
        liveNodes.push(el);
        return el;
      },
      body: { appendChild: vi.fn() },
    } as unknown as Document;
    return { doc, form, email };
  }

  it('validates email shape', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
  });

  it('never submits; fills and focuses the existing form', () => {
    const { doc, form, email } = mockSignupForm();
    vi.stubGlobal('window', { setTimeout: (fn: () => void) => fn() });

    const result = assistNewsletterSubscribe({ email: 'reader@example.com' }, { doc });
    expect(result.ok).toBe(true);
    expect(result.submitted).toBe(false);
    expect(email.value).toBe('reader@example.com');
    expect(email.focus).toHaveBeenCalled();
    expect(form.scrollIntoView).toHaveBeenCalled();
    expect(result.message).toMatch(/human|Subscribe|submitted/i);
  });

  it('opens /subscribe when the form is missing and does not claim submission', () => {
    const navigate = vi.fn();
    const doc = {
      querySelector: () => null,
      getElementById: () => null,
      createElement: () => ({ setAttribute: vi.fn(), textContent: '' }),
      body: { appendChild: vi.fn() },
    } as unknown as Document;

    const result = assistNewsletterSubscribe(
      { email: 'reader@example.com' },
      { doc, navigate, currentPath: '/about' },
    );
    expect(navigate).toHaveBeenCalledWith(NEWSLETTER_SUBSCRIBE_PATH);
    expect(result.submitted).toBe(false);
    expect(result.ok).toBe(true);
    expect(result.message).toMatch(/never submits/i);
  });

  it('rejects invalid email without writing the field', () => {
    const { doc, email } = mockSignupForm();
    const result = assistNewsletterSubscribe({ email: 'nope' }, { doc });
    expect(result.ok).toBe(false);
    expect(email.value).toBe('');
    expect(result.submitted).toBe(false);
  });
});

describe('registerWebMcpTools', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('no-ops when WebMCP is unavailable', async () => {
    const doc = {} as Document;
    await expect(registerWebMcpTools({ doc })).resolves.toBe(false);
  });

  it('registers search, navigate, and newsletter tools with AbortSignal', async () => {
    const { ctx, registerTool } = mockModelContext();
    const doc = { modelContext: ctx } as Document;
    const controller = new AbortController();

    const ok = await registerWebMcpTools({
      doc,
      signal: controller.signal,
      loadIndex: async () => INDEX,
      navigate: vi.fn(),
    });

    expect(ok).toBe(true);
    expect(registerTool).toHaveBeenCalledTimes(3);
    const names = registerTool.mock.calls.map((call) => call[0].name);
    expect(names).toEqual([
      'search_site',
      'navigate_site',
      'assist_newsletter_subscribe',
    ]);
    expect(registerTool.mock.calls[0][1]).toEqual({ signal: controller.signal });
    expect(registerTool.mock.calls[0][0].annotations?.readOnlyHint).toBe(true);
    expect(registerTool.mock.calls[2][0].annotations?.readOnlyHint).toBe(false);
  });

  it('skips registration when the signal is already aborted', async () => {
    const { ctx, registerTool } = mockModelContext();
    const doc = { modelContext: ctx } as Document;
    const controller = new AbortController();
    controller.abort();
    await expect(
      registerWebMcpTools({ doc, signal: controller.signal }),
    ).resolves.toBe(false);
    expect(registerTool).not.toHaveBeenCalled();
  });
});
