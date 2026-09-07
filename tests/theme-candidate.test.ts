import { describe, expect, it, vi } from 'vitest';
import type { ContentBlockParam } from '@anthropic-ai/sdk/resources/messages/messages';
import { requestThemeCandidate } from '../scripts/lib/theme-candidate.mjs';
import { isClaudeApiUnavailableError } from '../scripts/lib/theme-api-fallback.mjs';
import { validGeneratedTheme } from './fixtures/generated-theme';

const response = (text = JSON.stringify(validGeneratedTheme), stopReason = 'end_turn') => ({
  content: [{ type: 'text', text }],
  stop_reason: stopReason,
});

function mockClient(...responses: ReturnType<typeof response>[]) {
  const create = vi.fn();
  for (const message of responses) create.mockResolvedValueOnce(message);
  return { messages: { create } };
}

describe('requestThemeCandidate', () => {
  it('returns a validated and normalized theme without retrying', async () => {
    const client = mockClient(response());
    const normalizeTheme = vi.fn((theme) => ({ ...theme, date: '2026-09-06' }));

    const theme = await requestThemeCandidate({ client, fullPrompt: 'Make a theme.', normalizeTheme });

    expect(theme).toMatchObject({ name: 'Schema Test', date: '2026-09-06' });
    expect(normalizeTheme).toHaveBeenCalledOnce();
    expect(client.messages.create).toHaveBeenCalledOnce();
  });

  it('corrects a rejected shadow with the actual schema error and prior response', async () => {
    const invalidTheme = structuredClone(validGeneratedTheme);
    // Captured from a live reproduction of the failed gallery generation.
    invalidTheme.cards.shadow = '0 8px 32px rgba(26,16,53,0.18)';
    const rejectedText = JSON.stringify(invalidTheme);
    const client = mockClient(response(rejectedText), response());
    const imagePrefixBlocks: ContentBlockParam[] = [{ type: 'image', source: { type: 'url', url: 'https://example.com/mood.png' } }];

    await expect(requestThemeCandidate({ client, fullPrompt: 'Make a gallery theme.', imagePrefixBlocks }))
      .resolves.toMatchObject({ cards: { shadow: validGeneratedTheme.cards.shadow } });

    const [firstRequest, retryRequest] = client.messages.create.mock.calls.map(([request]) => request);
    expect(firstRequest.messages).toHaveLength(1);
    expect(retryRequest.messages).toHaveLength(3);
    expect(retryRequest.messages[0]).toEqual(firstRequest.messages[0]);
    expect(retryRequest.messages[0].content[0]).toEqual(imagePrefixBlocks[0]);
    expect(retryRequest.messages[1]).toEqual({ role: 'assistant', content: rejectedText });
    expect(retryRequest.messages[2].content).toContain('cards.shadow');
    expect(retryRequest.messages[2].content).toContain('0 8px 32px rgba(0,0,0,0.12)');
  });

  it('accepts spacing variations without spending a retry', async () => {
    const theme = structuredClone(validGeneratedTheme);
    theme.cards.shadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
    const client = mockClient(response(JSON.stringify(theme)));

    await expect(requestThemeCandidate({ client, fullPrompt: 'Make a theme.' }))
      .resolves.toMatchObject({ cards: { shadow: validGeneratedTheme.cards.shadow } });
    expect(client.messages.create).toHaveBeenCalledOnce();
  });

  it.each(['```json\n%s\n```', '%s'])('accepts JSON responses formatted as %s', async (format) => {
    const client = mockClient(response(format.replace('%s', JSON.stringify(validGeneratedTheme))));
    await expect(requestThemeCandidate({ client, fullPrompt: 'Make a theme.' }))
      .resolves.toMatchObject({ name: 'Schema Test' });
  });

  it('retries malformed JSON and still requires a valid theme', async () => {
    const client = mockClient(response('{"name":'), response());
    await expect(requestThemeCandidate({ client, fullPrompt: 'Make a theme.' }))
      .resolves.toMatchObject({ name: 'Schema Test' });
    expect(client.messages.create).toHaveBeenCalledTimes(2);
  });

  it('rejects truncated output even if it contains parseable JSON', async () => {
    const client = mockClient(response(undefined, 'max_tokens'), response());
    await requestThemeCandidate({ client, fullPrompt: 'Make a theme.' });
    const retryRequest = client.messages.create.mock.calls[1][0];
    expect(retryRequest.messages[2].content).toContain('truncated at the token limit');
    expect(client.messages.create.mock.calls[0][0].max_tokens).toBeGreaterThan(1024);
  });

  it('handles a response with no text as a validation failure', async () => {
    const client = mockClient({ content: [], stop_reason: 'end_turn' }, response());
    await requestThemeCandidate({ client, fullPrompt: 'Make a theme.' });
    const retryRequest = client.messages.create.mock.calls[1][0];
    expect(retryRequest.messages.at(-1).content).toContain('did not contain any text');
    expect(retryRequest.messages.every((message: any) => message.content.length > 0)).toBe(true);
  });

  it('includes normalization failures in corrective feedback', async () => {
    const client = mockClient(response(), response());
    const normalizeTheme = vi.fn()
      .mockImplementationOnce(() => { throw new Error('Theme failed WCAG AA contrast checks.'); })
      .mockImplementationOnce((theme) => theme);

    await requestThemeCandidate({ client, fullPrompt: 'Make a theme.', normalizeTheme });
    expect(client.messages.create.mock.calls[1][0].messages[2].content).toContain('WCAG AA');
    expect(normalizeTheme).toHaveBeenCalledTimes(2);
  });

  it('stops after two invalid responses without enabling API outage fallback', async () => {
    const client = mockClient(response('{}'), response('{}'));
    const normalizeTheme = vi.fn();
    const error = await requestThemeCandidate({ client, fullPrompt: 'Make a theme.', normalizeTheme })
      .catch((error: Error) => error);

    expect(error.message).toContain('Theme candidate failed validation after retry');
    expect(error.message).toContain('schema validation');
    expect(isClaudeApiUnavailableError(error)).toBe(false);
    expect(client.messages.create).toHaveBeenCalledTimes(2);
    expect(normalizeTheme).not.toHaveBeenCalled();
  });

  it('preserves API errors so last-good fallback remains available', async () => {
    const error = Object.assign(new Error('Overloaded'), { status: 529 });
    const client = mockClient();
    client.messages.create.mockRejectedValueOnce(error);

    await expect(requestThemeCandidate({ client, fullPrompt: 'Make a theme.' })).rejects.toBe(error);
    expect(isClaudeApiUnavailableError(error)).toBe(true);
    expect(client.messages.create).toHaveBeenCalledOnce();
  });
});
