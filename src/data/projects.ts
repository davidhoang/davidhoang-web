/**
 * Build-in-public software on /projects.
 *
 * Unlisted: not in top nav, footer, or ⌘K. Reachable by URL only.
 * Add entries here as new public experiments ship.
 */
export type BuildInPublicProject = {
  id: string;
  title: string;
  builtWith: string;
  summary: string;
  href: string;
  hrefLabel: string;
  links?: { label: string; href: string }[];
};

export const projects: BuildInPublicProject[] = [
  {
    id: 'tapestry',
    title: 'Tapestry',
    builtWith: 'Replit',
    summary:
      'High-touch design recruiting for the intelligence era — a personal talent CRM with AI matching, curated lists, and an MCP server so recommendations stay a conversation, not a spreadsheet.',
    href: 'https://tapestry-dh-design.replit.app',
    hrefLabel: 'Open Tapestry',
    links: [
      { label: 'GitHub', href: 'https://github.com/davidhoang/tapestry' },
      { label: 'Notes on the rewrite', href: 'https://www.proofofconcept.pub/p/re-writing-tapestry-for-ai-workflows' },
    ],
  },
  {
    id: 'members',
    title: 'members.proofofconcept.pub',
    builtWith: 'Astro, Clerk, Stripe',
    summary:
      'The members portal for Proof of Concept subscribers — sign-in, archives, essays, and exclusive resources off the public newsletter.',
    href: 'https://members.proofofconcept.pub',
    hrefLabel: 'Open members portal',
  },
];
