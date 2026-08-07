import { describe, it, expect } from 'vitest';
import {
  AGENT_EVENT_NAMES,
  FORBIDDEN_PAYLOAD_KEYS,
  buildAiReferralEvent,
  buildNewsletterSubmitEvent,
  buildSearchEmptyEvent,
  buildSearchErrorEvent,
  buildSearchOpenEvent,
  buildSearchSelectEvent,
  classifyAiReferralOrigin,
  isSafeAgentEventPayload,
  resolveSearchResultType,
  sanitizeAnalyticsUrl,
  type AgentEventPayload,
} from '../src/utils/agentExperienceMetrics';

describe('classifyAiReferralOrigin', () => {
  it('classifies ChatGPT referrer hosts', () => {
    expect(
      classifyAiReferralOrigin({ referrer: 'https://chatgpt.com/' }),
    ).toBe('chatgpt');
    expect(
      classifyAiReferralOrigin({ referrer: 'https://chat.openai.com/c/abc' }),
    ).toBe('chatgpt');
  });

  it('classifies Perplexity, Claude, Gemini, Copilot, and You.com', () => {
    expect(
      classifyAiReferralOrigin({ referrer: 'https://www.perplexity.ai/search' }),
    ).toBe('perplexity');
    expect(classifyAiReferralOrigin({ referrer: 'https://claude.ai/chat' })).toBe(
      'claude',
    );
    expect(
      classifyAiReferralOrigin({ referrer: 'https://gemini.google.com/app' }),
    ).toBe('gemini');
    expect(
      classifyAiReferralOrigin({
        referrer: 'https://copilot.microsoft.com/',
      }),
    ).toBe('copilot');
    expect(classifyAiReferralOrigin({ referrer: 'https://you.com/search' })).toBe(
      'you',
    );
  });

  it('classifies Grok, Poe, Phind, DeepSeek, and Meta AI', () => {
    expect(classifyAiReferralOrigin({ referrer: 'https://grok.x.ai/' })).toBe(
      'grok',
    );
    expect(classifyAiReferralOrigin({ referrer: 'https://poe.com/' })).toBe('poe');
    expect(classifyAiReferralOrigin({ referrer: 'https://www.phind.com/' })).toBe(
      'phind',
    );
    expect(
      classifyAiReferralOrigin({ referrer: 'https://chat.deepseek.com/' }),
    ).toBe('deepseek');
    expect(classifyAiReferralOrigin({ referrer: 'https://www.meta.ai/' })).toBe(
      'meta_ai',
    );
  });

  it('prefers utm_source over referrer when mapped', () => {
    expect(
      classifyAiReferralOrigin({
        referrer: 'https://example.com/',
        utmSource: 'perplexity',
      }),
    ).toBe('perplexity');
  });

  it('buckets unknown AI-tagged utm campaigns as other_ai', () => {
    expect(
      classifyAiReferralOrigin({
        utmSource: 'mysterybot',
        utmMedium: 'answer_engine',
      }),
    ).toBe('other_ai');
  });

  it('returns null for ordinary web traffic', () => {
    expect(classifyAiReferralOrigin({ referrer: 'https://news.ycombinator.com/' })).toBeNull();
    expect(classifyAiReferralOrigin({ referrer: 'https://www.google.com/' })).toBeNull();
    expect(classifyAiReferralOrigin({ referrer: '' })).toBeNull();
    expect(classifyAiReferralOrigin({})).toBeNull();
  });

  it('ignores invalid referrer URLs', () => {
    expect(classifyAiReferralOrigin({ referrer: 'not a url' })).toBeNull();
    expect(classifyAiReferralOrigin({ referrer: 'javascript:alert(1)' })).toBeNull();
  });
});

describe('event payload builders', () => {
  it('builds ai_referral without referrer URL or free text', () => {
    const event = buildAiReferralEvent('chatgpt');
    expect(event).toEqual({
      name: AGENT_EVENT_NAMES.aiReferral,
      data: { source: 'chatgpt' },
    });
    expect(isSafeAgentEventPayload(event)).toBe(true);
  });

  it('builds search events without query text or paths', () => {
    expect(buildSearchOpenEvent('keyboard')).toEqual({
      name: AGENT_EVENT_NAMES.searchOpen,
      data: { trigger: 'keyboard' },
    });
    expect(buildSearchSelectEvent('writing')).toEqual({
      name: AGENT_EVENT_NAMES.searchSelect,
      data: { resultType: 'writing' },
    });
    expect(buildSearchEmptyEvent()).toEqual({
      name: AGENT_EVENT_NAMES.searchEmpty,
      data: { hadQuery: 'yes' },
    });
    expect(buildSearchErrorEvent()).toEqual({
      name: AGENT_EVENT_NAMES.searchError,
      data: { reason: 'index_load' },
    });

    for (const event of [
      buildSearchOpenEvent('click'),
      buildSearchSelectEvent('note'),
      buildSearchEmptyEvent(),
      buildSearchErrorEvent(),
    ]) {
      expect(isSafeAgentEventPayload(event)).toBe(true);
      expect(Object.keys(event.data)).not.toContain('query');
      expect(Object.keys(event.data)).not.toContain('path');
    }
  });

  it('builds newsletter submit as attempted only (no email)', () => {
    const event = buildNewsletterSubmitEvent('attempted');
    expect(event).toEqual({
      name: AGENT_EVENT_NAMES.newsletterSubmit,
      data: { outcome: 'attempted' },
    });
    expect(isSafeAgentEventPayload(event)).toBe(true);
    expect(JSON.stringify(event)).not.toMatch(/@/);
  });
});

describe('isSafeAgentEventPayload', () => {
  it('rejects forbidden keys', () => {
    for (const key of ['email', 'query', 'q', 'path', 'content'] as const) {
      const unsafe = {
        name: AGENT_EVENT_NAMES.searchOpen,
        data: { [key]: 'x' },
      } as unknown as AgentEventPayload;
      expect(isSafeAgentEventPayload(unsafe)).toBe(false);
    }
    expect(FORBIDDEN_PAYLOAD_KEYS).toContain('email');
    expect(FORBIDDEN_PAYLOAD_KEYS).toContain('query');
  });

  it('rejects email-like or multi-word free text values', () => {
    const withEmail = {
      name: AGENT_EVENT_NAMES.newsletterSubmit,
      data: { outcome: 'user@example.com' },
    } as unknown as AgentEventPayload;
    expect(isSafeAgentEventPayload(withEmail)).toBe(false);

    const withSentence = {
      name: AGENT_EVENT_NAMES.searchEmpty,
      data: { hadQuery: 'design systems tomorrow' },
    } as unknown as AgentEventPayload;
    expect(isSafeAgentEventPayload(withSentence)).toBe(false);
  });
});

describe('sanitizeAnalyticsUrl', () => {
  it('strips sensitive query params while keeping safe ones', () => {
    const cleaned = sanitizeAnalyticsUrl(
      'https://www.davidhoang.com/writing?q=secret&utm_source=chatgpt&email=a@b.com&utm_medium=ai',
    );
    const url = new URL(cleaned);
    expect(url.searchParams.has('q')).toBe(false);
    expect(url.searchParams.has('email')).toBe(false);
    expect(url.searchParams.get('utm_source')).toBe('chatgpt');
    expect(url.searchParams.get('utm_medium')).toBe('ai');
  });

  it('returns the original string when URL parsing fails', () => {
    expect(sanitizeAnalyticsUrl('not-a-url')).toBe('not-a-url');
  });
});

describe('resolveSearchResultType', () => {
  it('accepts known result types only', () => {
    expect(resolveSearchResultType('page')).toBe('page');
    expect(resolveSearchResultType('writing')).toBe('writing');
    expect(resolveSearchResultType('note')).toBe('note');
    expect(resolveSearchResultType('other')).toBeNull();
    expect(resolveSearchResultType(null)).toBeNull();
  });
});
