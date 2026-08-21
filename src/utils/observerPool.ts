/**
 * Shared IntersectionObserver pool for scroll-triggered UI.
 *
 * Components with the same observer options share one IntersectionObserver
 * instead of allocating one per React instance.
 */

export type ObserverCallback = (entry: IntersectionObserverEntry) => void;

export type SharedObserverOptions = IntersectionObserverInit & {
  /** Unobserve after the first intersecting entry. */
  once?: boolean;
};

type Watcher = {
  callback: ObserverCallback;
  once: boolean;
};

let rootSeq = 0;
const rootIds = new WeakMap<object, number>();

function rootKey(root: IntersectionObserverInit['root']): string {
  if (!root) return 'viewport';
  if (typeof document !== 'undefined' && root === document) return 'document';
  if (typeof Element !== 'undefined' && root instanceof Element) {
    let id = rootIds.get(root);
    if (id === undefined) {
      id = ++rootSeq;
      rootIds.set(root, id);
    }
    return `el:${id}`;
  }
  return 'other';
}

export function observerKey(options: IntersectionObserverInit = {}): string {
  const threshold = Array.isArray(options.threshold)
    ? options.threshold.join(',')
    : String(options.threshold ?? 0);
  return `${rootKey(options.root)}|${options.rootMargin ?? '0px'}|${threshold}`;
}

export type ObserverPoolStats = {
  observers: number;
  elements: number;
};

export class ObserverPool {
  private observers = new Map<string, IntersectionObserver>();
  private watchers = new Map<string, Map<Element, Set<Watcher>>>();

  observe(
    element: Element,
    callback: ObserverCallback,
    options: SharedObserverOptions = {},
  ): () => void {
    if (typeof IntersectionObserver === 'undefined') {
      callback({
        isIntersecting: true,
        target: element,
      } as IntersectionObserverEntry);
      return () => {};
    }

    const { once = false, ...ioOptions } = options;
    const key = observerKey(ioOptions);
    const watcher: Watcher = { callback, once };

    let byElement = this.watchers.get(key);
    if (!byElement) {
      byElement = new Map();
      this.watchers.set(key, byElement);
    }

    let set = byElement.get(element);
    if (!set) {
      set = new Set();
      byElement.set(element, set);
    }
    set.add(watcher);

    let observer = this.observers.get(key);
    if (!observer) {
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          this.dispatch(key, entry);
        }
      }, ioOptions);
      this.observers.set(key, observer);
    }

    observer.observe(element);

    return () => this.removeWatcher(key, element, watcher);
  }

  unobserve(element: Element): void {
    for (const key of [...this.watchers.keys()]) {
      const byElement = this.watchers.get(key);
      if (!byElement?.has(element)) continue;
      byElement.delete(element);
      this.observers.get(key)?.unobserve(element);
    }
  }

  stats(): ObserverPoolStats {
    let elements = 0;
    for (const byElement of this.watchers.values()) {
      elements += byElement.size;
    }
    return { observers: this.observers.size, elements };
  }

  reset(): void {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
    this.watchers.clear();
  }

  private dispatch(key: string, entry: IntersectionObserverEntry): void {
    const target = entry.target;
    const byElement = this.watchers.get(key);
    const set = byElement?.get(target);
    if (!set || set.size === 0) return;

    for (const watcher of [...set]) {
      watcher.callback(entry);
      if (watcher.once && entry.isIntersecting) {
        set.delete(watcher);
      }
    }

    if (set.size === 0) {
      byElement!.delete(target);
      this.observers.get(key)?.unobserve(target);
    }
  }

  private removeWatcher(key: string, element: Element, watcher: Watcher): void {
    const byElement = this.watchers.get(key);
    const set = byElement?.get(element);
    if (!set) return;
    set.delete(watcher);
    if (set.size === 0) {
      byElement!.delete(element);
      this.observers.get(key)?.unobserve(element);
    }
  }
}

export const observerPool = new ObserverPool();

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as Window & { __observerPoolStats?: () => ObserverPoolStats }).__observerPoolStats =
    () => observerPool.stats();
}
