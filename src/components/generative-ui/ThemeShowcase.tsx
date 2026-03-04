import React, { useState } from 'react';
import { Renderer, StateProvider, VisibilityProvider, ActionProvider, type Spec } from '@json-render/react';
import { registry } from './registry';

interface ThemeInfo {
  name: string;
  date: string;
  showcase?: Spec;
}

interface Props {
  themes: ThemeInfo[];
}

export default function ThemeShowcase({ themes }: Props) {
  const [index, setIndex] = useState(0);
  const themesWithShowcase = themes.filter(t => t.showcase);

  if (themesWithShowcase.length === 0) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--color-muted)',
        fontSize: '0.9rem',
      }}>
        <p style={{ margin: 0 }}>No generative previews yet.</p>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem' }}>
          Run <code style={{ background: 'var(--color-sidebar-bg)', padding: '0.15rem 0.4rem', borderRadius: '3px' }}>npm run generate-theme</code> to create one.
        </p>
      </div>
    );
  }

  const current = themesWithShowcase[index];

  return (
    <div>
      <div style={{ marginBottom: '0.75rem' }}>
        <StateProvider initialState={{}}>
          <VisibilityProvider>
            <ActionProvider handlers={{}}>
              <Renderer spec={current.showcase!} registry={registry} />
            </ActionProvider>
          </VisibilityProvider>
        </StateProvider>
      </div>
      {themesWithShowcase.length > 1 && (
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          {themesWithShowcase.map((t, i) => (
            <button
              key={t.date}
              onClick={() => setIndex(i)}
              style={{
                padding: '0.3rem 0.6rem',
                fontSize: '0.75rem',
                border: `1px solid ${i === index ? 'var(--color-link)' : 'var(--color-border)'}`,
                background: i === index ? 'var(--color-link)' : 'var(--color-bg)',
                color: i === index ? 'var(--color-bg)' : 'var(--color-text)',
                borderRadius: 'var(--radius-sm, 4px)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
