import React from 'react';
import {
  Renderer,
  StateProvider,
  VisibilityProvider,
  ActionProvider,
  type Spec,
} from '@json-render/react';
import { registry } from './registry';

export interface ThemeData {
  name: string;
  date: string;
  description: string;
  colors?: {
    colorScheme?: string;
    contrastMode?: string;
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
  fonts?: {
    heading?: { name: string; category: string; stack?: string };
    body?: { name: string; category: string; stack?: string };
  };
  typography?: Record<string, string>;
  cards?: { style?: string; shadow?: string; borderWidth?: string; padding?: string };
  layout?: {
    borderRadius?: string;
    containerMaxWidth?: string;
    sectionSpacing?: string;
    contentPadding?: string;
    gridStyle?: string;
  };
  background?: { texture?: string };
  hero?: { layout?: string };
  links?: { style?: string };
  images?: { style?: string; hover?: string; opacity?: string; borderRadius?: string };
  footer?: { style?: string };
  shader?: { type?: string; colors?: string[] };
  showcase?: Spec;
}

type ThemeScopeStyle = React.CSSProperties & Record<string, string | number | undefined>;

const THEME_PROP_MAP: [string, string][] = [
  ['headingWeight', '--heading-weight'],
  ['bodyWeight', '--body-weight'],
  ['bodyLineHeight', '--body-line-height'],
  ['letterSpacing', '--letter-spacing-body'],
  ['headingLetterSpacing', '--heading-letter-spacing'],
  ['headingTransform', '--heading-transform'],
  ['scaleRatio', '--scale-ratio'],
  ['fontVariationSettings', '--font-variation-settings'],
];

function buildThemeScopeStyle(theme?: ThemeData): ThemeScopeStyle | undefined {
  if (!theme) return undefined;

  const style: ThemeScopeStyle = {
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    borderRadius: 'var(--radius-md, 8px)',
  };

  for (const [key, value] of Object.entries(theme.colors?.light || {})) {
    style[key] = value;
  }

  for (const [key, prop] of THEME_PROP_MAP) {
    const value = theme.typography?.[key];
    if (value) style[prop] = value;
  }

  if (theme.fonts?.heading?.stack) style['--font-heading'] = theme.fonts.heading.stack;
  if (theme.fonts?.body?.stack) {
    style['--font-body'] = theme.fonts.body.stack;
    style['--font-primary'] = theme.fonts.body.stack;
  }

  if (theme.cards?.borderWidth) style['--card-border-width'] = theme.cards.borderWidth;
  if (theme.cards?.padding) style['--card-padding'] = theme.cards.padding;
  style['--card-shadow'] = theme.cards?.shadow && theme.cards.shadow !== 'none' ? theme.cards.shadow : 'none';

  if (theme.layout?.borderRadius) {
    const radius = theme.layout.borderRadius;
    style['--radius-sm'] = radius === '0px' ? '0px' : `calc(${radius} * 0.5)`;
    style['--radius-md'] = radius;
    style['--radius-lg'] = `calc(${radius} * 1.5)`;
    style['--radius-xl'] = `calc(${radius} * 2)`;
  }

  return style;
}

interface ThemeSpecRendererProps {
  spec: Spec;
  theme?: ThemeData;
  className?: string;
}

export default function ThemeSpecRenderer({ spec, theme, className }: ThemeSpecRendererProps) {
  const initialState = {
    theme: theme
      ? {
          name: theme.name,
          date: theme.date,
          colorScheme: theme.colors?.colorScheme,
          contrastMode: theme.colors?.contrastMode,
          cardStyle: theme.cards?.style,
          gridStyle: theme.layout?.gridStyle,
          heroLayout: theme.hero?.layout,
          shader: theme.shader?.type,
        }
      : null,
  };

  return (
    <div className={className} style={buildThemeScopeStyle(theme)}>
      <StateProvider initialState={initialState}>
        <VisibilityProvider>
          <ActionProvider handlers={{}}>
            <Renderer spec={spec} registry={registry} />
          </ActionProvider>
        </VisibilityProvider>
      </StateProvider>
    </div>
  );
}
