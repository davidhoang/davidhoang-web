/** Convert Anthropic SSE events to text without assuming network chunk boundaries. */
export function createAnthropicTextStream(): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let line = '';
  let dataLines: string[] = [];
  let skipLF = false;

  function processLine(controller: TransformStreamDefaultController<Uint8Array>) {
    if (line === '') {
      const data = dataLines.join('\n');
      dataLines = [];
      if (!data || data === '[DONE]') return;

      let event;
      try {
        event = JSON.parse(data);
      } catch {
        // Preserve the existing behavior for malformed, complete events.
        return;
      }

      if (
        event?.type === 'content_block_delta' &&
        typeof event.delta?.text === 'string' &&
        event.delta.text.length > 0
      ) {
        controller.enqueue(encoder.encode(event.delta.text));
      }
      return;
    }

    if (line === 'data') {
      dataLines.push('');
    } else if (line.startsWith('data:')) {
      const value = line.slice(5);
      dataLines.push(value.startsWith(' ') ? value.slice(1) : value);
    }
  }

  function consume(text: string, controller: TransformStreamDefaultController<Uint8Array>) {
    for (const character of text) {
      // A CRLF pair is one line ending, even when split across network chunks.
      if (skipLF) {
        skipLF = false;
        if (character === '\n') continue;
      }

      if (character === '\r' || character === '\n') {
        processLine(controller);
        line = '';
        skipLF = character === '\r';
      } else {
        line += character;
      }
    }
  }

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      consume(decoder.decode(chunk, { stream: true }), controller);
    },
    flush(controller) {
      consume(decoder.decode(), controller);
      // SSE events require a terminating blank line; discard an incomplete tail.
    },
  });
}
