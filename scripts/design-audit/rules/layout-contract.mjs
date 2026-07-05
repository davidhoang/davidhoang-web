import { join } from 'path';
import { ROOT, readContent } from '../shared.mjs';

/** Canonical layout contract — if these disappear, heroes regress (design.md § Hero image padding) */
export const LAYOUT_CONTRACT = [
  {
    file: 'src/styles/modules/layout.css',
    rule: 'hero-layout-contract',
    mustInclude: [
      'main#main-content:has(> :is(.page-header--image',
      'padding-top: 0',
      'width: 100vw',
      'margin-inline: calc(50% - 50vw)',
    ],
  },
  {
    file: 'src/layouts/MainLayout.astro',
    rule: 'hero-critical-css',
    mustInclude: [
      'main#main-content:has(> .page-header--image)',
      'width: 100vw',
      'margin-inline: calc(50% - 50vw)',
      'nav.glass-border.site-nav',
      'position: fixed',
    ],
  },
  {
    file: 'src/styles/modules/nav.css',
    rule: 'nav-fixed-contract',
    mustInclude: ['.site-nav.glass-border', 'position: fixed'],
  },
  {
    file: 'src/styles/modules/shared-components.css',
    rule: 'glass-border-nav-contract',
    mustInclude: ['.glass-border:not(.site-nav)'],
  },
  {
    file: 'src/styles/modules/theme-variations.css',
    rule: 'shader-hero-padding-contract',
    mustInclude: [
      'main.container:has(> :is(.page-header--image',
      'padding-top: 0',
    ],
  },
];

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditLayoutContract(ctx) {
  for (const { file, rule, mustInclude } of LAYOUT_CONTRACT) {
    const full = join(ROOT, file);
    const content = readContent(full);
    for (const needle of mustInclude) {
      if (!content.includes(needle)) {
        ctx.addContractViolation(
          full,
          rule,
          `${file} must include layout contract fragment: ${needle}`,
        );
      }
    }
  }
}
