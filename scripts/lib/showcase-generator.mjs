/**
 * Showcase Generator
 *
 * Generates a json-render spec for a theme preview card using Claude.
 * The spec uses components from the theme showcase catalog
 * (src/components/generative-ui/catalog.ts). Used for daily theme showcase data (Labs page deprecated).
 */

/**
 * Component catalog description for the AI prompt.
 * Must stay in sync with catalog.ts — but this is the prompt text,
 * not the runtime schema, so duplication is acceptable.
 */
const CATALOG_PROMPT = `You are generating a JSON UI spec for a theme showcase card. The spec uses a flat element tree format.

## Available Components

### ThemeCard
Container card. Props: { title: string, subtitle?: string }
Accepts children. Use as the root wrapper.

### ColorSwatch
Single color display. Props: { color: string (hex), label: string }
No children.

### ColorPalette
Row of swatches. Props: { colors: [{ hex: string, label: string }, ...] }
No children. Good for showing the full palette at a glance.

### TypeSample
Typography specimen. Props: { text: string, variant: "heading" | "body" | "caption", weight?: string }
No children. Shows text in theme font styles.

### LayoutPreview
Mini wireframe of grid style. Props: { style: "standard" | "asymmetric" | "split" | "magazine" | "sidebar" }
No children.

### Stack
Flex container. Props: { direction: "horizontal" | "vertical", gap: "none" | "sm" | "md" | "lg", align: "start" | "center" | "end" | "stretch" }
Accepts children. Use to compose layouts.

### Badge
Small label. Props: { text: string, variant: "filled" | "outlined" }
No children. Good for tags like "serif", "editorial", etc.

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
- Root element should be a ThemeCard or Stack
- Use descriptive keys like "palette", "heading-sample", "badge-row"
- VARY the layout each time — don't always use the same arrangement
- Show 4-6 of the theme's light-mode colors in a ColorPalette
- Include at least one TypeSample with variant "heading" using the theme name or an evocative phrase
- Include a Badge for the font category and/or card style
- Output ONLY raw JSON, no markdown fences
- Keep specs COMPACT: 6-10 elements total. Use short keys (2-3 chars like "s1", "p1", "b1")
- Do NOT add comments in the JSON`;

/**
 * Generate a showcase spec for a theme using Claude
 */
export async function generateShowcaseSpec(client, theme) {
  const lightColors = theme.colors?.light || {};
  const colorEntries = Object.entries(lightColors)
    .filter(([key]) => key.startsWith('--color-'))
    .map(([key, val]) => `${key}: ${val}`)
    .join(', ');

  const userPrompt = `Create a theme showcase card for this theme:

Name: "${theme.name}"
Description: ${theme.description}
Light colors: ${colorEntries}
Heading font: ${theme.fonts?.heading?.name || 'Unknown'} (${theme.fonts?.heading?.category || 'sans-serif'})
Body font: ${theme.fonts?.body?.name || 'Unknown'} (${theme.fonts?.body?.category || 'sans-serif'})
Card style: ${theme.cards?.style || 'elevated'}
Grid layout: ${theme.layout?.gridStyle || 'standard'}
Hero: ${theme.hero?.layout || 'stacked-fan'}
Link style: ${theme.links?.style || 'underline'}
Border radius: ${theme.layout?.borderRadius || '8px'}

Make the showcase visually interesting and unique to this theme.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: CATALOG_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const responseText = message.content[0].text.trim();

  // Parse JSON from response
  const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
                    responseText.match(/(\{[\s\S]*\})/);
  let jsonStr = jsonMatch ? jsonMatch[1] : responseText;

  // Clean common JSON issues from LLM output
  jsonStr = jsonStr
    .replace(/,\s*([}\]])/g, '$1')  // trailing commas
    .replace(/\/\/[^\n]*/g, '');     // line comments

  const spec = JSON.parse(jsonStr);

  // Basic validation: must have root and elements
  if (!spec.root || !spec.elements || !spec.elements[spec.root]) {
    throw new Error('Invalid showcase spec: missing root or elements');
  }

  return spec;
}
