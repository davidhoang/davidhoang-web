import { defineCatalog } from '@json-render/core';
import { schema } from '@json-render/react';
import { z } from 'zod';

export const themeCatalog = defineCatalog(schema, {
  components: {
    ThemeCard: {
      props: z.object({
        title: z.string(),
        subtitle: z.string().optional(),
      }),
      slots: ['default'],
      description: 'A container card for theme content. Use as a top-level wrapper.',
    },
    ColorSwatch: {
      props: z.object({
        color: z.string().describe('Hex color value, e.g. #FF6B35'),
        label: z.string().describe('Color label, e.g. "Link" or "Background"'),
      }),
      slots: [],
      description: 'Displays a single color swatch with its label.',
    },
    ColorPalette: {
      props: z.object({
        colors: z.array(z.object({
          hex: z.string(),
          label: z.string(),
        })).describe('Array of colors to display'),
      }),
      slots: [],
      description: 'Displays a horizontal row of color swatches. Good for showing a full palette at a glance.',
    },
    TypeSample: {
      props: z.object({
        text: z.string().describe('The sample text to display'),
        variant: z.enum(['heading', 'body', 'caption']).describe('Typography style'),
        weight: z.string().optional().describe('Font weight, e.g. "700"'),
      }),
      slots: [],
      description: 'A typography specimen showing text in the theme font styles.',
    },
    LayoutPreview: {
      props: z.object({
        style: z.enum(['standard', 'asymmetric', 'split', 'magazine', 'sidebar']),
      }),
      slots: [],
      description: 'A mini wireframe preview of a grid layout style.',
    },
    Stack: {
      props: z.object({
        direction: z.enum(['horizontal', 'vertical']).default('vertical'),
        gap: z.enum(['none', 'sm', 'md', 'lg']).default('md'),
        align: z.enum(['start', 'center', 'end', 'stretch']).default('stretch'),
      }),
      slots: ['default'],
      description: 'A flex container that stacks children vertically or horizontally. Use to compose layouts.',
    },
    Badge: {
      props: z.object({
        text: z.string(),
        variant: z.enum(['filled', 'outlined']).default('filled'),
      }),
      slots: [],
      description: 'A small label badge. Good for tags like "serif", "brutalist", etc.',
    },
    Divider: {
      props: z.object({
        style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
      }),
      slots: [],
      description: 'A horizontal visual separator.',
    },
  },
  actions: {},
});
