import React, { useState, useEffect } from 'react';
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

export default function ThemePreviewInline({ themes }: Props) {
  // Default to the most recent theme so the preview is always visible
  const defaultDate = themes.length > 0 ? themes[0].date : null;
  const [displayDate, setDisplayDate] = useState<string | null>(defaultDate);

  useEffect(() => {
    // Sync with the active daily theme if one is set
    const checkTheme = () => {
      const date = document.documentElement.getAttribute('data-daily-theme');
      if (date) setDisplayDate(date);
    };

    checkTheme();

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-daily-theme') checkTheme();
      }
    });
    observer.observe(document.documentElement, { attributes: true });

    // Also listen for clicks on calendar days to update immediately
    const calendar = document.getElementById('theme-calendar');
    if (calendar) {
      const handleClick = (e: Event) => {
        const btn = (e.target as HTMLElement).closest('.calendar-day[data-date]');
        if (btn) {
          setDisplayDate(btn.getAttribute('data-date'));
        }
      };
      const grid = calendar.querySelector('.calendar-grid');
      if (grid) {
        grid.addEventListener('click', handleClick);
      }

      return () => {
        observer.disconnect();
        if (grid) grid.removeEventListener('click', handleClick);
      };
    }

    return () => observer.disconnect();
  }, []);

  const theme = themes.find(t => t.date === displayDate);

  if (!theme?.showcase) return null;

  return (
    <div className="theme-preview-inline" style={{ position: 'relative' }}>
      <div className="theme-preview-label">
        <span className="theme-preview-label-text">Preview</span>
        <span className="theme-preview-name">{theme.name}</span>
      </div>
      <div className="theme-preview-render">
        <StateProvider initialState={{}}>
          <VisibilityProvider>
            <ActionProvider handlers={{}}>
              <Renderer spec={theme.showcase} registry={registry} />
            </ActionProvider>
          </VisibilityProvider>
        </StateProvider>
      </div>
    </div>
  );
}
