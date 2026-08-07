/**
 * Progressive WebMCP bootstrap for Astro view transitions.
 *
 * Registers tools on astro:page-load and aborts the prior AbortController on
 * astro:before-swap so registrations do not accumulate across navigations.
 */

import { isWebMcpAvailable, registerWebMcpTools } from '../utils/webmcp';

const LISTENER_FLAG = '__webmcpListenersBound';
const CONTROLLER_KEY = '__webmcpAbortController';

type WebMcpWindow = Window & {
  [LISTENER_FLAG]?: boolean;
  [CONTROLLER_KEY]?: AbortController | null;
};

function abortActiveRegistration(): void {
  const w = window as WebMcpWindow;
  const existing = w[CONTROLLER_KEY];
  if (existing) {
    existing.abort();
    w[CONTROLLER_KEY] = null;
  }
}

async function registerForCurrentDocument(): Promise<void> {
  if (!isWebMcpAvailable()) return;

  abortActiveRegistration();
  const controller = new AbortController();
  (window as WebMcpWindow)[CONTROLLER_KEY] = controller;

  try {
    await registerWebMcpTools({ signal: controller.signal });
  } catch (error) {
    if (!controller.signal.aborted) {
      console.warn('[webmcp] registration failed:', error);
    }
  }
}

/** Idempotent site-wide init — safe to call from MainLayout on every page. */
export function initWebMcp(): void {
  const w = window as WebMcpWindow;
  if (w[LISTENER_FLAG]) {
    void registerForCurrentDocument();
    return;
  }
  w[LISTENER_FLAG] = true;

  document.addEventListener('astro:before-swap', () => {
    abortActiveRegistration();
  });

  document.addEventListener('astro:page-load', () => {
    void registerForCurrentDocument();
  });

  void registerForCurrentDocument();
}
