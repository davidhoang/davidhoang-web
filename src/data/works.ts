/**
 * Works index — table of contents for talks, portfolio case studies, and role writeups.
 * Add entries here; portfolio pages can land later at paths like /works/slug.
 */
export type WorkKind = 'talk' | 'portfolio' | 'role';

export type WorkEntry = {
  /** Stable id for future deep links / portfolio routes */
  id: string;
  title: string;
  /** One-line context under the title */
  summary: string;
  kind: WorkKind;
  /** Year or year range shown in the margin, e.g. "2024" or "2022–2024" */
  when: string;
  /**
   * Destination when the entry is live.
   * Omit (or leave empty) for upcoming portfolio/role pages.
   */
  href?: string;
  /** Open in a new tab (external talks, etc.) */
  external?: boolean;
};

const WORK_KIND_LABELS: Record<WorkKind, string> = {
  talk: 'Talk',
  portfolio: 'Portfolio',
  role: 'Role',
};

export function workKindLabel(kind: WorkKind): string {
  return WORK_KIND_LABELS[kind];
}

export const works: WorkEntry[] = [
  {
    id: 'atlassian-ai-ecosystem',
    title: 'Atlassian — AI & Ecosystem',
    summary: 'Leading design for Rovo, AI, and the Atlassian ecosystem.',
    kind: 'role',
    when: '2024–',
    // Portfolio / role page to come
  },
  {
    id: 'config-2025-maturing-teams',
    title: 'Config 2025: Maturing your teams & your leadership',
    summary: 'Figma Config talk on scaling design orgs and leadership.',
    kind: 'talk',
    when: '2025',
    href: 'https://www.youtube.com/watch?v=xkriqGkodQA',
    external: true,
  },
  {
    id: 'hatch-2024-design-and-blank',
    title: 'Hatch Conference: Design and (Blank)',
    summary: 'Keynote on design’s expanding blank — craft, systems, and what’s next.',
    kind: 'talk',
    when: '2024',
    href: 'https://www.youtube.com/watch?v=4lWYcr53kyI',
    external: true,
  },
  {
    id: 'replit-marketing-design',
    title: 'Replit — Marketing & Design',
    summary: 'VP of Marketing and Design through rebrand and Developer Day.',
    kind: 'role',
    when: '2022–2024',
  },
  {
    id: 'webflow-head-of-design',
    title: 'Webflow — Head of Design',
    summary: 'First Head of Design; building the design function as the product scaled.',
    kind: 'role',
    when: '2018–2022',
  },
  {
    id: 'inspirato',
    title: 'Inspirato',
    summary: 'Product design work with Black Pixel.',
    kind: 'portfolio',
    when: '2015',
    // Case study page to come: /works/inspirato
  },
  {
    id: 'twitter-camera',
    title: 'Twitter Camera',
    summary: 'Selected product work on Twitter’s camera experience.',
    kind: 'portfolio',
    when: '—',
    // Case study page to come: /works/twitter-camera
  },
];
