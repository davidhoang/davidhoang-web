import React, { useState, useEffect } from 'react';
import type { Spec } from '@json-render/react';

interface ThemeInfo {
  name: string;
  date: string;
  showcase?: Spec;
}

interface Props {
  themes: ThemeInfo[];
}

/** Extract color palette from a showcase spec */
function extractColors(spec: Spec): Array<{ hex: string; label: string }> {
  if (!spec?.elements) return [];
  for (const el of Object.values(spec.elements) as any[]) {
    if (el.type === 'ColorPalette' && el.props?.colors) {
      return el.props.colors;
    }
  }
  return [];
}

export default function ThemePreviewInline({ themes }: Props) {
  const defaultDate = themes.length > 0 ? themes[0].date : null;
  const [displayDate, setDisplayDate] = useState<string | null>(defaultDate);

  useEffect(() => {
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

  const colors = extractColors(theme.showcase);

  return (
    <div className="theme-preview-inline">
      <div className="theme-preview-compact">
        <span className="theme-preview-name">{theme.name}</span>
        {colors.length > 0 && (
          <div className="theme-color-strip">
            {colors.map((c, i) => (
              <div
                key={i}
                className="theme-color-dot"
                style={{ background: c.hex }}
                title={c.label}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
