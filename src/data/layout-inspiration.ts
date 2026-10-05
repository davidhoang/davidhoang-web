/**
 * External layout and interaction references — inspiration for site experiments.
 * Implementations on davidhoang.com are custom; these sources inform motion and spatial patterns.
 */
export type LayoutInspirationSource = {
  name: string;
  url: string;
  description: string;
  /** shadcn / registry ids we have installed or studied */
  components?: string[];
};

export const layoutInspirationSources: LayoutInspirationSource[] = [
  {
    name: 'useLayouts',
    url: 'https://uselayouts.com',
    description:
      'Free animated React layout primitives (infinite pan grids, bento heroes, toolbars). Reference for interaction; ship site-native CSS and tokens in production.',
    components: ['infinite-grid'],
  },
];
