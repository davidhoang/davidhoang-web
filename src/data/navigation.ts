/** Primary top nav links — keep this list short; see Footer.astro for footer-only pages. */
export const navItems = [
  { path: '/about', label: 'About' },
  { path: '/writing', label: 'Writing' },
  { path: '/featured', label: 'Featured' },
  { path: '/subscribe', label: 'Subscribe' },
] as const;

/** Pages shown in the mobile full-screen menu below primary nav links */
export const mobileSecondaryNavItems = [
  { path: '/now', label: 'Now' },
  { path: '/notes', label: 'Notes' },
  { path: '/career-odyssey', label: 'Career Odyssey' },
  { path: '/investing', label: 'Investing' },
  { path: '/advising', label: 'Advising' },
  { path: '/works', label: 'Works' },
  { path: '/art-collection', label: 'Art Collection' },
  { path: '/daily-themes', label: 'Daily Themes' },
] as const;

export const commandPalettePages = [
  { title: 'About', description: 'About David Hoang', path: '/about', type: 'page' },
  { title: 'Writing', description: 'Essays and articles', path: '/writing', type: 'page' },
  { title: 'Featured', description: 'Featured work and press', path: '/featured', type: 'page' },
  { title: 'Subscribe', description: 'Subscribe to updates', path: '/subscribe', type: 'page' },
  { title: 'Now', description: 'What David is doing now', path: '/now', type: 'page' },
  { title: 'Career Odyssey', description: 'Career journey and timeline', path: '/career-odyssey', type: 'page' },
  { title: 'Notes', description: 'Digital garden notes', path: '/notes', type: 'page' },
  { title: 'Investing', description: 'Angel investments and advisory', path: '/investing', type: 'page' },
  { title: 'Advising', description: 'Limited advising for Heads of Design at growth startups', path: '/advising', type: 'page' },
  { title: 'Works', description: 'Selected work and projects', path: '/works', type: 'page' },
  { title: 'Art Collection', description: 'Curated artwork collection', path: '/art-collection', type: 'page' },
  { title: 'Daily Themes', description: 'AI-generated daily themes explorer', path: '/daily-themes', type: 'page' },
] as const;

export const footerBrand = {
  tagline: 'Design, writing, and experiments.',
  emailHref: 'mailto:david@davidhoang.com',
} as const;

export const footerSections = [
  {
    title: 'Practice',
    links: [
      { href: '/about', label: 'About', ariaLabel: 'About David Hoang', external: false },
      { href: '/featured', label: 'Featured', ariaLabel: 'Featured work and press', external: false },
      { href: '/advising', label: 'Advising', ariaLabel: 'Advising for design leaders', external: false },
      { href: '/career-odyssey', label: 'Career Odyssey', ariaLabel: 'Career Odyssey', external: false },
      {
        href: 'https://curius.app/david-hoang',
        label: 'Curius',
        ariaLabel: 'David Hoang on Curius (opens in new tab)',
        external: true,
      },
      { href: '/design-resources', label: 'Design Resources', ariaLabel: 'Design resources and tools', external: false },
    ],
  },
  {
    title: 'Writing',
    links: [
      { href: '/writing', label: 'Writing', ariaLabel: 'Writing', external: false },
      { href: '/notes', label: 'Notes', ariaLabel: 'Digital garden notes', external: false },
      { href: '/now', label: 'Now', ariaLabel: 'What David is doing now', external: false },
      { href: '/subscribe', label: 'Subscribe', ariaLabel: 'Subscribe to updates', external: false },
      { href: '/rss.xml', label: 'RSS', ariaLabel: 'Writing RSS feed', external: false },
      {
        href: 'https://www.proofofconcept.pub',
        label: 'Newsletter',
        ariaLabel: 'Proof of Concept newsletter (opens in new tab)',
        external: true,
      },
      {
        href: 'http://blog.davidhoang.com',
        label: 'Personal Blog',
        ariaLabel: "David Hoang's personal blog (opens in new tab)",
        external: true,
      },
      {
        href: 'https://substack.com/@davidhoang/notes',
        label: 'Substack Notes',
        ariaLabel: "David Hoang's Substack Notes (opens in new tab)",
        external: true,
      },
    ],
  },
  {
    title: 'Connect',
    links: [
      {
        href: 'https://linkedin.com/in/dhoang2',
        label: 'LinkedIn',
        ariaLabel: 'David Hoang on LinkedIn (opens in new tab)',
        external: true,
      },
      {
        href: 'https://twitter.com/davidhoang',
        label: 'Twitter',
        ariaLabel: 'David Hoang on Twitter (opens in new tab)',
        external: true,
      },
      {
        href: 'https://github.com/davidhoang',
        label: 'GitHub',
        ariaLabel: 'David Hoang on GitHub (opens in new tab)',
        external: true,
      },
      {
        href: 'https://sublime.app/davidhoang',
        label: 'Sublime',
        ariaLabel: 'David Hoang on Sublime (opens in new tab)',
        external: true,
      },
    ],
  },
] as const;
