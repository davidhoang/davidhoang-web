import type { APIRoute } from 'astro';
import { ImageResponse } from '@vercel/og';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const title = url.searchParams.get('title') || 'davidhoang.com';
  const description = url.searchParams.get('description') || '';
  const type = url.searchParams.get('type') || 'writing';

  const accentColor = type === 'notes' ? '#86efac' : '#a5b4fc';

  // Clamp font size for long titles
  const titleLength = title.length;
  const titleFontSize = titleLength > 80 ? 36 : titleLength > 50 ? 42 : 48;

  const html = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
        padding: '0',
      },
      children: [
        // Top accent line
        {
          type: 'div',
          props: {
            style: {
              width: '100%',
              height: '4px',
              backgroundColor: accentColor,
            },
          },
        },
        // Content area
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flexGrow: 1,
              padding: '60px 80px',
            },
            children: [
              // Title
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: `${titleFontSize}px`,
                    fontWeight: 700,
                    color: '#ffffff',
                    lineHeight: 1.2,
                    fontFamily: 'Inter, sans-serif',
                    marginBottom: description ? '24px' : '0',
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
                          fontSize: '24px',
                          fontWeight: 400,
                          color: '#888888',
                          lineHeight: 1.4,
                          fontFamily: 'Inter, sans-serif',
                        },
                        children:
                          description.length > 120
                            ? description.slice(0, 117) + '...'
                            : description,
                      },
                    },
                  ]
                : []),
            ],
          },
        },
        // Footer
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 80px 40px 80px',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '20px',
                    fontWeight: 500,
                    color: '#666666',
                    fontFamily: 'Inter, sans-serif',
                  },
                  children: 'davidhoang.com',
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#555555',
                    fontFamily: 'Inter, sans-serif',
                    textTransform: 'capitalize',
                  },
                  children: type,
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
