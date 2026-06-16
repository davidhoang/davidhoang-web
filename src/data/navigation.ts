export const navItems = [
  { path: '/about', label: 'About' },
  { path: '/writing', label: 'Writing' },
  { path: '/notes', label: 'Notes' },
  { path: '/featured', label: 'Featured' },
  { path: '/advising', label: 'Advising' },
  { path: '/subscribe', label: 'Subscribe' },
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
] as const;
