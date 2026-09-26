/**
 * Work index — career role cards, talk/event lines, and a side-project gallery.
 * Case studies can later live at paths like /work/slug.
 */
export type WorkKind = 'role' | 'talk' | 'event';

/** How the stream entry renders on /work */
export type WorkPresentation = 'card' | 'line';

export type WorkShaderPalette = {
  light: { front: string; back: string };
  dark: { front: string; back: string };
};

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
  /** Paper dither palette for this career card (light / dark). */
  shader?: WorkShaderPalette;
  /** Paper dither animation speed for this card. Lower is slower. */
  shaderSpeed?: number;
  href?: string;
  external?: boolean;
};

/** Side projects shown in the /work gallery and at /work/[slug]. */
export type WorkProject = {
  slug: string;
  title: string;
  /** Short line on the gallery tile */
  summary: string;
  /** One-paragraph stub on the detail page */
  description: string;
  /** `/images/...` path resolved via astro:assets */
  image?: string;
  imageAlt?: string;
  /** Public product URL shown on the detail page only */
  externalUrl?: string;
  externalLabel?: string;
};

export function workProjectPath(project: WorkProject): string {
  return `/work/${project.slug}`;
}

export function getWorkProject(slug: string): WorkProject | undefined {
  return workProjects.find((project) => project.slug === slug);
}

export function workPresentation(entry: WorkEntry): WorkPresentation {
  return entry.kind === 'role' ? 'card' : 'line';
}

const WORK_KIND_LABELS: Record<WorkKind, string> = {
  role: 'Role',
  talk: 'Talk',
  event: 'Event',
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
    when: '2024-Present',
    shaderSpeed: 0.019,
    shader: {
      light: { front: '#0052CC', back: '#F7FAFF' },
      dark: { front: '#4C8DDB', back: '#0D2137' },
    },
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
    shaderSpeed: 0.044,
    shader: {
      light: { front: '#E23600', back: '#FFF7F3' },
      dark: { front: '#E07A55', back: '#1C1410' },
    },
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
    shaderSpeed: 0.028,
    shader: {
      light: { front: '#0B5CDB', back: '#F6F9FF' },
      dark: { front: '#4A8AE8', back: '#0A1628' },
    },
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
    shaderSpeed: 0.061,
    shader: {
      light: { front: '#004742', back: '#F4FAF9' },
      dark: { front: '#4A9A94', back: '#0A1F1D' },
    },
  },

  // —— Career: Black Pixel ——
  {
    id: 'black-pixel',
    title: 'Black Pixel',
    role: 'Director of Design, Mobile',
    summary:
      'Led a remote design team for Android and iOS client work, pitching ESPN, Inspirato, The New York Times, and Twitter.',
    kind: 'role',
    when: '2014–2015',
    shaderSpeed: 0.023,
    shader: {
      light: { front: '#1A1A1A', back: '#FAFAFA' },
      dark: { front: '#C8C8C8', back: '#161616' },
    },
  },

  // —— Career: HTC ——
  {
    id: 'htc',
    title: 'HTC',
    role: 'Lead Designer, Global Digital Creative',
    summary:
      'Led design for brand and marketing — UX, research, and creative direction.',
    kind: 'role',
    when: '2014–2015',
    shaderSpeed: 0.052,
    shader: {
      light: { front: '#5F9A28', back: '#F6FAEF' },
      dark: { front: '#8FBF55', back: '#142010' },
    },
  },

  // —— Career: ExactTarget ——
  {
    id: 'exacttarget',
    title: 'ExactTarget',
    role: 'Design Consultant, Global Accounts',
    summary:
      'Designed and built email campaigns for ExactTarget’s largest accounts — Anthem, Expedia, Hotels.com, Microsoft, and Nike.',
    kind: 'role',
    when: '2009–2011',
    shaderSpeed: 0.034,
    shader: {
      light: { front: '#C86A1A', back: '#FFF8F0' },
      dark: { front: '#D4A05A', back: '#24180C' },
    },
  },
];

/** Small gallery of side projects. Newest first. */
export const workProjects: WorkProject[] = [
  {
    slug: 'proof-of-concept',
    title: 'Proof of Concept',
    summary: 'Weekly newsletter and member library on design, technology, and building things.',
    description:
      'Proof of Concept connects design, technology, and the work of making things. Members get the weekly newsletter and a practical library built to help ideas travel further.',
    image: '/images/highlights/img-highlights-proof-of-concept.webp',
    imageAlt: 'Proof of Concept newsletter branding and layout',
    externalUrl: 'https://members.proofofconcept.pub',
    externalLabel: 'members.proofofconcept.pub',
  },
  {
    slug: 'tapestry',
    title: 'Tapestry',
    summary: 'High-touch design recruiting for the intelligence era.',
    description:
      'A personal CRM of designers — directory, shareable lists, and AI recommendations — built to help make better introductions, not replace them.',
    image: '/images/works/works-tapestry.webp',
    imageAlt: 'Tapestry recruiting directory and match interface',
    externalUrl: 'https://tapestry.design',
    externalLabel: 'tapestry.design',
  },
  {
    slug: 'dhos',
    title: 'dhOS',
    summary: 'A personal operating system for productivity, knowledge, and daily briefs.',
    description:
      'A personal operating system for productivity, knowledge management, and daily executive briefs. It brings Obsidian, Google Calendar/Gmail, and Airtable into a unified dashboard. The project is still private.',
  },
];
