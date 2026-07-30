/**
 * Works index — career role cards + one-off event lines (talks, launches, milestones).
 * Add portfolio case studies later at paths like /works/slug.
 *
 * Published at /works (indexable + sitemap) but not linked from top nav, footer, or ⌘K yet.
 * Add to navigation.ts when ready to promote in site IA.
 */
export type WorkKind = 'role' | 'talk' | 'event' | 'portfolio';

/** How the entry renders on /works */
export type WorkPresentation = 'card' | 'line';

export type WorkEntry = {
  id: string;
  title: string;
  kind: WorkKind;
  /** Year or range shown in the margin / card meta */
  when: string;
  /**
   * Role cards: longer body copy.
   * Lines: optional quiet supporting sentence (often omitted for clean talk rows).
   */
  summary?: string;
  /** Role / company subtitle on cards, e.g. "VP of Design, Rovo & AI and Ecosystem" */
  role?: string;
  /** Optional highlight bullets on career cards */
  highlights?: string[];
  href?: string;
  external?: boolean;
};

export function workPresentation(entry: WorkEntry): WorkPresentation {
  return entry.kind === 'role' ? 'card' : 'line';
}

const WORK_KIND_LABELS: Record<WorkKind, string> = {
  role: 'Role',
  talk: 'Talk',
  event: 'Event',
  portfolio: 'Portfolio',
};

export function workKindLabel(kind: WorkKind): string {
  return WORK_KIND_LABELS[kind];
}

/**
 * Chronological stream (newest first).
 * Sourced from LinkedIn (linkedin.com/in/dhoang2), Featured, About, and public PoC/homepage highlights.
 * X/Twitter (@davidhoang) could not be fetched (403); LinkedIn posts cover the same milestones.
 */
export const works: WorkEntry[] = [
  // —— 2026 ——
  {
    id: 'hatch-ateliers-2026',
    title: 'Hatch Leadership Ateliers, Amsterdam',
    kind: 'talk',
    when: '2026',
    href: 'https://leadershipateliers.com/',
    external: true,
  },

  // —— Career: Atlassian ——
  {
    id: 'atlassian-ai-ecosystem',
    title: 'Atlassian',
    role: 'VP of Design, Rovo & AI and Ecosystem',
    summary:
      'Leading design for Rovo, AI, and the Atlassian ecosystem — building AI teammates into the tools teams already live in.',
    kind: 'role',
    when: '2024–',
    highlights: [
      'AI-native product experiences across Jira and the Teamwork Graph',
      'Design leadership for Agent Experience and ecosystem surfaces',
    ],
  },

  // —— 2025 talks ——
  {
    id: 'nycxdesign-2025',
    title: 'NYCxDESIGN: The future of software design',
    kind: 'talk',
    when: '2025',
    href: 'https://nycxdesign.org/nycxdesign-talk-with-will-hall-designing-intelligence/',
    external: true,
  },
  {
    id: 'config-2025-maturing-teams',
    title: 'Config 2025: Maturing your teams & your leadership',
    kind: 'talk',
    when: '2025',
    href: 'https://www.youtube.com/watch?v=xkriqGkodQA',
    external: true,
  },

  // —— 2024 one-offs ——
  {
    id: 'hatch-2024-design-and-blank',
    title: 'Hatch Conference: Design & (Blank)',
    kind: 'talk',
    when: '2024',
    href: 'https://www.youtube.com/watch?v=4lWYcr53kyI',
    external: true,
  },
  {
    id: 'replit-developer-day-2024',
    title: 'Replit Developer Day',
    kind: 'event',
    when: '2024',
    href: 'https://www.youtube.com/watch?v=T6R9nx89bY4',
    external: true,
  },

  // —— Career: Replit ——
  {
    id: 'replit-marketing-design',
    title: 'Replit',
    role: 'VP of Marketing and Design',
    summary:
      'Joined as an advisor, then led marketing and design through rebrand, AI-native product moments, and Developer Day.',
    kind: 'role',
    when: '2022–2024',
    highlights: [
      'New brand and replit.com',
      'Replit Core membership and Replit Teams',
      'Research, AI innovation, and Developer Day',
    ],
  },

  {
    id: 'play-advisor',
    title: 'Joined Play as Advisor',
    kind: 'event',
    when: '2023',
    href: 'https://createwithplay.com',
    external: true,
  },

  // —— Career: Webflow ——
  {
    id: 'webflow-head-of-design',
    title: 'Webflow',
    role: 'Head of Design',
    summary:
      'First Head of Design — building the design function as Webflow scaled its vision for a more expressive, accessible internet.',
    kind: 'role',
    when: '2018–2022',
  },

  {
    id: 'config-2021-scaling-design',
    title: 'Config 2021: The Universal Challenges of Every Scaling Design Team',
    kind: 'talk',
    when: '2021',
    href: 'https://www.youtube.com/watch?v=piGC-iFwmrk&t=45s',
    external: true,
  },

  {
    id: 'proof-of-concept-launch',
    title: 'Launched Proof of Concept',
    kind: 'event',
    when: '2019',
    href: 'https://www.proofofconcept.pub',
    external: true,
  },

  // —— Career: One Medical ——
  {
    id: 'one-medical',
    title: 'One Medical',
    role: 'Head of Product Design',
    summary:
      'Led product design through the shift to virtual care and the company’s IPO.',
    kind: 'role',
    when: '2015–2018',
  },

  // —— Portfolio placeholders (lines until case studies ship) ——
  {
    id: 'inspirato',
    title: 'Inspirato',
    summary: 'Product design with Black Pixel.',
    kind: 'portfolio',
    when: '2015',
  },
  {
    id: 'twitter-camera',
    title: 'Twitter Camera',
    summary: 'Selected product work on Twitter’s camera experience.',
    kind: 'portfolio',
    when: '—',
  },
];
