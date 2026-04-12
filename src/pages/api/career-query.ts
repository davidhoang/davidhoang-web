import type { APIRoute } from 'astro';
import careerData from '../../data/career-odyssey.json';

export const prerender = false;

const CATALOG_PROMPT = `You are narrating David Hoang's career odyssey. You compose editorial json-render layouts from his career data.
The spec uses a flat element tree format with these components.

## Available Components

### ThemeCard
Container card. Props: { title: string, subtitle?: string }
Accepts children.

### TimelineEntry
A career milestone. Props: { year: string, title: string, description?: string, type: "moment" }
No children. Color-coded dot by type.

### Heading
Section heading. Props: { text: string, level: "h2" | "h3" | "h4" }
No children.

### Prose
Narrative paragraph. Props: { text: string }
No children. Use for editorial commentary connecting events.

### Stack
Flex container. Props: { direction: "horizontal" | "vertical", gap: "none" | "sm" | "md" | "lg", align: "start" | "center" | "end" | "stretch" }
Accepts children.

### Badge
Label. Props: { text: string, variant: "filled" | "outlined" }
No children.

### Divider
Separator. Props: { style: "solid" | "dashed" | "dotted" }
No children.

### TypeSample
Large display text. Props: { text: string, variant: "heading" | "body" | "caption", weight?: string }
No children.

## Spec Format (flat element tree)

\`\`\`json
{
  "root": "root-key",
  "elements": {
    "root-key": { "type": "Stack", "props": { ... }, "children": ["child-1"] },
    "child-1": { "type": "TimelineEntry", "props": { ... }, "children": [] }
  }
}
\`\`\`

## Rules
- Every element needs a unique key; children referenced by key
- Root should be a Stack
- Use Prose to add editorial narration — tell a story, don't just list events
- Group related events with Heading + ThemeCard sections
- Use TimelineEntry for individual career events (use the correct type from the data)
- Use Badge for themes like "design", "gaming", "leadership"
- Keep specs 10-30 elements depending on the query scope
- Output ONLY raw JSON, no markdown fences, no comments
- Write in third person about David — insightful, warm, editorial tone`;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing query parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const anthropicApiKey =
      import.meta.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Build career context
    const nodes = careerData.nodes.map((n: any) => ({
      id: n.id,
      label: n.label,
      description: n.description || '',
      type: n.type,
      date: n.date || n.dateRange,
      pathTaken: n.pathTaken !== false,
      connections: n.connections || [],
      workedWith: n.workedWith || [],
    }));

    const userPrompt = `User query: "${query}"

Here are all the career odyssey nodes for David Hoang:

${nodes.map((n: any) => `- [${n.type}] ${n.date}: ${n.label}${n.description ? ` — ${n.description}` : ''}${!n.pathTaken ? ' (path not taken)' : ''}${n.workedWith.length ? ` (worked with: ${n.workedWith.join(', ')})` : ''}`).join('\n')}

Based on the user's query, compose a json-render spec that tells a compelling narrative about the relevant parts of David's career. Use Prose components for editorial commentary. Group events thematically. If the query is broad, tell the full story with key highlights. If specific, zoom in on that thread.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 4096,
        stream: true,
        system: CATALOG_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `Claude API error: ${errorText}` }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Stream text deltas
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async pull(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);
              if (event.type === 'content_block_delta' && event.delta?.text) {
                controller.enqueue(new TextEncoder().encode(event.delta.text));
              }
            } catch {
              // skip
            }
          }
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: any) {
    console.error('career-query error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
