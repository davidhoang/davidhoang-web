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
    HeroLayoutPreview: {
      props: z.object({
        layout: z.enum(['stacked-fan', 'editorial', 'scattered', 'rolodex', 'cinematic']),
        label: z.string().optional(),
      }),
      slots: [],
      description: 'A compact visual preview of the generated hero layout direction.',
    },
    ShaderPreview: {
      props: z.object({
        type: z.enum(['none', 'grain', 'mesh-gradient', 'neuro', 'waves', 'dot-grid', 'swirl', 'perlin', 'simplex']),
        colors: z.array(z.string()).default([]),
      }),
      slots: [],
      description: 'A miniature shader/motion mood preview using theme colors.',
    },
    ThemeManifesto: {
      props: z.object({
        text: z.string().describe('A short editorial statement about the theme mood'),
        emphasis: z.enum(['quiet', 'bold', 'experimental']).default('bold'),
      }),
      slots: [],
      description: 'A short expressive manifesto or mood statement for a generated daily theme.',
    },
    ThemeMeta: {
      props: z.object({
        items: z.array(z.object({
          label: z.string(),
          value: z.string(),
        })),
      }),
      slots: [],
      description: 'A compact key-value list for theme attributes like hero, grid, shader, or color scheme.',
    },
    TokenGrid: {
      props: z.object({
        tokens: z.array(z.object({
          name: z.string(),
          value: z.string(),
        })),
      }),
      slots: [],
      description: 'A compact grid of generated design token names and values.',
    },
    ThemeActionButton: {
      props: z.object({
        label: z.string(),
        action: z.enum(['apply-theme', 'copy-palette']),
        date: z.string().optional(),
        payload: z.string().optional(),
      }),
      slots: [],
      description: 'An interactive button for applying a theme or copying generated theme details.',
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
    TimelineEntry: {
      props: z.object({
        year: z.string().describe('Year or date range, e.g. "2019" or "2019-2023"'),
        title: z.string().describe('Event or role title'),
        description: z.string().optional().describe('Brief description of the event'),
        type: z.enum(['moment', 'career', 'inspiration', 'event', 'spark', 'possiblePath']).default('moment').describe('Node type'),
      }),
      slots: [],
      description: 'A timeline entry showing a career event, inspiration, or milestone. Color-coded by type.',
    },
    Heading: {
      props: z.object({
        text: z.string(),
        level: z.enum(['h2', 'h3', 'h4']).default('h3'),
      }),
      slots: [],
      description: 'A section heading. Use to introduce groups of timeline entries or narrative sections.',
    },
    Prose: {
      props: z.object({
        text: z.string().describe('Narrative text or commentary'),
      }),
      slots: [],
      description: 'A paragraph of narrative text. Use for AI-generated commentary connecting career events.',
    },
  },
  actions: {},
});
