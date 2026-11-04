/** Schedule work on the main thread when idle (or next tick as fallback). */
export function scheduleIdleWork(work: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const win = window as Window & {
    requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (win.requestIdleCallback) {
    const id = win.requestIdleCallback(work, { timeout: 2500 });
    return () => win.cancelIdleCallback?.(id);
  }
  const id = globalThis.setTimeout(work, 1);
  return () => globalThis.clearTimeout(id);
}

/**
 * Wait until LCP is recorded, then an optional quiet period, so heavy JS stays off the LCP path.
 */
export function afterLcpOrTimeout(work: () => void, postLcpDelayMs = 2500, fallbackMs = 6000): () => void {
  if (typeof window === 'undefined') return () => {};
  let settled = false;
  let delayTimer: ReturnType<typeof setTimeout> | undefined;
  let cancelIdle: (() => void) | undefined;

  const run = () => {
    if (settled) return;
    settled = true;
    cancelIdle = scheduleIdleWork(work);
  };

  const fallback = globalThis.setTimeout(run, fallbackMs);

  if ('PerformanceObserver' in window) {
    try {
      const po = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length === 0) return;
        po.disconnect();
        globalThis.clearTimeout(fallback);
        const last = entries[entries.length - 1] as PerformanceEntry;
        const waitMs = Math.max(0, postLcpDelayMs - (performance.now() - last.startTime));
        delayTimer = globalThis.setTimeout(run, waitMs);
      });
      po.observe({ type: 'largest-contentful-paint', buffered: true });
      return () => {
        settled = true;
        po.disconnect();
        globalThis.clearTimeout(fallback);
        if (delayTimer) globalThis.clearTimeout(delayTimer);
        cancelIdle?.();
      };
    } catch {
      // Fall through to timeout-only path.
    }
  }

  return () => {
    settled = true;
    globalThis.clearTimeout(fallback);
    if (delayTimer) globalThis.clearTimeout(delayTimer);
    cancelIdle?.();
  };
}
