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

const SHADER_LABELS: Record<string, string> = {
  none: 'still',
  grain: 'film grain',
  'mesh-gradient': 'mesh gradient',
  neuro: 'neural field',
  waves: 'waves',
  'dot-grid': 'dot grid',
  swirl: 'swirl',
  perlin: 'perlin',
  simplex: 'simplex',
};

function dispatchThemeAction(action: string, detail: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(`daily-theme:${action}`, { detail }));
}

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

function HeroLayoutGlyph({ layout }: { layout: string }) {
  const card = (style: React.CSSProperties) => (
    <div
      style={{
        position: 'absolute',
        width: '34%',
        height: '44%',
        borderRadius: 'var(--radius-sm, 4px)',
        background: 'var(--color-link)',
        opacity: 0.78,
        boxShadow: '0 8px 18px rgba(0,0,0,0.12)',
        ...style,
      }}
    />
  );

  switch (layout) {
    case 'editorial':
      return (
        <>
          <div style={{ position: 'absolute', left: '8%', top: '18%', width: '34%', height: '10%', background: 'var(--color-text)', opacity: 0.7, borderRadius: '2px' }} />
          <div style={{ position: 'absolute', left: '8%', top: '34%', width: '24%', height: '7%', background: 'var(--color-muted)', opacity: 0.55, borderRadius: '2px' }} />
          {card({ right: '12%', top: '12%' })}
          {card({ right: '22%', bottom: '10%', opacity: 0.55 })}
        </>
      );
    case 'scattered':
      return (
        <>
          {card({ left: '12%', top: '14%', transform: 'rotate(-12deg)' })}
          {card({ left: '36%', top: '30%', transform: 'rotate(8deg)', opacity: 0.62 })}
          {card({ right: '12%', top: '18%', transform: 'rotate(18deg)', opacity: 0.5 })}
        </>
      );
    case 'rolodex':
      return (
        <>
          {card({ left: '18%', top: '20%', transform: 'skewY(-7deg)', opacity: 0.45 })}
          {card({ left: '33%', top: '14%', transform: 'scale(1.08)', opacity: 0.86 })}
          {card({ right: '18%', top: '20%', transform: 'skewY(7deg)', opacity: 0.45 })}
        </>
      );
    case 'cinematic':
      return (
        <>
          {card({ left: '8%', top: '12%', width: '54%', height: '58%', opacity: 0.82 })}
          <div style={{ position: 'absolute', right: '9%', top: '18%', width: '24%', height: '12%', background: 'var(--color-border)', borderRadius: '2px' }} />
          <div style={{ position: 'absolute', right: '9%', top: '40%', width: '24%', height: '12%', background: 'var(--color-border)', borderRadius: '2px' }} />
          <div style={{ position: 'absolute', right: '9%', top: '62%', width: '24%', height: '12%', background: 'var(--color-border)', borderRadius: '2px' }} />
        </>
      );
    default:
      return (
        <>
          {card({ left: '20%', top: '20%', transform: 'rotate(-8deg)', opacity: 0.52 })}
          {card({ left: '33%', top: '14%', transform: 'rotate(0deg)', opacity: 0.85 })}
          {card({ right: '20%', top: '20%', transform: 'rotate(8deg)', opacity: 0.52 })}
        </>
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

    HeroLayoutPreview: ({ props }) => (
      <div style={{
        padding: '0.75rem',
        background: 'linear-gradient(135deg, var(--color-card-bg), var(--color-bg))',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm, 4px)',
      }}>
        <div style={{
          position: 'relative',
          minHeight: '76px',
          overflow: 'hidden',
          borderRadius: 'var(--radius-sm, 4px)',
          background: 'color-mix(in srgb, var(--color-link) 8%, var(--color-bg))',
        }}>
          <HeroLayoutGlyph layout={props.layout} />
        </div>
        <p style={{
          fontSize: '0.65rem',
          color: 'var(--color-muted)',
          margin: '0.5rem 0 0',
          textAlign: 'center',
        }}>
          {props.label || props.layout}
        </p>
      </div>
    ),

    ShaderPreview: ({ props }) => {
      const colors = props.colors.length > 0 ? props.colors : ['var(--color-link)', 'var(--color-card-bg)', 'var(--color-bg)'];
      const gradient = `radial-gradient(circle at 20% 20%, ${colors[0]} 0, transparent 34%), radial-gradient(circle at 78% 30%, ${colors[1] || colors[0]} 0, transparent 32%), radial-gradient(circle at 52% 82%, ${colors[2] || colors[0]} 0, transparent 36%), var(--color-bg)`;
      return (
        <div style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm, 4px)',
          overflow: 'hidden',
          background: 'var(--color-card-bg)',
        }}>
          <div style={{
            minHeight: '72px',
            background: gradient,
            filter: props.type === 'grain' ? 'contrast(1.15) saturate(0.85)' : 'saturate(1.15)',
            opacity: props.type === 'none' ? 0.55 : 0.9,
          }} />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 0.6rem',
            fontSize: '0.65rem',
            color: 'var(--color-muted)',
            borderTop: '1px solid var(--color-border)',
          }}>
            <span>{SHADER_LABELS[props.type] || props.type}</span>
            <span>{colors.length} colors</span>
          </div>
        </div>
      );
    },

    ThemeManifesto: ({ props }) => (
      <blockquote style={{
        margin: 0,
        padding: props.emphasis === 'experimental' ? '1rem 1rem 1rem 1.15rem' : '0.75rem 0 0.75rem 0.9rem',
        borderLeft: `3px solid var(--color-link)`,
        color: 'var(--color-text)',
        fontFamily: 'var(--font-heading)',
        fontSize: props.emphasis === 'quiet' ? '1rem' : '1.2rem',
        fontWeight: props.emphasis === 'quiet' ? 500 : ('var(--heading-weight, 700)' as any),
        letterSpacing: 'var(--heading-letter-spacing, -0.02em)',
        lineHeight: 1.2,
        background: props.emphasis === 'experimental'
          ? 'color-mix(in srgb, var(--color-link) 9%, transparent)'
          : 'transparent',
        borderRadius: props.emphasis === 'experimental' ? 'var(--radius-sm, 4px)' : 0,
      }}>
        {props.text}
      </blockquote>
    ),

    ThemeMeta: ({ props }) => (
      <dl style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(92px, 1fr))',
        gap: '0.5rem',
        margin: 0,
      }}>
        {props.items.map((item, index) => (
          <div key={`${item.label}-${index}`} style={{
            padding: '0.5rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm, 4px)',
            background: 'var(--color-bg)',
          }}>
            <dt style={{
              color: 'var(--color-muted)',
              fontSize: '0.6rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.2rem',
            }}>
              {item.label}
            </dt>
            <dd style={{
              color: 'var(--color-text)',
              fontSize: '0.78rem',
              margin: 0,
              fontWeight: 600,
            }}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    ),

    TokenGrid: ({ props }) => (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '0.45rem',
      }}>
        {props.tokens.map((token, index) => (
          <code key={`${token.name}-${index}`} style={{
            display: 'block',
            padding: '0.45rem 0.5rem',
            color: 'var(--color-text)',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm, 4px)',
            fontSize: '0.65rem',
            lineHeight: 1.35,
            whiteSpace: 'normal',
          }}>
            <span style={{ color: 'var(--color-muted)' }}>{token.name}</span>
            <br />
            {token.value}
          </code>
        ))}
      </div>
    ),

    ThemeActionButton: ({ props }) => (
      <button
        type="button"
        onClick={() => {
          if (props.action === 'apply-theme') {
            dispatchThemeAction('apply', { date: props.date });
          } else {
            dispatchThemeAction('copy-palette', { payload: props.payload });
          }
        }}
        style={{
          alignSelf: 'flex-start',
          padding: '0.45rem 0.75rem',
          border: '1px solid var(--color-link)',
          borderRadius: 'var(--radius-lg, 999px)',
          background: props.action === 'apply-theme' ? 'var(--color-link)' : 'transparent',
          color: props.action === 'apply-theme' ? 'var(--color-bg)' : 'var(--color-link)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {props.label}
      </button>
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

    TimelineEntry: ({ props }) => {
      const typeColors: Record<string, string> = {
        career: 'var(--color-link)',
        inspiration: '#e67e22',
        event: 'var(--color-muted)',
        spark: '#9b59b6',
        possiblePath: '#95a5a6',
      };
      const dotColor = typeColors[props.type] || 'var(--color-muted)';
      return (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: dotColor,
            marginTop: '0.35rem',
            flexShrink: 0,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: dotColor,
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.02em',
              }}>
                {props.year}
              </span>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 'var(--heading-weight, 600)' as any,
                fontSize: '0.95rem',
                color: 'var(--color-text)',
              }}>
                {props.title}
              </span>
            </div>
            {props.description && (
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--color-muted)',
                margin: '0.2rem 0 0',
                lineHeight: 1.5,
                fontFamily: 'var(--font-body)',
              }}>
                {props.description}
              </p>
            )}
          </div>
        </div>
      );
    },

    Heading: ({ props }) => {
      const Tag = (props.level || 'h3') as keyof React.JSX.IntrinsicElements;
      const sizes: Record<string, string> = { h2: '1.4rem', h3: '1.15rem', h4: '1rem' };
      return (
        <Tag style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 'var(--heading-weight, 700)' as any,
          fontSize: sizes[props.level || 'h3'],
          letterSpacing: 'var(--heading-letter-spacing, -0.02em)',
          color: 'var(--color-text)',
          margin: 0,
          lineHeight: 1.3,
        }}>
          {props.text}
        </Tag>
      );
    },

    Prose: ({ props }) => (
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '0.9rem',
        lineHeight: 'var(--body-line-height, 1.6)',
        color: 'var(--color-text)',
        margin: 0,
      }}>
        {props.text}
      </p>
    ),
  },
});
