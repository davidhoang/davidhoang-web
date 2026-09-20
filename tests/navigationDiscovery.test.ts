import { describe, expect, it } from 'vitest';
import { runningExperiments } from '../src/data/experiments';
import {
  commandPalettePages,
  discoverableStaticPages,
  footerSections,
  mobileSecondaryNavItems,
} from '../src/data/navigation';

const secondaryPaths = ['/works', '/cv', '/thesis', '/experiments', '/design-resources'];

/** Reachable from the experiments hub instead of their own nav/footer entries. */
const hubbedPaths = ['/prototypes', '/daily-themes'];

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

  it.each(hubbedPaths)('reaches %s through the experiments hub and ⌘K', (path) => {
    expect(runningExperiments.some((experiment) => experiment.href === path)).toBe(true);
    expect(commandPalettePages.some((page) => page.path === path)).toBe(true);
  });
});
