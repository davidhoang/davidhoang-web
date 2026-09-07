import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../src/pages/api/theme-query';

const encoder = new TextEncoder();

function textEvent(text: string, newline = '\n') {
  return `event: content_block_delta${newline}data: ${JSON.stringify({
    type: 'content_block_delta',
    index: 0,
    delta: { type: 'text_delta', text },
  })}${newline}${newline}`;
}

async function queryTheme(body: ReadableStream<Uint8Array>) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, {
    headers: { 'Content-Type': 'text/event-stream' },
  })));

  return await POST({
    request: new Request('https://example.test/api/theme-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Show me a colorful theme' }),
    }),
  } as Parameters<typeof POST>[0]);
}

async function queryChunks(chunks: Uint8Array[]) {
  return queryTheme(new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  }));
}

beforeEach(() => {
  vi.stubEnv('ANTHROPIC_API_KEY', 'theme-query-test-key');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('POST /api/theme-query streaming', () => {
  const unicodeText = '{"title":"Café 🌈 — 色"}';
  const event = textEvent(unicodeText);
  const eventBytes = encoder.encode(event);

  it.each([
    ['the data field prefix', encoder.encode(event.slice(0, event.indexOf('data:') + 2)).length],
    ['the JSON payload', encoder.encode(event.slice(0, event.indexOf('text_delta') + 5)).length],
    ['a multibyte UTF-8 character', encoder.encode(event.slice(0, event.indexOf('🌈'))).length + 2],
  ])('preserves a text delta split inside %s', async (_description, splitAt) => {
    const response = await queryChunks([
      eventBytes.slice(0, splitAt),
      eventBytes.slice(splitAt),
    ]);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(await response.text()).toBe(unicodeText);
  });

  it('preserves output at every possible byte boundary', async () => {
    for (let splitAt = 1; splitAt < eventBytes.length; splitAt++) {
      const response = await queryChunks([
        eventBytes.slice(0, splitAt),
        eventBytes.slice(splitAt),
      ]);

      expect(await response.text(), `split at byte ${splitAt}`).toBe(unicodeText);
    }
  });

  it('preserves coalesced text deltas while ignoring metadata, pings, and comments', async () => {
    const source = [
      ': keepalive\n\n',
      'event: message_start\ndata: {"type":"message_start","message":{"id":"msg_test"}}\n\n',
      textEvent('{"root":'),
      'event: ping\ndata: {"type":"ping"}\n\n',
      'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"input_json_delta","partial_json":"ignored"}}\n\n',
      textEvent('"theme"}'),
      'event: message_stop\ndata: {"type":"message_stop"}\n\n',
      'data: [DONE]\n\n',
    ].join('');

    const response = await queryChunks([encoder.encode(source)]);

    expect(await response.text()).toBe('{"root":"theme"}');
  });

  it.each(['\n', '\r\n', '\r'])('handles %j event framing arriving one byte at a time', async (newline) => {
    const source = encoder.encode(textEvent('Café ', newline) + textEvent('🌈', newline));
    const response = await queryChunks(Array.from(source, byte => Uint8Array.of(byte)));

    expect(await response.text()).toBe('Café 🌈');
  });

  it('joins multiple data fields into one event payload', async () => {
    const source = [
      'event: content_block_delta',
      'data: {"type":"content_block_delta",',
      'data:"delta":{"type":"text_delta","text":"line one\\nline two"}}',
      '',
      '',
    ].join('\n');
    const response = await queryChunks([encoder.encode(source)]);

    expect(await response.text()).toBe('line one\nline two');
  });

  it.each(['', '\n', '\r'])('discards an event without a final blank line at EOF (%j)', async (ending) => {
    const source = textEvent('complete') + textEvent('incomplete').replace(/\n\n$/, ending);
    const response = await queryChunks([encoder.encode(source)]);

    expect(await response.text()).toBe('complete');
  });

  it('continues after malformed complete event data', async () => {
    const response = await queryChunks([encoder.encode(
      'event: content_block_delta\ndata: {malformed}\n\n' + textEvent('valid text'),
    )]);

    expect(await response.text()).toBe('valid text');
  });

  it('forwards completed deltas before the upstream stream closes', async () => {
    let upstream!: ReadableStreamDefaultController<Uint8Array>;
    const response = await queryTheme(new ReadableStream<Uint8Array>({
      start(controller) {
        upstream = controller;
      },
    }));
    const reader = response.body!.getReader();
    let deadline: ReturnType<typeof setTimeout> | undefined;

    try {
      const first = encoder.encode(textEvent('first 🌈'));
      upstream.enqueue(first.slice(0, 35));
      upstream.enqueue(first.slice(35));

      const result = await Promise.race([
        reader.read(),
        new Promise<never>((_resolve, reject) => {
          deadline = setTimeout(() => reject(new Error('No text forwarded before upstream closed')), 1000);
        }),
      ]);

      expect(result.done).toBe(false);
      expect(new TextDecoder().decode(result.value)).toBe('first 🌈');
      upstream.enqueue(encoder.encode(textEvent(' second')));
      upstream.close();

      const remainder = await reader.read();
      expect(remainder.done).toBe(false);
      expect(new TextDecoder().decode(remainder.value)).toBe(' second');
      expect((await reader.read()).done).toBe(true);
    } finally {
      clearTimeout(deadline);
      try { upstream.close(); } catch { /* Already closed after a successful read. */ }
      await reader.cancel();
    }
  });

  it('propagates upstream read failures to the response consumer', async () => {
    const failure = new Error('Upstream connection lost');
    const response = await queryTheme(new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.error(failure);
      },
    }));

    await expect(response.text()).rejects.toThrow('Upstream connection lost');
  });

  it('cancels the upstream request when the response consumer stops reading', async () => {
    const cancel = vi.fn();
    const response = await queryTheme(new ReadableStream<Uint8Array>({ cancel }));
    const reader = response.body!.getReader();
    const pendingRead = reader.read();

    await reader.cancel('Theme preview dismissed');

    await expect(pendingRead).resolves.toEqual({ done: true, value: undefined });
    expect(cancel).toHaveBeenCalledWith('Theme preview dismissed');
  });
});
