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
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  useEffect(() => {
    // Track the active daily theme via the root attribute
    const checkTheme = () => {
      const date = document.documentElement.getAttribute('data-daily-theme');
      setActiveDate(date);
    };

    checkTheme();

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-daily-theme') checkTheme();
      }
    });
    observer.observe(document.documentElement, { attributes: true });

    // Hover preview: show a theme's showcase when hovering its calendar button
    const calendar = document.getElementById('theme-calendar');
    if (calendar) {
      const handleMouseOver = (e: Event) => {
        const btn = (e.target as HTMLElement).closest('.calendar-day[data-date]');
        if (btn) {
          setHoveredDate(btn.getAttribute('data-date'));
        }
      };
      const handleMouseOut = (e: Event) => {
        const related = (e as MouseEvent).relatedTarget as HTMLElement | null;
        if (!related || !calendar.contains(related)) {
          setHoveredDate(null);
        }
      };
      // Use event delegation on the grid for efficiency
      const grid = calendar.querySelector('.calendar-grid');
      if (grid) {
        grid.addEventListener('mouseover', handleMouseOver);
        grid.addEventListener('mouseout', handleMouseOut);
      }

      return () => {
        observer.disconnect();
        if (grid) {
          grid.removeEventListener('mouseover', handleMouseOver);
          grid.removeEventListener('mouseout', handleMouseOut);
        }
      };
    }

    return () => observer.disconnect();
  }, []);

  const displayDate = hoveredDate || activeDate;
  const theme = themes.find(t => t.date === displayDate);

  if (!theme?.showcase) return null;

  return (
    <div className="theme-preview-inline" style={{ position: 'relative' }}>
      <div className="theme-preview-label">
        <span className="theme-preview-label-text">
          {hoveredDate && hoveredDate !== activeDate ? 'Preview' : 'Active'}
        </span>
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
