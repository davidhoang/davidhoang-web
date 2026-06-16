/**
 * Showcase Generator
 *
 * Generates a json-render spec for a theme preview card using Claude.
 * The spec uses components from the theme showcase catalog
 * (src/components/generative-ui/catalog.ts). Used for daily theme showcase data (Labs page deprecated).
 */

/**
 * Component catalog description for the AI prompt.
 * Keep this aligned with src/components/generative-ui/catalog.ts.
 */
const CATALOG_PROMPT = `You are generating a JSON UI spec for a daily theme showcase. The spec uses a flat element tree format and renders with json-render.

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

### HeroLayoutPreview
Mini preview of the hero composition. Props: { layout: "stacked-fan" | "editorial" | "scattered" | "rolodex" | "cinematic", label?: string }
No children.

### ShaderPreview
Mini shader/motion mood panel. Props: { type: "none" | "grain" | "mesh-gradient" | "neuro" | "waves" | "dot-grid" | "swirl" | "perlin" | "simplex", colors: string[] }
No children.

### ThemeManifesto
Short expressive editorial statement. Props: { text: string, emphasis: "quiet" | "bold" | "experimental" }
No children. Use this to make the generated preview feel special and personal.

### ThemeMeta
Compact key-value list. Props: { items: [{ label: string, value: string }, ...] }
No children. Good for showing hero, grid, shader, color scheme, link style.

### TokenGrid
Compact token readout. Props: { tokens: [{ name: string, value: string }, ...] }
No children. Use sparingly for 3-5 meaningful tokens.

### ThemeActionButton
Interactive button. Props: { label: string, action: "apply-theme" | "copy-palette", date?: string, payload?: string }
No children. Include an apply-theme button using the theme date.

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
- Include at least one ThemeManifesto, ThemeMeta, HeroLayoutPreview, or ShaderPreview so this is more than a generic palette card
- Include a ThemeActionButton with action "apply-theme" and the exact theme date
- Include Badges for the font category, card style, or mood
- Output ONLY raw JSON, no markdown fences
- Keep specs COMPACT: 9-14 elements total. Use short keys (2-3 chars like "s1", "p1", "b1")
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
Date: ${theme.date}
Description: ${theme.description}
Light colors: ${colorEntries}
Heading font: ${theme.fonts?.heading?.name || 'Unknown'} (${theme.fonts?.heading?.category || 'sans-serif'})
Body font: ${theme.fonts?.body?.name || 'Unknown'} (${theme.fonts?.body?.category || 'sans-serif'})
Card style: ${theme.cards?.style || 'elevated'}
Color scheme: ${theme.colors?.colorScheme || 'complementary'}
Contrast mode: ${theme.colors?.contrastMode || 'standard'}
Grid layout: ${theme.layout?.gridStyle || 'standard'}
Hero: ${theme.hero?.layout || 'stacked-fan'}
Link style: ${theme.links?.style || 'underline'}
Border radius: ${theme.layout?.borderRadius || '8px'}
Background texture: ${theme.background?.texture || 'none'}
Image style: ${theme.images?.style || 'vivid'} / hover ${theme.images?.hover || 'none'}
Footer style: ${theme.footer?.style || 'classic'}
Shader: ${theme.shader?.type || 'none'} (${(theme.shader?.colors || []).join(', ') || 'no shader colors'})

Make the showcase feel like a miniature launch artifact for this specific daily UI, not a generic palette sample.`;

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
