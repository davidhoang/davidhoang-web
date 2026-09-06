/**
 * Build-in-public software on /projects.
 *
 * Unlisted: not in top nav, footer, or ⌘K. Reachable by URL only.
 * Add entries here as new public experiments ship.
 */

/** Picks the Paper Design shader rendered as the tile artwork. */
export type ProjectShaderVariant = 'weave' | 'mesh';

export type ProjectMeta = {
  label: string;
  value: string;
};

export type BuildInPublicProject = {
  id: string;
  title: string;
  tagline: string;
  summary: string;
  meta: ProjectMeta[];
  href: string;
  hrefLabel: string;
  links?: { label: string; href: string }[];
  shader: ProjectShaderVariant;
};

export const projects: BuildInPublicProject[] = [
  {
    id: 'tapestry',
    title: 'Tapestry',
    tagline: 'High-touch design recruiting for the intelligence era',
    summary:
      'A personal talent CRM with AI matching and curated lists, rewritten as an MCP server so recommendations stay a conversation instead of a spreadsheet.',
    meta: [
      { label: 'Built with', value: 'Replit' },
      { label: 'Stack', value: 'React, Express, Postgres, OpenAI' },
      { label: 'Surface', value: 'Web app, mobile API, MCP server' },
      { label: 'Started', value: '2025' },
    ],
    href: 'https://tapestry-dh-design.replit.app',
    hrefLabel: 'Open Tapestry',
    links: [
      { label: 'GitHub', href: 'https://github.com/davidhoang/tapestry' },
      {
        label: 'Notes on the rewrite',
        href: 'https://www.proofofconcept.pub/p/re-writing-tapestry-for-ai-workflows',
      },
    ],
    shader: 'weave',
  },
  {
    id: 'members',
    title: 'members.proofofconcept.pub',
    tagline: 'The members portal for Proof of Concept',
    summary:
      'Sign-in, archives, essays, and subscriber-only resources living alongside the public newsletter.',
    meta: [
      { label: 'Built with', value: 'Astro' },
      { label: 'Stack', value: 'Astro, Clerk, Stripe, Vercel' },
      { label: 'Surface', value: 'Members web portal' },
      { label: 'Started', value: '2026' },
    ],
    href: 'https://members.proofofconcept.pub',
    hrefLabel: 'Open members portal',
    links: [{ label: 'Proof of Concept', href: 'https://www.proofofconcept.pub' }],
    shader: 'mesh',
  },
];
