import { z } from 'zod';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const boundedNumberString = (min, max) => z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .refine((value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= min && parsed <= max;
  }, { message: `Expected a number from ${min} to ${max}` });

const boundedLength = (unit, min, max) => z
  .string()
  .trim()
  .regex(new RegExp(`^-?\\d+(?:\\.\\d+)?${unit}$`))
  .refine((value) => {
    const parsed = Number.parseFloat(value);
    return parsed >= min && parsed <= max;
  }, { message: `Expected ${min}${unit} to ${max}${unit}` });

const colorPaletteSchema = z.object({
  '--color-text': z.string().regex(HEX_COLOR),
  '--color-bg': z.string().regex(HEX_COLOR),
  '--color-link': z.string().regex(HEX_COLOR),
  '--color-link-hover': z.string().regex(HEX_COLOR),
  '--color-border': z.string().regex(HEX_COLOR),
  '--color-muted': z.string().regex(HEX_COLOR),
  '--color-sidebar-bg': z.string().regex(HEX_COLOR),
  '--color-nav-bg': z.string().regex(HEX_COLOR),
  '--color-nav-text': z.string().regex(HEX_COLOR),
  '--color-card-bg': z.string().regex(HEX_COLOR),
}).strict();

const themeOutputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(320),
  colors: z.object({
    colorScheme: z.enum(['complementary', 'triadic', 'analogous', 'split-complementary']),
    contrastMode: z.enum(['standard', 'high', 'low']),
    light: colorPaletteSchema,
    dark: colorPaletteSchema,
  }).strict(),
  fonts: z.object({
    heading: z.string().trim().min(1).max(80),
    body: z.string().trim().min(1).max(80),
  }).strict(),
  typography: z.object({
    headingWeight: boundedNumberString(100, 900),
    bodyWeight: boundedNumberString(100, 900),
    bodyLineHeight: boundedNumberString(1.5, 2),
    letterSpacing: boundedLength('em', -0.03, 0.05),
    headingLetterSpacing: boundedLength('em', -0.04, 0.08),
    headingTransform: z.enum(['none', 'uppercase', 'lowercase']),
    scaleRatio: boundedNumberString(1.2, 2),
    fontVariationSettings: z.literal('normal').optional().default('normal'),
  }).strict(),
  cards: z.object({
    style: z.enum(['flat', 'elevated', 'outlined', 'filled']),
    shadow: z.enum([
      'none',
      '0 2px 8px rgba(0,0,0,0.08)',
      '0 8px 32px rgba(0,0,0,0.12)',
      '0 24px 48px rgba(0,0,0,0.2)',
    ]),
    borderWidth: boundedLength('px', 0, 3),
    padding: boundedLength('rem', 1, 2),
  }).strict(),
  layout: z.object({
    borderRadius: boundedLength('px', 0, 24),
    containerMaxWidth: boundedLength('px', 640, 1200),
    sectionSpacing: boundedLength('rem', 2, 6),
    contentPadding: boundedLength('rem', 1, 2),
    gridStyle: z.enum(['standard', 'asymmetric', 'split', 'magazine', 'sidebar']),
  }).strict(),
  hero: z.object({
    layout: z.enum(['stacked-fan', 'editorial', 'scattered', 'rolodex', 'cinematic']),
  }).strict(),
  links: z.object({
    style: z.enum(['underline', 'highlight', 'animated-underline', 'color-only', 'bracket']),
  }).strict(),
  background: z.object({
    texture: z.enum(['none', 'grain', 'dots', 'grid', 'gradient']),
  }).strict(),
  images: z.object({
    style: z.enum(['vivid', 'muted', 'grayscale', 'duotone']),
    hover: z.enum(['zoom', 'lift', 'colorize', 'glow', 'none']),
    opacity: boundedNumberString(0.85, 1),
    borderRadius: boundedLength('px', 0, 24),
  }).strict(),
  footer: z.object({
    style: z.enum(['classic', 'minimal', 'brutalist', 'inverted', 'editorial', 'gradient', 'boxed', 'retro', 'split', 'marquee']),
  }).strict(),
  shader: z.object({
    type: z.enum(['none', 'grain', 'mesh-gradient', 'neuro', 'waves', 'dot-grid', 'swirl', 'perlin', 'simplex']),
    colors: z.array(z.string().regex(HEX_COLOR)).max(4).optional().default([]),
  }).strict(),
}).strict();

export function validateGeneratedTheme(value) {
  const result = themeOutputSchema.safeParse(value);
  if (result.success) return result.data;

  const details = result.error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join('.') || 'theme'}: ${issue.message}`)
    .join('; ');
  throw new Error(`Theme output failed schema validation: ${details}`);
}
