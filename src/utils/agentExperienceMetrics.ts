/**
 * Privacy-conscious agent-experience measurement helpers.
 *
 * Client-safe classification and event payloads only. Never include query text,
 * email addresses, page content, or other personal data in payloads.
 *
 * AI crawler / citation traffic must be measured server-side (Vercel Firewall /
 * Observability) — see docs/agent-experience-measurement.md.
 */

export const AI_REFERRAL_SOURCES = [
  'chatgpt',
  'perplexity',
  'claude',
  'gemini',
  'copilot',
  'you',
  'meta_ai',
  'grok',
  'poe',
  'phind',
  'deepseek',
  'other_ai',
] as const;

export type AiReferralSource = (typeof AI_REFERRAL_SOURCES)[number];

export const SEARCH_RESULT_TYPES = ['page', 'writing', 'note'] as const;
export type SearchResultType = (typeof SEARCH_RESULT_TYPES)[number];

export const SEARCH_TRIGGERS = ['keyboard', 'click', 'unknown'] as const;
export type SearchTrigger = (typeof SEARCH_TRIGGERS)[number];

export const NEWSLETTER_OUTCOMES = ['attempted'] as const;
export type NewsletterOutcome = (typeof NEWSLETTER_OUTCOMES)[number];

/** Event names sent to Vercel Web Analytics custom events. */
export const AGENT_EVENT_NAMES = {
  aiReferral: 'ai_referral',
  searchOpen: 'search_open',
  searchSelect: 'search_select',
  searchEmpty: 'search_empty',
  searchError: 'search_error',
  newsletterSubmit: 'newsletter_submit',
} as const;

export type AgentEventName = (typeof AGENT_EVENT_NAMES)[keyof typeof AGENT_EVENT_NAMES];

export type AgentEventPayload =
  | { name: typeof AGENT_EVENT_NAMES.aiReferral; data: { source: AiReferralSource } }
  | { name: typeof AGENT_EVENT_NAMES.searchOpen; data: { trigger: SearchTrigger } }
  | { name: typeof AGENT_EVENT_NAMES.searchSelect; data: { resultType: SearchResultType } }
  | { name: typeof AGENT_EVENT_NAMES.searchEmpty; data: { hadQuery: 'yes' } }
  | { name: typeof AGENT_EVENT_NAMES.searchError; data: { reason: 'index_load' } }
  | { name: typeof AGENT_EVENT_NAMES.newsletterSubmit; data: { outcome: NewsletterOutcome } };

/** Keys that must never appear on outbound analytics payloads. */
export const FORBIDDEN_PAYLOAD_KEYS = [
  'email',
  'e-mail',
  'query',
  'q',
  'search',
  'searchQuery',
  'content',
  'title',
  'path',
  'url',
  'href',
  'referrer',
  'name',
  'message',
  'body',
] as const;

type HostRule = {
  source: AiReferralSource;
  /** Hostname must equal or end with one of these (lowercase, no port). */
  hosts: string[];
};

/**
 * Known AI answer-engine / assistant referrer hosts.
 * Prefer specific product hosts over broad company domains.
 */
const AI_REFERRAL_HOST_RULES: HostRule[] = [
  { source: 'chatgpt', hosts: ['chatgpt.com', 'chat.openai.com'] },
  { source: 'perplexity', hosts: ['perplexity.ai'] },
  { source: 'claude', hosts: ['claude.ai'] },
  { source: 'gemini', hosts: ['gemini.google.com', 'bard.google.com'] },
  { source: 'copilot', hosts: ['copilot.microsoft.com'] },
  { source: 'you', hosts: ['you.com'] },
  { source: 'meta_ai', hosts: ['meta.ai', 'www.meta.ai'] },
  { source: 'grok', hosts: ['grok.x.ai', 'x.ai'] },
  { source: 'poe', hosts: ['poe.com'] },
  { source: 'phind', hosts: ['phind.com'] },
  { source: 'deepseek', hosts: ['chat.deepseek.com', 'deepseek.com'] },
];

/** utm_source / utm_medium tokens → classified source (lowercase). */
const AI_UTM_SOURCE_MAP: Record<string, AiReferralSource> = {
  chatgpt: 'chatgpt',
  'chatgpt.com': 'chatgpt',
  openai: 'chatgpt',
  perplexity: 'perplexity',
  'perplexity.ai': 'perplexity',
  claude: 'claude',
  'claude.ai': 'claude',
  anthropic: 'claude',
  gemini: 'gemini',
  bard: 'gemini',
  copilot: 'copilot',
  bingchat: 'copilot',
  you: 'you',
  'you.com': 'you',
  meta_ai: 'meta_ai',
  'meta.ai': 'meta_ai',
  grok: 'grok',
  poe: 'poe',
  phind: 'phind',
  deepseek: 'deepseek',
};

const AI_UTM_MEDIUM_HINTS = new Set([
  'ai',
  'llm',
  'answer_engine',
  'answer-engine',
  'chatbot',
]);

function normalizeHost(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, '');
}

function hostMatches(hostname: string, ruleHost: string): boolean {
  const host = normalizeHost(hostname);
  const rule = normalizeHost(ruleHost);
  return host === rule || host.endsWith(`.${rule}`);
}

function classifyHost(hostname: string): AiReferralSource | null {
  for (const rule of AI_REFERRAL_HOST_RULES) {
    if (rule.hosts.some((h) => hostMatches(hostname, h))) {
      return rule.source;
    }
  }
  return null;
}

function parseReferrerHost(referrer: string | null | undefined): string | null {
  if (!referrer || typeof referrer !== 'string') return null;
  const trimmed = referrer.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return normalizeHost(url.hostname);
  } catch {
    return null;
  }
}

function normalizeUtmToken(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  const token = value.trim().toLowerCase();
  return token || null;
}

export type ClassifyAiReferralInput = {
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
};

/**
 * Classify a browser visit as coming from a known AI answer engine.
 * Uses document.referrer host and optional utm_source / utm_medium only —
 * never returns or stores free-text query content.
 */
export function classifyAiReferralOrigin(
  input: ClassifyAiReferralInput,
): AiReferralSource | null {
  const utmSource = normalizeUtmToken(input.utmSource);
  if (utmSource && AI_UTM_SOURCE_MAP[utmSource]) {
    return AI_UTM_SOURCE_MAP[utmSource];
  }

  const host = parseReferrerHost(input.referrer);
  if (host) {
    const fromHost = classifyHost(host);
    if (fromHost) return fromHost;
  }

  const utmMedium = normalizeUtmToken(input.utmMedium);
  if (utmSource && utmMedium && AI_UTM_MEDIUM_HINTS.has(utmMedium)) {
    // Unknown AI-tagged campaign — bucket without inventing a vendor.
    return 'other_ai';
  }

  return null;
}

export function buildAiReferralEvent(
  source: AiReferralSource,
): AgentEventPayload {
  return {
    name: AGENT_EVENT_NAMES.aiReferral,
    data: { source },
  };
}

export function buildSearchOpenEvent(trigger: SearchTrigger = 'unknown'): AgentEventPayload {
  return {
    name: AGENT_EVENT_NAMES.searchOpen,
    data: { trigger },
  };
}

export function buildSearchSelectEvent(resultType: SearchResultType): AgentEventPayload {
  return {
    name: AGENT_EVENT_NAMES.searchSelect,
    data: { resultType },
  };
}

export function buildSearchEmptyEvent(): AgentEventPayload {
  return {
    name: AGENT_EVENT_NAMES.searchEmpty,
    data: { hadQuery: 'yes' },
  };
}

export function buildSearchErrorEvent(): AgentEventPayload {
  return {
    name: AGENT_EVENT_NAMES.searchError,
    data: { reason: 'index_load' },
  };
}

export function buildNewsletterSubmitEvent(
  outcome: NewsletterOutcome = 'attempted',
): AgentEventPayload {
  return {
    name: AGENT_EVENT_NAMES.newsletterSubmit,
    data: { outcome },
  };
}

const EMAIL_LIKE = /[^\s@]+@[^\s@]+\.[^\s@]+/;

/**
 * Validate that an event payload is privacy-safe for outbound analytics.
 * Rejects forbidden keys and values that look like emails or long free text.
 */
export function isSafeAgentEventPayload(
  payload: AgentEventPayload,
): payload is AgentEventPayload {
  const { data } = payload;
  for (const key of Object.keys(data)) {
    if ((FORBIDDEN_PAYLOAD_KEYS as readonly string[]).includes(key)) {
      return false;
    }
    const value = (data as Record<string, unknown>)[key];
    if (typeof value === 'string') {
      if (EMAIL_LIKE.test(value)) return false;
      if (value.length > 64) return false;
      if (/\s/.test(value.trim()) && value.trim().includes(' ')) return false;
    } else if (typeof value !== 'number' && typeof value !== 'boolean') {
      return false;
    }
  }
  return true;
}

/** Query param names stripped from URLs before pageview analytics. */
export const SENSITIVE_QUERY_PARAMS = [
  'email',
  'e-mail',
  'query',
  'q',
  'search',
  'searchQuery',
  'utm_term',
  'utm_content',
] as const;

/**
 * Strip sensitive query params from a URL string for analytics pageviews.
 * Returns the original string if parsing fails.
 */
export function sanitizeAnalyticsUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    for (const param of SENSITIVE_QUERY_PARAMS) {
      url.searchParams.delete(param);
    }
    return url.toString();
  } catch {
    return urlString;
  }
}

export function resolveSearchResultType(
  value: string | null | undefined,
): SearchResultType | null {
  if (!value) return null;
  return (SEARCH_RESULT_TYPES as readonly string[]).includes(value)
    ? (value as SearchResultType)
    : null;
}
