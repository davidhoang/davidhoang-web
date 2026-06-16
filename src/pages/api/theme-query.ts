import type { APIRoute } from 'astro';
import dailyThemes from '../../data/daily-themes.json';

export const prerender = false;

const CATALOG_PROMPT = `You are generating a JSON UI spec that composes a visual layout from daily website themes.
The spec uses a flat element tree format with the following components.

## Available Components

### ThemeCard
Container card. Props: { title: string, subtitle?: string }
Accepts children. Use as a wrapper for each theme section.

### ColorSwatch
Single color display. Props: { color: string (hex), label: string }
No children.

### ColorPalette
Row of swatches. Props: { colors: [{ hex: string, label: string }, ...] }
No children. Good for showing a full palette at a glance.

### TypeSample
Typography specimen. Props: { text: string, variant: "heading" | "body" | "caption", weight?: string }
No children.

### LayoutPreview
Mini wireframe of grid style. Props: { style: "standard" | "asymmetric" | "split" | "magazine" | "sidebar" }
No children.

### HeroLayoutPreview
Mini preview of the hero composition. Props: { layout: "stacked-fan" | "editorial" | "scattered" | "rolodex" | "cinematic", label?: string }
No children.

### ShaderPreview
Mini shader/motion mood panel. Props: { type: "none" | "grain" | "mesh-gradient" | "neuro" | "waves" | "dot-grid" | "swirl" | "perlin" | "simplex", colors: string[] }
No children.

### ThemeManifesto
Short expressive editorial statement. Props: { text: string, emphasis: "quiet" | "bold" | "experimental" }
No children.

### ThemeMeta
Compact key-value list. Props: { items: [{ label: string, value: string }, ...] }
No children.

### TokenGrid
Compact token readout. Props: { tokens: [{ name: string, value: string }, ...] }
No children.

### ThemeActionButton
Interactive button. Props: { label: string, action: "apply-theme" | "copy-palette", date?: string, payload?: string }
No children. Use action "apply-theme" with a theme date when recommending a concrete theme.

### Stack
Flex container. Props: { direction: "horizontal" | "vertical", gap: "none" | "sm" | "md" | "lg", align: "start" | "center" | "end" | "stretch" }
Accepts children. Use to compose layouts.

### Badge
Small label. Props: { text: string, variant: "filled" | "outlined" }
No children.

### Divider
Horizontal separator. Props: { style: "solid" | "dashed" | "dotted" }
No children.

## Spec Format (flat element tree)

\`\`\`json
{
  "root": "root-key",
  "elements": {
    "root-key": {
      "type": "ComponentName",
      "props": { ... },
      "children": ["child-1", "child-2"]
    },
    "child-1": {
      "type": "ComponentName",
      "props": { ... },
      "children": []
    }
  }
}
\`\`\`

## Rules
- Every element needs a unique key
- Children are referenced by key, not nested
- Root element should be a Stack (to hold multiple ThemeCards or sections)
- Use descriptive keys like "palette", "heading-sample", "badge-row"
- Show relevant color palettes from the theme data provided
- Include TypeSample elements with the theme names or evocative phrases
- Include ThemeManifesto, ThemeMeta, HeroLayoutPreview, or ShaderPreview where they improve the answer
- Include ThemeActionButton elements for themes the user may want to apply
- Include Badges for font categories, card styles, contrast, shader, etc.
- Output ONLY raw JSON, no markdown fences
- Keep specs reasonable: 10-24 elements total depending on how many themes match
- Do NOT add comments in the JSON
- VARY the layout — make it feel curated and editorial, not just a list`;

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

    // Build theme context for Claude
    const themeSummaries = dailyThemes.themes.map((t: any) => ({
      name: t.name,
      date: t.date,
      description: t.description,
      colorScheme: t.colors?.colorScheme,
      lightColors: Object.entries(t.colors?.light || {})
        .filter(([k]) => k.startsWith('--color-'))
        .map(([k, v]) => `${k}: ${v}`)
        .join(', '),
      headingFont: `${t.fonts?.heading?.name} (${t.fonts?.heading?.category})`,
      bodyFont: `${t.fonts?.body?.name} (${t.fonts?.body?.category})`,
      cardStyle: t.cards?.style,
      gridStyle: t.layout?.gridStyle,
      heroLayout: t.hero?.layout,
      linkStyle: t.links?.style,
      texture: t.background?.texture,
      footerStyle: t.footer?.style,
      shaderType: t.shader?.type,
      shaderColors: t.shader?.colors || [],
    }));

    const userPrompt = `User query: "${query}"

Here are the available daily themes:

${themeSummaries.map((t: any) => `---
Name: ${t.name}
Date: ${t.date}
Description: ${t.description}
Color scheme: ${t.colorScheme}
Light colors: ${t.lightColors}
Heading font: ${t.headingFont}
Body font: ${t.bodyFont}
Card style: ${t.cardStyle}
Grid: ${t.gridStyle}
Hero: ${t.heroLayout}
Links: ${t.linkStyle}
Texture: ${t.texture}
Footer: ${t.footerStyle}
Shader: ${t.shaderType} (${t.shaderColors.join(', ') || 'no shader colors'})`).join('\n\n')}

Based on the user's query, compose a json-render spec that presents the relevant themes in an interesting, editorial layout. If the query is general, include all themes. If specific, filter to the most relevant ones. Make it visually compelling and include apply-theme buttons for the strongest recommendations.`;

    // Stream from Anthropic API
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

    // Pipe the SSE stream, extracting text deltas and forwarding as raw text
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
              // skip unparseable lines
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
    console.error('theme-query error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
