import { describe, expect, it } from 'vitest';
import {
  commandPalettePages,
  discoverableStaticPages,
  footerSections,
  mobileSecondaryNavItems,
} from '../src/data/navigation';
import { rankCommandPaletteItems } from '../src/utils/commandPaletteSearch';

const secondaryPaths = ['/works', '/cv', '/thesis', '/prototypes', '/design-resources'];

describe('secondary page discovery', () => {
  it.each(secondaryPaths)('exposes %s in every human discovery surface', (path) => {
    expect(commandPalettePages.some((page) => page.path === path)).toBe(true);
    expect(mobileSecondaryNavItems.some((page) => page.path === path)).toBe(true);
    expect(footerSections.some((section) => section.links.some((link) => link.href === path))).toBe(
      true,
    );
  });

  it.each(secondaryPaths)('keeps %s in the machine-readable index', (path) => {
    expect(discoverableStaticPages.some((page) => page.path === path)).toBe(true);
  });
});

describe('publication discovery', () => {
  it.each(['Proof of Concept', 'Design GM', 'business of design'])(
    'finds the subscription destination for %s',
    (query) => {
      const matches = rankCommandPaletteItems(query, [...commandPalettePages]);
      expect(matches.some((page) => page.path === '/subscribe')).toBe(true);
    },
  );
});
