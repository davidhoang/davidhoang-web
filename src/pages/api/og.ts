import type { APIRoute } from 'astro';
import { ImageResponse } from '@vercel/og';
import { clampTitleFontSize, truncateDescription, typeLabel as toTypeLabel } from './og-helpers';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const title = url.searchParams.get('title') || 'davidhoang.com';
  const description = url.searchParams.get('description') || '';
  const type = url.searchParams.get('type') || 'writing';

  const titleFontSize = clampTitleFontSize(title.length);
  const typeLabel = toTypeLabel(type);

  const html = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#fafaf9',
        padding: '0',
        position: 'relative',
        overflow: 'hidden',
      },
      children: [
        // Large faded "DH" monogram in background
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: '-40px',
              right: '-20px',
              fontSize: '320px',
              fontWeight: 900,
              color: 'rgba(0, 0, 0, 0.03)',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1,
              letterSpacing: '-0.04em',
            },
            children: 'DH',
          },
        },
        // Main content area
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              flexGrow: 1,
              padding: '60px 72px 0 72px',
            },
            children: [
              // Type badge
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    marginBottom: '20px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#888',
                          fontFamily: 'Inter, sans-serif',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        },
                        children: typeLabel,
                      },
                    },
                  ],
                },
              },
              // Title
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: `${titleFontSize}px`,
                    fontWeight: 700,
                    color: '#1a1a1a',
                    lineHeight: 1.1,
                    fontFamily: 'Inter, sans-serif',
                    letterSpacing: '-0.03em',
                    marginBottom: description ? '20px' : '0',
                    maxWidth: '900px',
                  },
                  children: title,
                },
              },
              // Description (if provided)
              ...(description
                ? [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '22px',
                          fontWeight: 400,
                          color: '#666',
                          lineHeight: 1.45,
                          fontFamily: 'Inter, sans-serif',
                          maxWidth: '750px',
                        },
                        children: truncateDescription(description, 120),
                      },
                    },
                  ]
                : []),
            ],
          },
        },
        // Footer bar
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '32px 72px',
              borderTop: '1px solid rgba(0, 0, 0, 0.06)',
              marginTop: '40px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  },
                  children: [
                    // DH mark
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '18px',
                          fontWeight: 800,
                          color: '#1a1a1a',
                          fontFamily: 'Inter, sans-serif',
                        },
                        children: 'DH',
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: '1px',
                          height: '16px',
                          backgroundColor: 'rgba(0, 0, 0, 0.15)',
                        },
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '16px',
                          fontWeight: 400,
                          color: '#888',
                          fontFamily: 'Inter, sans-serif',
                        },
                        children: 'davidhoang.com',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };

  return new ImageResponse(html, {
    width: 1200,
    height: 630,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
