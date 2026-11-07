import {
  createTextStreamResponse,
  type StreamTextResult,
  type TextStreamPart,
  type ToolSet,
} from 'ai';
import {
  themeQueryEmptyResponse,
  themeQueryGatewayErrorResponse,
} from './themeQueryAuth';

type StreamFailureRef = { error?: unknown };

function mapGatewayFailure(error: unknown): Response {
  const mapped = themeQueryGatewayErrorResponse(error);
  if (mapped) {
    return mapped;
  }
  return new Response(
    JSON.stringify({
      error: 'Theme Ask could not reach the model. Try again.',
      code: 'THEME_QUERY_GATEWAY_FAILED',
    }),
    { status: 502, headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
}

function releaseReader(reader: ReadableStreamDefaultReader<TextStreamPart<ToolSet>>) {
  try {
    reader.releaseLock();
  } catch {
    /* Reader already released or stream errored. */
  }
}

/**
 * Preflight the AI Gateway `streamText` stream so provider errors become JSON
 * responses instead of HTTP 200 with an empty `toTextStream` body (errors are
 * dropped as non-text-delta parts).
 */
type GatewayStreamSource = Pick<
  StreamTextResult<ToolSet, Record<string, never>, never>,
  'stream'
>;

export async function createGatewayThemeQueryResponse(
  result: GatewayStreamSource,
  streamFailure: StreamFailureRef,
): Promise<Response> {
  const reader = result.stream.getReader();
  const prefetched: string[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        await Promise.resolve();
        releaseReader(reader);
        if (streamFailure.error) {
          return mapGatewayFailure(streamFailure.error);
        }
        return themeQueryEmptyResponse();
      }

      if (value.type === 'error') {
        releaseReader(reader);
        return mapGatewayFailure(value.error);
      }

      if (value.type === 'text-delta' && value.text.length > 0) {
        prefetched.push(value.text);
        break;
      }
    }
  } catch (error) {
    releaseReader(reader);
    return mapGatewayFailure(error);
  }

  const stream = new ReadableStream<string>({
    async start(controller) {
      for (const text of prefetched) {
        controller.enqueue(text);
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            break;
          }
          if (value.type === 'error') {
            controller.error(value.error);
            break;
          }
          if (value.type === 'text-delta' && value.text.length > 0) {
            controller.enqueue(value.text);
          }
        }
      } catch (error) {
        controller.error(error);
      } finally {
        releaseReader(reader);
      }
    },
    cancel(reason) {
      void reader.cancel(reason);
    },
  });

  return createTextStreamResponse({
    stream,
    headers: { 'Cache-Control': 'no-cache' },
  });
}
