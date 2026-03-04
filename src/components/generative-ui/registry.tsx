import React from 'react';
import { defineRegistry } from '@json-render/react';
import { themeCatalog } from './catalog';

const GAP_MAP = { none: '0', sm: '0.25rem', md: '0.75rem', lg: '1.5rem' } as const;

const ALIGN_MAP = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
} as const;

/** Mini wireframe blocks for layout preview */
function LayoutBlocks({ style }: { style: string }) {
  const block = (w: string, h: string) => (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: '2px',
        background: 'var(--color-border)',
        opacity: 0.5,
      }}
    />
  );

  switch (style) {
    case 'magazine':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '4px', width: '100%' }}>
          {block('100%', '40px')}
          {block('100%', '18px')}
          {block('100%', '18px')}
          {block('100%', '40px')}
        </div>
      );
    case 'sidebar':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '4px', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {block('100%', '12px')}
            {block('100%', '12px')}
            {block('100%', '12px')}
          </div>
          {block('100%', '44px')}
        </div>
      );
    case 'split':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', width: '100%' }}>
          {block('100%', '32px')}
          {block('100%', '32px')}
        </div>
      );
    case 'asymmetric':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '4px', width: '100%' }}>
          {block('100%', '28px')}
          {block('100%', '28px')}
          {block('100%', '28px')}
        </div>
      );
    default: // standard
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', width: '100%' }}>
          {block('100%', '24px')}
          {block('100%', '24px')}
          {block('100%', '24px')}
          {block('100%', '24px')}
        </div>
      );
  }
}

export const { registry } = defineRegistry(themeCatalog, {
  components: {
    ThemeCard: ({ props, children }) => (
      <div
        style={{
          background: 'var(--color-card-bg, var(--color-sidebar-bg))',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--card-padding, 1.5rem)',
          boxShadow: 'var(--card-shadow, none)',
        }}
      >
        {props.title && (
          <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 'var(--heading-weight, 700)' as any,
            letterSpacing: 'var(--heading-letter-spacing, -0.02em)',
            margin: '0 0 0.25rem 0',
            fontSize: '1.3rem',
            color: 'var(--color-text)',
          }}>
            {props.title}
          </h3>
        )}
        {props.subtitle && (
          <p style={{
            color: 'var(--color-muted)',
            margin: '0 0 1rem 0',
            fontSize: '0.85rem',
            lineHeight: 'var(--body-line-height, 1.6)',
          }}>
            {props.subtitle}
          </p>
        )}
        {children}
      </div>
    ),

    ColorSwatch: ({ props }) => (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-sm, 4px)',
            background: props.color,
            border: '1px solid var(--color-border)',
          }}
        />
        <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
          {props.label}
        </span>
      </div>
    ),

    ColorPalette: ({ props }) => (
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {props.colors.map((c, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm, 4px)',
                background: c.hex,
                border: '1px solid var(--color-border)',
              }}
            />
            <span style={{ fontSize: '0.6rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    ),

    TypeSample: ({ props }) => {
      const styles: Record<string, React.CSSProperties> = {
        heading: {
          fontFamily: 'var(--font-heading)',
          fontWeight: 'var(--heading-weight, 700)' as any,
          fontSize: '1.5rem',
          letterSpacing: 'var(--heading-letter-spacing, -0.02em)',
          textTransform: 'var(--heading-transform, none)' as any,
          color: 'var(--color-text)',
          margin: 0,
          lineHeight: 1.2,
        },
        body: {
          fontFamily: 'var(--font-body)',
          fontWeight: props.weight || ('var(--body-weight, 400)' as any),
          fontSize: '1rem',
          lineHeight: 'var(--body-line-height, 1.6)',
          letterSpacing: 'var(--letter-spacing, 0)',
          color: 'var(--color-text)',
          margin: 0,
        },
        caption: {
          fontFamily: 'var(--font-body)',
          fontSize: '0.75rem',
          color: 'var(--color-muted)',
          margin: 0,
          lineHeight: 1.4,
        },
      };
      const Tag = props.variant === 'heading' ? 'h4' : 'p';
      return <Tag style={styles[props.variant] || styles.body}>{props.text}</Tag>;
    },

    LayoutPreview: ({ props }) => (
      <div style={{
        padding: '0.75rem',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm, 4px)',
      }}>
        <LayoutBlocks style={props.style} />
        <p style={{
          fontSize: '0.65rem',
          color: 'var(--color-muted)',
          margin: '0.5rem 0 0',
          textAlign: 'center',
        }}>
          {props.style}
        </p>
      </div>
    ),

    Stack: ({ props, children }) => (
      <div
        style={{
          display: 'flex',
          flexDirection: props.direction === 'horizontal' ? 'row' : 'column',
          gap: GAP_MAP[props.gap as keyof typeof GAP_MAP] || GAP_MAP.md,
          alignItems: ALIGN_MAP[props.align as keyof typeof ALIGN_MAP] || 'stretch',
        }}
      >
        {children}
      </div>
    ),

    Badge: ({ props }) => (
      <span
        style={{
          display: 'inline-block',
          padding: '0.15rem 0.5rem',
          fontSize: '0.7rem',
          fontWeight: 500,
          borderRadius: 'var(--radius-lg, 999px)',
          ...(props.variant === 'outlined'
            ? {
                border: '1px solid var(--color-link)',
                color: 'var(--color-link)',
                background: 'transparent',
              }
            : {
                background: 'var(--color-link)',
                color: 'var(--color-bg)',
              }),
        }}
      >
        {props.text}
      </span>
    ),

    Divider: ({ props }) => (
      <hr
        style={{
          border: 'none',
          borderTop: `1px ${props.style || 'solid'} var(--color-border)`,
          margin: '0.5rem 0',
          width: '100%',
        }}
      />
    ),
  },
});
