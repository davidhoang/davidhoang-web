/**
 * Client bootstrap for privacy-conscious agent-experience measurement.
 * Sends allowlisted custom events via Vercel Web Analytics — never query text or emails.
 */

import { track } from '@vercel/analytics';
import {
  type AgentEventPayload,
  type AcquisitionSource,
  type NewsletterAttribution,
  type SearchTrigger,
  buildAiReferralEvent,
  classifyAcquisitionSource,
  classifyAiReferralOrigin,
  isSafeAgentEventPayload,
  resolveAcquisitionSource,
  resolveNewsletterPlacement,
  sanitizeAnalyticsUrl,
} from '../utils/agentExperienceMetrics';

declare global {
  interface Window {
    __agentExperienceInit?: boolean;
    __agentReferralSent?: boolean;
    __agentAcquisitionSource?: AcquisitionSource;
  }
}

const ACQUISITION_STORAGE_KEY = 'agent-experience-acquisition';

/** Retain the tab's first source through internal navigation; store only an enum. */
function getAcquisitionSource(): AcquisitionSource {
  const memorySource = resolveAcquisitionSource(window.__agentAcquisitionSource);
  if (memorySource) return memorySource;

  let storedSource: AcquisitionSource | null = null;
  try {
    storedSource = resolveAcquisitionSource(sessionStorage.getItem(ACQUISITION_STORAGE_KEY));
  } catch {
    // Storage can be unavailable; in-memory attribution still covers client navigation.
  }

  const source = storedSource ?? classifyAcquisitionSource({
    referrer: document.referrer,
    currentUrl: window.location.href,
  });
  window.__agentAcquisitionSource = source;
  try {
    sessionStorage.setItem(ACQUISITION_STORAGE_KEY, source);
  } catch {
    // Analytics must never depend on storage access.
  }
  return source;
}

/** Signup context contains no URL, referrer, email, or campaign text. */
export function getNewsletterAttribution(): NewsletterAttribution {
  if (typeof window === 'undefined') return { placement: 'other', source: 'unknown' };
  return {
    placement: resolveNewsletterPlacement(window.location.pathname),
    source: getAcquisitionSource(),
  };
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
  // Capture acquisition on arrival, before an internal route can discard its context.
  getAcquisitionSource();
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
