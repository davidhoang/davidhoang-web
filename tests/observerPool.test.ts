import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ObserverPool, observerKey } from '../src/utils/observerPool';

type MockEntry = {
  target: Element;
  isIntersecting: boolean;
};

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  callback: IntersectionObserverCallback;
  options: IntersectionObserverInit;
  elements = new Set<Element>();

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    this.options = options ?? {};
    MockIntersectionObserver.instances.push(this);
  }

  observe(element: Element) {
    this.elements.add(element);
  }

  unobserve(element: Element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
  }

  trigger(target: Element, isIntersecting: boolean) {
    const entry = { target, isIntersecting } as IntersectionObserverEntry;
    this.callback([entry], this as unknown as IntersectionObserver);
  }
}

function el(id: string): Element {
  return { id } as unknown as Element;
}

describe('observerKey', () => {
  it('treats equivalent options as the same observer', () => {
    expect(observerKey({ rootMargin: '-80px', threshold: 0 })).toBe(
      observerKey({ rootMargin: '-80px' }),
    );
  });

  it('distinguishes rootMargin and threshold', () => {
    expect(observerKey({ rootMargin: '-80px' })).not.toBe(observerKey({ rootMargin: '-50px' }));
    expect(observerKey({ threshold: 0.1 })).not.toBe(observerKey({ threshold: 0 }));
  });
});

describe('ObserverPool', () => {
  let pool: ObserverPool;

  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    pool = new ObserverPool();
  });

  afterEach(() => {
    pool.reset();
    vi.unstubAllGlobals();
  });

  it('shares one IntersectionObserver for matching options', () => {
    const a = el('a');
    const b = el('b');
    pool.observe(a, () => {}, { rootMargin: '-80px', once: true });
    pool.observe(b, () => {}, { rootMargin: '-80px', once: true });

    expect(MockIntersectionObserver.instances).toHaveLength(1);
    expect(pool.stats()).toEqual({ observers: 1, elements: 2 });
  });

  it('creates a new observer when options differ', () => {
    pool.observe(el('a'), () => {}, { rootMargin: '-80px' });
    pool.observe(el('b'), () => {}, { threshold: 0.1, rootMargin: '50px' });

    expect(MockIntersectionObserver.instances).toHaveLength(2);
    expect(pool.stats().observers).toBe(2);
  });

  it('dispatches intersecting entries to the matching callback', () => {
    const target = el('grid');
    const seen: MockEntry[] = [];
    pool.observe(target, (entry) => {
      seen.push({ target: entry.target, isIntersecting: entry.isIntersecting });
    }, { rootMargin: '-80px' });

    MockIntersectionObserver.instances[0]!.trigger(target, true);
    expect(seen).toEqual([{ target, isIntersecting: true }]);
  });

  it('unobserves after the first intersecting entry when once is set', () => {
    const target = el('hero');
    const calls: boolean[] = [];
    pool.observe(
      target,
      (entry) => {
        calls.push(entry.isIntersecting);
      },
      { threshold: 0.1, once: true },
    );

    const io = MockIntersectionObserver.instances[0]!;
    io.trigger(target, true);
    expect(calls).toEqual([true]);
    expect(io.elements.has(target)).toBe(false);
    expect(pool.stats()).toEqual({ observers: 1, elements: 0 });

    const reuse = el('hero-2');
    pool.observe(reuse, () => {}, { threshold: 0.1, once: true });
    expect(MockIntersectionObserver.instances).toHaveLength(1);
    expect(pool.stats()).toEqual({ observers: 1, elements: 1 });
  });

  it('unsubscribe removes the watcher but keeps the pooled observer', () => {
    const target = el('section');
    const stop = pool.observe(target, () => {}, { rootMargin: '-50px' });
    expect(pool.stats().observers).toBe(1);
    stop();
    expect(pool.stats()).toEqual({ observers: 1, elements: 0 });
    expect(MockIntersectionObserver.instances[0]!.elements.has(target)).toBe(false);
  });

  it('keeps one observer when a second element is still watched', () => {
    const a = el('a');
    const b = el('b');
    const stopA = pool.observe(a, () => {}, { rootMargin: '-80px' });
    pool.observe(b, () => {}, { rootMargin: '-80px' });
    stopA();
    expect(pool.stats()).toEqual({ observers: 1, elements: 1 });
  });
});
