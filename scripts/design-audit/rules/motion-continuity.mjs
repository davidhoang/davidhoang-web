import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ROOT, rel } from '../shared.mjs';

/**
 * Core motion-continuity contract for homepage hero cards.
 * Prevents reintroducing remount-on-hover / iPad Magic Keyboard flicker
 * (design.md § Motion continuity — regression from PR #104 → animPlayKey remount).
 */

const HERO_LAYOUTS = [
  'src/components/hero/layouts/StackedFanLayout.tsx',
  'src/components/hero/layouts/EditorialLayout.tsx',
  'src/components/hero/layouts/ScatteredLayout.tsx',
  'src/components/hero/layouts/RolodexLayout.tsx',
  'src/components/hero/layouts/CinematicLayout.tsx',
];

const CONTRACT_FILES = [
  {
    file: 'src/components/hero/CardBase.tsx',
    rule: 'hero-motion-continuity',
    mustInclude: ['loadActiveMedia', 'data-visible', 'card-hero-image--drift'],
    mustNotMatch: [
      {
        pattern: /\banimPlayKey\b/,
        detail:
          'Do not remount hero media with animPlayKey — keep layered still/active media (design.md § Motion continuity)',
      },
      {
        pattern: /key=\{`hero-anim-/,
        detail:
          'Do not remount hero media via key={`hero-anim-…`} on hover (design.md § Motion continuity)',
      },
      {
        pattern: /isHeroMediaActive\s*\?\s*['"]card-hero-image--drift['"]/,
        detail:
          'Do not toggle .card-hero-image--drift with isHeroMediaActive — apply drift once loaded (design.md § Motion continuity)',
      },
    ],
  },
  {
    file: 'src/components/CardStackHero.tsx',
    rule: 'hero-motion-continuity',
    mustInclude: ['createStableCardHoverSetter'],
    mustNotMatch: [],
  },
  {
    file: 'src/components/hero/cardHover.ts',
    rule: 'hero-motion-continuity',
    mustInclude: [
      'handleCardHoverLeave',
      'createStableCardHoverSetter',
      'isPointerInsideCardsWrapper',
      'elementFromPoint',
    ],
    mustNotMatch: [],
  },
  {
    file: 'src/utils/viewport-capabilities.ts',
    rule: 'hero-motion-continuity',
    mustInclude: ['shouldEnablePointerHoverMotion', 'data-hover-motion'],
    mustNotMatch: [],
  },
  {
    file: 'src/layouts/MainLayout.astro',
    rule: 'hero-motion-continuity',
    mustInclude: ['data-hover-motion', 'any-hover: hover'],
    mustNotMatch: [],
  },
  {
    file: 'design.md',
    rule: 'hero-motion-continuity',
    mustInclude: ['No remount-on-hover', 'animPlayKey', 'shouldEnablePointerHoverMotion'],
    mustNotMatch: [],
  },
];

function lineOf(content, index) {
  if (index < 0) return 1;
  return content.slice(0, index).split('\n').length;
}

/** @param {ReturnType<import('../shared.mjs').createContext>} ctx */
export function auditHeroMotionContinuity(ctx) {
  for (const entry of CONTRACT_FILES) {
    const full = join(ROOT, entry.file);
    if (!existsSync(full)) {
      ctx.addContractViolation(full, entry.rule, `${entry.file} is required for hero motion continuity`);
      continue;
    }

    // Contract files are always audited (not subject to changed-only UI filtering /
    // grandfather lists) — this is the regression safety net.
    const content = readFileSync(full, 'utf-8');

    for (const needle of entry.mustInclude) {
      if (!content.includes(needle)) {
        ctx.addContractViolation(
          full,
          entry.rule,
          `${entry.file} must include \`${needle}\` (design.md § Motion continuity)`,
        );
      }
    }

    for (const { pattern, detail } of entry.mustNotMatch) {
      const match = content.match(pattern);
      if (match) {
        ctx.addViolation(full, lineOf(content, match.index ?? 0), entry.rule, detail);
      }
    }
  }

  for (const file of HERO_LAYOUTS) {
    const full = join(ROOT, file);
    if (!existsSync(full)) {
      ctx.addContractViolation(full, 'hero-motion-continuity', `${file} is required`);
      continue;
    }
    const content = readFileSync(full, 'utf-8');
    if (!content.includes('usePointerHoverMotionEnabled')) {
      ctx.addContractViolation(
        full,
        'hero-motion-continuity',
        `${rel(full)} must gate hover with usePointerHoverMotionEnabled() (design.md § Motion continuity)`,
      );
    }

    // Catch ungated featured/hover enter handlers that ignore data-hover-motion
    // (e.g. CinematicLayout FeaturedCard while FilmstripCard was already gated).
    const ungatedHoverEnter =
      /onMouseEnter=\{\(\)\s*=>\s*!selectedCard\s*&&\s*onCardHover\s*\(/.exec(content);
    if (ungatedHoverEnter) {
      ctx.addViolation(
        full,
        lineOf(content, ungatedHoverEnter.index ?? 0),
        'hero-motion-continuity',
        `${rel(full)} has ungated onMouseEnter→onCardHover — require !hoverDisabled / usePointerHoverMotionEnabled (design.md § Motion continuity)`,
      );
    }
  }
}
