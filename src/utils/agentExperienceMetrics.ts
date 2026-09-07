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

export const NEWSLETTER_PLACEMENTS = ['home', 'subscribe', 'writing', 'other'] as const;
export type NewsletterPlacement = (typeof NEWSLETTER_PLACEMENTS)[number];

export const ACQUISITION_SOURCES = [
  ...AI_REFERRAL_SOURCES,
  'organic_search',
  'referral',
  'direct',
  'unknown',
] as const;
export type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number];

export type NewsletterAttribution = {
  placement: NewsletterPlacement;
  source: AcquisitionSource;
};

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
  | {
      name: typeof AGENT_EVENT_NAMES.newsletterSubmit;
      data: { outcome: NewsletterOutcome } & Partial<NewsletterAttribution>;
    };

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
  { source: 'grok', hosts: ['grok.com', 'grok.x.ai', 'x.ai'] },
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
  'grok.com': 'grok',
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

const SEARCH_REFERRAL_HOSTS = [
  'google.com',
  'google.co.uk',
  'google.ca',
  'google.com.au',
  'bing.com',
  'search.yahoo.com',
  'duckduckgo.com',
  'search.brave.com',
  'ecosia.org',
  'kagi.com',
  'baidu.com',
  'yandex.com',
];

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
  if (utmSource && Object.prototype.hasOwnProperty.call(AI_UTM_SOURCE_MAP, utmSource)) {
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

export function resolveAcquisitionSource(value: unknown): AcquisitionSource | null {
  return typeof value === 'string' && (ACQUISITION_SOURCES as readonly string[]).includes(value)
    ? (value as AcquisitionSource)
    : null;
}

/** Classify locally; only the returned fixed-value source belongs in analytics. */
export function classifyAcquisitionSource(input: {
  referrer?: string | null;
  currentUrl?: string | null;
}): AcquisitionSource {
  let currentUrl: URL | null = null;
  if (input.currentUrl) {
    try {
      currentUrl = new URL(input.currentUrl);
      if (currentUrl.protocol !== 'https:' && currentUrl.protocol !== 'http:') return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  const aiSource = classifyAiReferralOrigin({
    referrer: input.referrer,
    utmSource: currentUrl?.searchParams.get('utm_source'),
    utmMedium: currentUrl?.searchParams.get('utm_medium'),
  });
  if (aiSource) return aiSource;

  const referrerHost = parseReferrerHost(input.referrer);
  if (!referrerHost) {
    // An absent referrer is a coarse direct bucket, not proof of typed navigation.
    return input.referrer?.trim() ? 'unknown' : 'direct';
  }
  if (currentUrl && referrerHost === normalizeHost(currentUrl.hostname)) return 'unknown';
  if (SEARCH_REFERRAL_HOSTS.some((host) => hostMatches(referrerHost, host))) return 'organic_search';
  return 'referral';
}

/** Resolve the signup surface without exposing arbitrary page paths. */
export function resolveNewsletterPlacement(pathname: string): NewsletterPlacement {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') return 'home';
  if (path === '/subscribe') return 'subscribe';
  if (path === '/writing' || path.startsWith('/writing/')) return 'writing';
  return 'other';
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
  context: Partial<NewsletterAttribution> = {},
): AgentEventPayload {
  const placement = (NEWSLETTER_PLACEMENTS as readonly unknown[]).includes(context.placement)
    ? context.placement as NewsletterPlacement
    : 'other';
  return {
    name: AGENT_EVENT_NAMES.newsletterSubmit,
    data: { outcome, placement, source: resolveAcquisitionSource(context.source) ?? 'unknown' },
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
  if (payload.name === AGENT_EVENT_NAMES.newsletterSubmit) {
    const newsletterData = payload.data;
    if (newsletterData.outcome !== 'attempted') return false;
    if (Object.keys(newsletterData).some((key) => !['outcome', 'placement', 'source'].includes(key))) return false;
    if ('placement' in newsletterData && !(NEWSLETTER_PLACEMENTS as readonly unknown[]).includes(newsletterData.placement)) return false;
    if ('source' in newsletterData && !resolveAcquisitionSource(newsletterData.source)) return false;
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
