/**
 * Client bootstrap for privacy-conscious agent-experience measurement.
 * Sends allowlisted custom events via Vercel Web Analytics — never query text or emails.
 */

import { track } from '@vercel/analytics';
import {
  type AgentEventPayload,
  type SearchTrigger,
  buildAiReferralEvent,
  classifyAiReferralOrigin,
  isSafeAgentEventPayload,
  sanitizeAnalyticsUrl,
} from '../utils/agentExperienceMetrics';

declare global {
  interface Window {
    __agentExperienceInit?: boolean;
    __agentReferralSent?: boolean;
  }
}

export function reportAgentEvent(payload: AgentEventPayload): void {
  if (!isSafeAgentEventPayload(payload)) return;
  try {
    track(payload.name, payload.data);
  } catch {
    // Analytics must never break UX.
  }
}

function readUtm(param: string): string | null {
  try {
    return new URLSearchParams(window.location.search).get(param);
  } catch {
    return null;
  }
}

export function reportAiReferralOnce(): void {
  if (typeof window === 'undefined') return;
  if (window.__agentReferralSent) return;

  const source = classifyAiReferralOrigin({
    referrer: document.referrer || null,
    utmSource: readUtm('utm_source'),
    utmMedium: readUtm('utm_medium'),
  });

  if (!source) return;

  window.__agentReferralSent = true;
  reportAgentEvent(buildAiReferralEvent(source));
}

/** beforeSend hook for Vercel Analytics — strips sensitive query params from pageviews. */
export function analyticsBeforeSend<T extends { url?: string }>(event: T): T | null {
  if (!event?.url) return event;
  return {
    ...event,
    url: sanitizeAnalyticsUrl(event.url),
  };
}

export function initAgentExperience(): void {
  if (typeof window === 'undefined') return;
  if (window.__agentExperienceInit) {
    reportAiReferralOnce();
    return;
  }
  window.__agentExperienceInit = true;

  // Expose beforeSend for the Analytics component inline bridge.
  (window as unknown as { webAnalyticsBeforeSend?: typeof analyticsBeforeSend }).webAnalyticsBeforeSend =
    analyticsBeforeSend;

  reportAiReferralOnce();
}

/** Map palette open context to a coarse trigger label (no free text). */
export function inferSearchTrigger(fromKeyboard: boolean): SearchTrigger {
  return fromKeyboard ? 'keyboard' : 'click';
}
