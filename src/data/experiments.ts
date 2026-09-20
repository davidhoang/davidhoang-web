/**
 * Experiments hub (/experiments).
 *
 * The hub is the single listed entry point; individual experiments stay
 * unlisted (see searchIndexConfig.ts) so they can change or break without
 * churning ⌘K, the sitemap, or llms.txt.
 */
export type Experiment = {
  id: string;
  title: string;
  href: string;
  summary: string;
  /** Short qualifier shown next to the title — what kind of thing this is. */
  kind: string;
};

export const runningExperiments: Experiment[] = [
  {
    id: 'daily-themes',
    title: 'Daily themes',
    href: '/daily-themes',
    kind: 'Generative design system',
    summary:
      'A new palette, type pairing, and surface treatment generated every morning, then checked against the layout and contrast rules before it ships. Browse the archive, or switch themes from the palette button in the corner of any page.',
  },
  {
    id: 'jev-editorial-router',
    title: 'Jev editorial router',
    href: '/experiments/jev-editorial-router',
    kind: 'Typed model output',
    summary:
      'Paste a rough idea and get a typed decision back — Writing, Notes, or Projects — with the full probability distribution, a readiness score, and a check for whether the idea makes a clear claim.',
  },
  {
    id: 'greco-diorama',
    title: 'Clay diorama',
    href: '/experiments/greco-diorama',
    kind: 'WebGL scene',
    summary:
      'A soft-clay desert house you can spin, and the Blender-to-GLB pipeline behind the interactive homes on Now.',
  },
  {
    id: 'prototypes',
    title: 'Prototypes',
    href: '/prototypes',
    kind: 'Editorial visuals',
    summary:
      'Standalone proof-of-concept visuals built for Proof of Concept essays, starting with the plate tectonics of design leadership.',
  },
];

export const retiredExperiments: Experiment[] = [
  {
    id: 'labs',
    title: 'Labs',
    href: '/labs',
    kind: 'Retired',
    summary:
      'The original playground of interactive demos and generative previews. Paused — the page stays up for old links.',
  },
];
